use std::{error::Error, path::PathBuf};
use std::fs::metadata;

pub struct NextJsDef {
  pub entries: Vec<PathBuf>,
}

fn is_next(package_path: &PathBuf) -> bool {
  return package_path.join("next.config.mjs").exists();
}


fn find_next_page_files(dir: &PathBuf) -> Result<Vec<PathBuf>, Box<dyn Error>> {
  let mut page_tsx_paths: Vec<PathBuf> = Vec::new();
  let files = dir.read_dir()?;
  for file in files {
    let path = file?.path();
    if let Some(filename) = path.file_name() {
      if filename == "page.tsx" || filename == "layout.tsx" || filename == "template.tsx" {
        page_tsx_paths.push(path);
        continue;
      }
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


pub fn get_definition(package_path: &PathBuf) -> Result<Option<NextJsDef>, Box<dyn Error>> {
  if is_next(package_path) == false {
    return Ok(None);
  }

  let app_dir = package_path.join("app");

  let files = find_next_page_files(&app_dir)?;

  return Ok(
    Some(
      NextJsDef {
        entries: files,
      }
    )
  );
}


#[cfg(test)]
mod next_js {
    use super::*;

    #[test]
    fn test_get_definition() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let next_dir = root.join("..").join("..").join("dist").join("frameworks").join("next").join("14.2.3").join("app-dir-no-import-alias");
      let result = get_definition(&next_dir).expect("Could not get nextjs definition");

      assert!(
        matches!(
          result, 
          Some(
            NextJsDef {
              entries: _ 
            }
          )
        )
      );
    }

    #[test]
    fn test_get_definition_entries() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let next_dir = root.join("..").join("..").join("dist").join("frameworks").join("next").join("14.2.3").join("app-dir-no-import-alias");
      let result = get_definition(&next_dir).expect("Could not get nextjs definition");

      assert_eq!(
        vec![
          next_dir.join("app").join("layout.tsx"),
          next_dir.join("app").join("page.tsx"),
          next_dir.join("app").join("foo").join("page.tsx"),
          next_dir.join("app").join("foo").join("template.tsx")
        ].sort(),
        result.unwrap().entries.sort(),
      );
    }
}