use clap::Parser;
use std::{collections::HashMap, env, error::Error, fs, path::PathBuf};
use serde::{Deserialize, Serialize};
use oas3::spec::{Schema,ObjectOrReference};

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

const SCHEMA_NAME_DIRECTIVE: &str = "{name}";


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
  match env::current_dir() {
    Ok(current_dir) => {
      let args = Args::parse();
      let config_path = &current_dir.join(args.config);
      let source_file_path = &current_dir.join(args.file);
      let contents = std::fs::read_to_string(source_file_path);
      match contents {
          Ok(string) => {
            match create_swagger_document_def(string) {
              Ok(doc) => {
                let generation_options = create_generation_options(
                  doc,
                  current_dir, 
                  config_path.to_path_buf()
                );
              }
              Err(err) => {
                dbg!(err);
              }
              
            }
          },
          Err(_) => {

          }
      }
    },
    Err(err) => {
      dbg!(err);
    }
  }
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
  let contents = fs::read_to_string(config_path)?;
  let parsed: ConfigurationFile = serde_json::from_str(contents.as_str())?;
  return Ok(
    parsed
  );
}

fn create_generation_options(doc: SwaggerDocument, dir: PathBuf, config_path: PathBuf) -> Result<InputState, Box<dyn Error>> {
  return Ok(
    InputState {
      dir,
      doc,
      configuration: parse_config_file(&config_path)?
    }
  )
}

fn named_schema_output_path(schema_name: &String, state: &InputState) -> PathBuf {
  return PathBuf::from(
    state.dir.join(&state.configuration.output.schemas).to_string_lossy().replace(SCHEMA_NAME_DIRECTIVE, &schema_name)
  );
}

fn generate(options: &GenerationOptions, state: &InputState) -> Result<InMemoryFileSystem, Box<dyn Error>> {
  let doc = &state.doc;
  let mut files: Vec<InMemoryFile> = Vec::new();
  
  match &options.schema {
    Some(schema_name) => {
      files.push(
        InMemoryFile {
          path: named_schema_output_path(&schema_name, &state),
          contents: String::from(""),
        }
      )
    },
    None => {},
  }

  let fs = InMemoryFileSystem {
    files,
  };

  return Ok(fs);
}


#[cfg(test)]
mod write_files {
    use super::*;

    #[test]
    fn test_generate() {
      let result = generate(
        &GenerationOptions {
          schema: Some(String::from("Test"))
        },
        &InputState {
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

      let files = result.unwrap().files;

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