
use std::{error::Error, path::PathBuf};
use std::fs::metadata;
pub struct AstroDef {
  pub entries: Vec<PathBuf>,
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

  return Ok(
    Some(
      AstroDef {
        entries: find_astro_page_files(&package_path.join("src").join("pages"))?
      }
    )
  );
}


#[cfg(test)]
mod astro {
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
              entries: _ 
            }
          )
        )
      );
    }

    #[test]
    fn definition() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let astro_dir = root.join("..").join("..").join("dist").join("frameworks").join("astro").join("4.8.0").join("vanilla");
      let result = get_definition(&astro_dir).expect("Error getting Astro definition.");

      assert_eq!(
        vec![
          astro_dir.join("src").join("pages").join("index.astro"),
          astro_dir.join("src").join("pages").join("page.astro"),
        ],
        result.unwrap().entries,
      );
    }
}
