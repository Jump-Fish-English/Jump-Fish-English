use std::{cell::RefCell, collections::HashMap, path::PathBuf};
use oas3::spec::{ObjectOrReference::{self, Object, Ref}, Schema, SchemaType};
use crate::{diff_paths::diff_path, InMemoryFile, InputState, NamedReferenceOrSchema};

const SCHEMA_NAME_DIRECTIVE: &str = "{name}";

pub struct NamedSchemaGenerateResult {
  name: String,
  path: PathBuf,
}

struct ImportDefinition {
  path: PathBuf,
  identifiers: HashMap<String, bool>,
}

pub struct GenerateState<'a> {
  path: PathBuf,
  import_statements: HashMap<PathBuf, RefCell<ImportDefinition>>,
  files: &'a mut Vec<InMemoryFile>,
  input_state: &'a InputState,
}

impl GenerateState<'_> {
  pub fn add_import(&mut self, identifier: String, path: &PathBuf) {

    match &mut self.import_statements.get(path) {
      Some(existing_import_statement) => {
        if existing_import_statement.borrow().identifiers.contains_key(&identifier) {
          return;
        }
  
        existing_import_statement.borrow_mut().identifiers.insert(String::from(&identifier), true);
        return;
      },
      None => {
        let mut identifiers_map: HashMap<String, bool> = HashMap::new();
        identifiers_map.insert(String::from(identifier), true);
        self.import_statements.insert(path.to_path_buf(), RefCell::new(
          ImportDefinition {
            path: path.to_path_buf(),
            identifiers: identifiers_map,
          }
        ));
      }
    }
    
  }

  pub fn collect_import_statements(&self) -> Vec<String> {
    let mut statements: Vec<String> = vec![];
    for decl in &self.import_statements {
      let identifiers: Vec<String> = decl.1.borrow().identifiers.keys().map(|name| format!("type {}", &name)).collect();
      if let Some(relative_path) = diff_path(decl.0, &self.path) {
        let statement = format!("import {{ {} }} from '{}';", identifiers.join(", "), relative_path.to_string_lossy().replace(".ts", ""));
        statements.push(statement);
      }
    }

    return statements;
  }
}

fn named_schema_output_path(schema_name: &String, state: &InputState) -> PathBuf {
  return PathBuf::from(
    state.dir.join(&state.configuration.output.schemas).to_string_lossy().replace(SCHEMA_NAME_DIRECTIVE, &schema_name)
  );
}

pub fn generate_named_schema_interface(schema: &NamedReferenceOrSchema, state: &InputState, files: &mut Vec<InMemoryFile>) -> NamedSchemaGenerateResult {
  let schema_name = &schema.name;
  let mut gen_state = GenerateState {
    path: named_schema_output_path(&schema_name, &state),
    import_statements: HashMap::new(),
    input_state: state,
    files,
  };

  let children = generate_reference_or_schema(&schema.def, &mut gen_state);

  
  let import_statement_statements = gen_state.collect_import_statements().join("\n");

  let source = format!("
    {}

    export type {} = {{
      {}
    }}
  ", import_statement_statements, schema.name, children);

  files.push(
    InMemoryFile {
      path: named_schema_output_path(&schema_name, &state),
      contents: source,
    }
  );

  return NamedSchemaGenerateResult{
    name: String::from(schema_name),
    path: named_schema_output_path(&schema_name, &state),
  };
}

fn generate_ref_shape(ref_path: &String, generate_state: &mut GenerateState) -> String {
  let shape_name = String::from("Instance");
  if let Some(schema) = generate_state.input_state.doc.components.schemas.get(&shape_name) {
    let result = generate_named_schema_interface(schema, generate_state.input_state, generate_state.files);
    generate_state.add_import(String::from("Instance"), &result.path);
    return result.name;
  }
  
  return String::from("unknown");
}

pub fn generate_reference_or_schema(schema: &ObjectOrReference<Schema>, generate_state: &mut GenerateState) -> String {
  let resolved = match schema {
    Ref {
      ref_path
    } => {
      return generate_ref_shape(ref_path, generate_state);
    }
    Object(schema) => schema
  };

  return generate_schema_interface(resolved, generate_state);
}

pub fn generate_schema_interface(schema: &Schema, generate_state: &mut GenerateState) -> String {
  if let Some(kind) = &schema.schema_type {
    return match kind {
      SchemaType::String => String::from("string"),
      SchemaType::Number => String::from("number"),
      SchemaType::Boolean => String::from("boolean"),
      SchemaType::Object => generate_object_schema_interface(schema, generate_state),
      _ => String::from("unknown"),
    };
  }

  return String::from("");
  
}

pub fn generate_object_schema_interface(schema: &Schema, generate_state: &mut GenerateState) -> String {
  let mut propertyStatements: Vec<String> = Vec::new();

  for prop in &schema.properties {
    propertyStatements.push(
      format!("{}: {};", &prop.0, generate_reference_or_schema(prop.1, generate_state)),
    )
  }

  return propertyStatements.join("\n");
}
