use std::{env, path::{Path, PathBuf}};
use path_clean::clean;
use swc_ecma_ast::Module;
use swc_ecma_visit::{Visit, VisitWith};

use crate::frameworks::resolve_package_framework;
mod parse;
mod frameworks;

fn main() {
  let args: Vec<String> = env::args().collect();
  let path = PathBuf::from(args.get(1).expect(""));
  match resolve_package_framework(&path) {
    Ok(framework) => {
      match framework {
        frameworks::Framework::Astro(astro) => {
          dbg!(astro);
        },
        frameworks::Framework::NextJs(_) => {
          println!("NEXTJS");
        },
        frameworks::Framework::Unknown => {
          println!("UNKNOWN");
        }
      }
    },
    Err(_) => {

    }
  }
  dbg!(path);
}

fn get_import_sources(filename: &str, module: Module) -> Vec<PathBuf> {
  struct ImportSources<'a> {
    filename: &'a str,
    import_sources: Vec<PathBuf>,
  }

  impl<'a> Visit for ImportSources<'a> {
    fn visit_import_decl(&mut self,n: &swc_ecma_ast::ImportDecl) {
      let mut import_source = n.src.value.to_string();
      import_source.push_str(".ts");
      let path_buff = Path::new(&self.filename).parent().unwrap().join(import_source);
      self.import_sources.push(clean(path_buff));
    }
  }

  let mut visitor = ImportSources {
    filename: filename,
    import_sources: Vec::new()
  };

  module.visit_with(&mut visitor);

  return visitor.import_sources
}

#[cfg(test)]
mod get_import_sources_tests {
    use super::*;

    #[test]
    fn it_should_return_import_paths() {
      let parsed = parse::parse_ts_file("test.ts", "import { foo } from './somewhere';");
      let result = get_import_sources("/path/to/test.ts", parsed);
      assert_eq!(result, vec![Path::new("/path/to/somewhere.ts").join("")]);
    }
}
