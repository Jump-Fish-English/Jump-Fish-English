use clap::Parser;
use generate::generate_named_schema_interface;
use std::{collections::HashMap, env, error::Error, fs::{read_to_string, create_dir_all, write}, path::PathBuf};
use serde::{Deserialize, Serialize};
use oas3::spec::{ObjectOrReference, Schema};
mod generate;
mod diff_paths;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    config: String,

    #[arg(short, long)]
    file: String,

    #[arg(long)]
    schema: Option<String>,
}


#[derive(Serialize, Deserialize, Debug)]
struct OutputConfiguration {
  schemas: String,
}


#[derive(Serialize, Deserialize, Debug)]
struct ConfigurationFile {
  output: OutputConfiguration,
}


#[derive(Debug)]
struct InputState {
  dir: PathBuf,
  doc: SwaggerDocument,
  configuration: ConfigurationFile,
  generation_options: GenerationOptions,
}

#[derive(Debug)]
struct NamedReferenceOrSchema {
  name: String,
  def: ObjectOrReference<Schema>,
}

#[derive(Debug)]
struct SwaggerDocumentComponents {
  schemas: HashMap<String, NamedReferenceOrSchema>,
}

#[derive(Debug)]
struct SwaggerDocument {
  components: SwaggerDocumentComponents,
}

#[derive(Debug, PartialEq)]
struct InMemoryFile {
  path: PathBuf,
  contents: String,
}

#[derive(Debug)]
struct InMemoryFileSystem {
  files: Vec<InMemoryFile>
}

#[derive(Debug)]
struct GenerationOptions {
  schema: Option<String>,
}




fn main() {
  let args = Args::parse();
  let input_state_result = parse_input_state(&args);
  match input_state_result {
    Ok(input_state) => {
      let fs = generate(input_state);
      match write_generated_files(fs) {
        Ok(_) => {},
        Err(err) => {
          dbg!(err);
        }
      }
    }, 
    Err(err) => {
      dbg!(err);
    }
  };
}

fn write_generated_files(fs: InMemoryFileSystem) -> Result<(), Box<dyn Error>> {
  for virtual_file in fs.files {
    let mut dir = PathBuf::from(&virtual_file.path);
    dir.pop();
    create_dir_all(dir)?;
    write(&virtual_file.path, &virtual_file.contents)?;
  }
  return Ok(());
}

fn parse_input_state(args: &Args) -> Result<InputState, Box<dyn Error>> {
  let current_dir = env::current_dir()?;
  let config_path = &current_dir.join(&args.config);
  let source_file_path = &current_dir.join(&args.file);
  let contents = std::fs::read_to_string(source_file_path)?;
  let doc = create_swagger_document_def(contents)?;
  return create_input_state(
    args,
    doc,
    current_dir, 
    config_path.to_path_buf()
  );
}

fn create_swagger_document_def(contents: String) -> Result<SwaggerDocument, Box<dyn Error>> {
  let mut schema_map: HashMap<String, NamedReferenceOrSchema> = HashMap::new();
  let spec = oas3::from_reader(contents.as_bytes())?;

  match spec.components {
    Some(components) => {
      for s in components.schemas {
        let schema_name = &s.0;
        let schema = s.1;
        schema_map.insert(schema_name.to_string(), NamedReferenceOrSchema {
          name: schema_name.to_string(),
          def: schema
      });
      }
    },
    None => {}
  }
  
  let doc = SwaggerDocument {
    components: SwaggerDocumentComponents {
      schemas: schema_map,
    }
  };
  return Ok(
    doc
  )
}

fn parse_config_file(config_path: &PathBuf) -> Result<ConfigurationFile, Box<dyn Error>> {
  let contents = read_to_string(config_path)?;
  let parsed: ConfigurationFile = serde_json::from_str(contents.as_str())?;
  return Ok(
    parsed
  );
}

fn create_input_state(args: &Args, doc: SwaggerDocument, dir: PathBuf, config_path: PathBuf) -> Result<InputState, Box<dyn Error>> {
  return Ok(
    InputState {
      dir,
      doc,
      configuration: parse_config_file(&config_path)?,
      generation_options: GenerationOptions {
        schema: args.schema.to_owned()
      }
    }
  )
}

fn generate(state: InputState) -> InMemoryFileSystem {
  let doc = &state.doc;
  let mut files: Vec<InMemoryFile> = Vec::new();
  
  match &state.generation_options.schema {
    Some(schema_name) => {
      if let Some(schema) = doc.components.schemas.get(schema_name) {
        generate_named_schema_interface(schema, &state, &mut files);
      }
    },
    None => {},
  }

  let fs = InMemoryFileSystem {
    files,
  };

  return fs;
}


#[cfg(test)]
mod write_files {
    use super::*;

    #[test]
    fn test_generate() {
      let result = generate(
        InputState {
          generation_options: GenerationOptions {
            schema: Some(String::from("Test"))
          },
          dir: PathBuf::new().join("/path"),
          doc: create_swagger_document_def(String::from(
            r#"
              openapi: 3.0.0
              info:
                title: Swagger Validator Badge
                description: Parses and validates a Swagger/OpenAPI 2.0 or an OpenAPI 3.x definition
                version: 2.1.5
              paths:
              components:
                schemas:
                  Test:
                    type: object
                    properties:
                      id:
                        type: string
            "#
          )).unwrap(),
          configuration: ConfigurationFile {
            output: OutputConfiguration {
              schemas: String::from("src/{name}.ts")
            }
          },
        }
      );

      let files = result.files;

      assert_eq!(
        files.len(),
        1,
      );

      assert_eq!(
        files.get(0).unwrap().path,
        PathBuf::from("/path/src/Test.ts")
      );
    }
}