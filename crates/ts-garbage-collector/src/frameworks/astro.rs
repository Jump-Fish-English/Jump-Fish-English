use glob::glob;
use std::path::Path;
use path_clean::clean;
use std::{error::Error, path::PathBuf};
use std::fs::{read_to_string,metadata};
use std::collections::HashMap;
use crate::parse::{parse_ts_file,get_import_sources};

#[derive(Debug)]
pub struct AstroDef {
  pub root: PathBuf,
  pub entries: Vec<PathBuf>,
  pub out_dir: PathBuf,
}

fn is_astro(package_path: &PathBuf) -> bool {
  return package_path.join("astro.config.mjs").exists();
}


fn find_astro_page_files(dir: &PathBuf) -> Result<Vec<PathBuf>, Box<dyn Error>> {
  let mut page_paths: Vec<PathBuf> = Vec::new();
  let files = dir.read_dir()?;
  for file in files {
    let path = file?.path();

    if let Some(ext) = path.extension() {
      if ext == "astro" {
        page_paths.push(path);
        continue;
      }
    }


    let md = metadata(&path)?;
    if  md.is_dir() {
      let child_files = find_astro_page_files(&path)?;
      for child in child_files {
        page_paths.push(child);
      }
      
    }
  }

  return Ok(page_paths);
}

pub fn get_definition(package_path: &PathBuf) -> Result<Option<AstroDef>, Box<dyn Error>> {
  if is_astro(package_path) == false {
    return Ok(None);
  }

  let cleaned = clean(package_path);
  let system_files = vec![
    cleaned.join("README.md"),
    cleaned.join("astro.config.mjs"),
    cleaned.join(".gitignore"),
    cleaned.join("tsconfig.json"),
    cleaned.join("package.json"),
    cleaned.join("src").join("env.d.ts")
  ];

  let mut entries = find_astro_page_files(&cleaned.join("src").join("pages"))?;
  
  for file in system_files {
    entries.push(file);
  };

  return Ok(
    Some(
      AstroDef {
        root: clean(PathBuf::from(package_path)),
        entries,
        out_dir: package_path.join("dist")
      }
    )
  );
}

fn extract_front_matter(contents: String) -> Option<String>  {
  let split = contents.split("---");
  let collection: Vec<&str> = split.collect();
  if let Some(head) = collection.get(1) {
    return Some(head.to_string());
  }
  return None;
}

fn extract_import_paths(filepath: &Path, contents: String) -> Option<Vec<PathBuf>>  {
  if let Some(frontmatter) = extract_front_matter(contents) {
    let parsed = parse_ts_file(&frontmatter);
    let sources = get_import_sources(filepath, parsed);
    return Some(sources);
  }
  return None;
}

pub fn mark_file_as_used(path: &PathBuf, unused_source_files: &mut HashMap<String, PathBuf>) {
  unused_source_files.remove(&path.to_string_lossy().to_string());
}

fn process_file(path_buf: PathBuf, unused_source_files: &mut HashMap<String, PathBuf>) -> Result<(), Box<dyn Error>> {
  mark_file_as_used(&path_buf, unused_source_files);
  match read_to_string(&path_buf) {
    Ok(contents) => {
      if let Some(import_statements) = extract_import_paths(&path_buf, contents) {
        for statement_path in import_statements {
          process_file(statement_path, unused_source_files)?;
        }
      }
    },
    Err(_) => {
      // maybe no utf-8?
    }
  }
  

  Ok(())
}

pub fn get_unused_files(def: &AstroDef) -> Result<Vec<PathBuf>, Box<dyn Error>> {
  let entries = &def.entries;

  let mut unused_source_files: HashMap<String, PathBuf> = HashMap::new();
  let glob_pattern = format!("{}/**/*", &def.root.to_string_lossy());
  let all_source_files = glob(glob_pattern.as_str()).expect("Unable to glob directory");

  for file in all_source_files {
    let unwrapped = clean(file?);

    // "public" shouldn't be excluded here.
    // There is a file in there, favicon.svg that is referenced
    // in layouts/Layout.astro. Will need to parse the HTML to find
    // those references.
    if 
      unwrapped.is_dir() || 
      unwrapped.to_string_lossy().contains(".vscode") || 
      unwrapped.to_string_lossy().contains("public") || 
      unwrapped.to_string_lossy().contains("node_modules") || 
      unwrapped.to_string_lossy().contains(".astro") ||
      unwrapped.to_string_lossy().contains(&def.out_dir.to_string_lossy().to_string())
    {
      continue;
    }
    let key = unwrapped.to_string_lossy().to_string();
    unused_source_files.insert(key, unwrapped);
  }

  for entry in entries {
    process_file(clean(entry).to_path_buf(), &mut unused_source_files)?;
  }

  return Ok(
    unused_source_files.values().cloned().collect()
  );
}


#[cfg(test)]
mod astro {
    use std::path::Path;

    use super::*;

    #[test]
    fn test_get_definition() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let astro_dir = root.join("..").join("..").join("dist").join("frameworks").join("astro").join("4.8.0").join("vanilla");
      let result = get_definition(&astro_dir).expect("Error getting Astro definition.");

      assert!(
        matches!(
          result, 
          Some(
            AstroDef {
              root: _,
              entries: _,
              out_dir: _,
            }
          )
        )
      );
    }

    #[test]
    fn definition() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let astro_dir = root.join("..").join("..").join("dist").join("frameworks").join("astro").join("4.8.0").join("vanilla");
      let mut result = get_definition(&astro_dir).expect("Error getting Astro definition.").unwrap();

      assert_eq!(
        clean(PathBuf::from(&astro_dir)),
        result.root,
      );

      assert_eq!(
        vec![
          astro_dir.join(".gitignore"),
          astro_dir.join("astro.config.mjs"),
          astro_dir.join("tsconfig.json"),
          astro_dir.join("package.json"),
          astro_dir.join("README.md"),
          astro_dir.join("src").join("pages").join("index.astro"),
          astro_dir.join("src").join("pages").join("page.astro"),
        ].sort(),
        result.entries.sort()
      );
    }

    #[test]
    fn test_extract_import_paths() {
      let source = String::from(
        "
        ---
          import { foo } from '../foo/bar.astro';
        ---

        <div>HTML</div>
        "
      );

      assert_eq!(
        extract_import_paths(Path::new("/some/path/index.astro"), source).unwrap(),
        vec![
          Path::new("/some/foo/bar.astro")
        ],
      );
    }

    #[test]
    fn test_get_unused_files() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let astro_dir = root.join("..").join("..").join("dist").join("frameworks").join("astro").join("4.8.0").join("vanilla");
      let result = get_definition(&astro_dir).expect("Error getting Astro definition.").unwrap();
      let unused = get_unused_files(&result).unwrap();

      assert_eq!(
        vec![
          clean(astro_dir.join("src").join("components").join("unused.tsx")),
        ],
        unused,
      );
    }
}
