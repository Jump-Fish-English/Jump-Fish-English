use std::path::PathBuf;
use std::error::Error;
use std::fs::metadata;

pub struct NextJsDef {
  entries: Vec<PathBuf>,
}

pub enum Framework {
  NextJs(NextJsDef),
  Unknown,
  Error,
}


pub fn resolve_package_framework(package_path: &PathBuf) -> Framework {
  let next_js_config = package_path.join("next.config.mjs");

  if next_js_config.exists() {
    match resolve_next_js(package_path) {
      Ok(framework) => {
        return Framework::NextJs(framework);
      }
      Err(_) => {
        return Framework::Error;
      }
    }
    
  }

  return Framework::Unknown;

}

fn find_next_page_files(dir: &PathBuf) -> Result<Vec<PathBuf>, Box<dyn Error>> {
  let mut page_tsx_paths: Vec<PathBuf> = Vec::new();
  let files = dir.read_dir()?;
  for file in files {
    let path = file?.path();
    let filename = path.file_name();
    let unwrappped_filename = filename.unwrap();

    if unwrappped_filename == "page.tsx" || unwrappped_filename == "layout.tsx" || unwrappped_filename == "template.tsx" {
      page_tsx_paths.push(path);
      continue;
    }


    let md = metadata(&path)?;
    if  md.is_dir() {
      let child_files = find_next_page_files(&path)?;
      for child in child_files {
        page_tsx_paths.push(child);
      }
      
    }
  }

  return Ok(page_tsx_paths);
}

fn resolve_next_js(root_dir: &PathBuf) -> Result<NextJsDef, Box<dyn Error>> {
  let app_dir = root_dir.join("app");

  let files = find_next_page_files(&app_dir)?;

  Ok(NextJsDef {
    entries: files,
  })
}

#[cfg(test)]
mod next_js {
    use super::*;

    #[test]
    fn next_js() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let next_dir = root.join("..").join("..").join("dist").join("frameworks").join("next").join("14.2.3").join("app-dir-no-import-alias");
      let result = resolve_package_framework(&next_dir);

      assert!(
        matches!(
          result, 
          Framework::NextJs(_config)
        )
      );
    }

    #[test]
    fn next_js_routes() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let next_dir = root.join("..").join("..").join("dist").join("frameworks").join("next").join("14.2.3").join("app-dir-no-import-alias");
      let result = resolve_package_framework(&next_dir);

      match result {
        Framework::NextJs(mut config) => {
          assert_eq!(
            vec![
              next_dir.join("app").join("layout.tsx"),
              next_dir.join("app").join("page.tsx"),
              next_dir.join("app").join("foo").join("page.tsx"),
              next_dir.join("app").join("foo").join("template.tsx")
            ].sort(),
            config.entries.sort(),
          );
        }
        Framework::Error => {
          panic!("Error!");
        }
        Framework::Unknown => {
          panic!("Error!");
        }
      }
    }
}
