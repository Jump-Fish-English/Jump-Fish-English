use std::{error::Error, path::PathBuf};
pub mod astro;
pub mod next;

pub enum Framework {
  NextJs(next::NextJsDef),
  Astro(astro::AstroDef),
  Unknown,
}


pub fn resolve_package_framework(package_path: &PathBuf) -> Result<Framework, Box<dyn Error>> {
  if let Some(astro_def) = astro::get_definition(package_path)? {
    return Ok(Framework::Astro(astro_def));
  }

  if let Some(next_def) = next::get_definition(package_path)? {
    return Ok(Framework::NextJs(next_def));
  }

  return Ok(Framework::Unknown);

}

#[cfg(test)]
mod next_js {
    use super::*;

    #[test]
    fn test_resolve_package_framework_nextjs() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let next_dir = root.join("..").join("..").join("dist").join("frameworks").join("next").join("14.2.3").join("app-dir-no-import-alias");
      let result = resolve_package_framework(&next_dir).expect("Unable to resolve next");

      assert!(
        matches!(
          result, 
          Framework::NextJs(_config)
        )
      );
    }

    #[test]
    fn test_resolve_package_framework_astro() {
      let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
      let astro_dir = root.join("..").join("..").join("dist").join("frameworks").join("astro").join("4.8.0").join("vanilla");
      let result = resolve_package_framework(&astro_dir).expect("Unable to resolve astro");

      assert!(
        matches!(
          result, 
          Framework::Astro(_config)
        )
      );
    }
}