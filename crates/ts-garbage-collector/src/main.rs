use std::path::{Path, PathBuf};
use path_clean::clean;
use vfs::VfsPath;
use swc_common::{
  sync::Lrc,
  FileName, SourceMap,
};
use swc_ecma_ast::Module;
use swc_ecma_visit::{Visit, VisitWith};
use swc_ecma_parser::{lexer::Lexer, Capturing, Parser, StringInput, Syntax};


fn main() {
  
}


pub fn parse(filepath: &str, source: &str) -> Module {
  let cm: Lrc<SourceMap> = Default::default();


  let fm = cm.new_source_file(
      FileName::Custom(filepath.into()),
      source.into(),
  );

  let lexer = Lexer::new(
      Syntax::Typescript(Default::default()),
      Default::default(),
      StringInput::from(&*fm),
      None,
  );

  let capturing = Capturing::new(lexer);

  let mut parser = Parser::new_from(capturing);

  return parser
      .parse_typescript_module()
      .expect("Failed to parse module.");
}

fn collect_source_files(path: VfsPath) -> Vec<PathBuf> {
  let mut files: Vec<PathBuf> = Vec::new();
  
  match path.read_dir() {
    Ok(results) => {
      for result in results {
        match result.is_dir() {
          Ok(is_dir) => {
            if is_dir == true {
              let dir_files = collect_source_files(result);
              for d in dir_files {
                files.push(d);
              }
            } else {
              files.push(Path::new(result.as_str()).join(""));
            }
          },
          Err(_) => {}
        }
        
      }
    },
    Err(_) => {  }
  }

  return files;
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
      let parsed = parse("test.ts", "import { foo } from './somewhere';");
      let result = get_import_sources("/path/to/test.ts", parsed);
      assert_eq!(result, vec![Path::new("/path/to/somewhere.ts").join("")]);
    }
}

#[cfg(test)]
mod collect_source_files_tests {
  use vfs::MemoryFS;

use super::*;

  #[test]
  fn it_should_return_expected_paths() {
    let root: VfsPath = MemoryFS::new().into();
    
    let path = root.join("/path/to/src").unwrap();
    let _ = path.create_dir_all();
    let _ = root.join("/path/to/src/test.ts").unwrap().create_file();
    
    assert_eq!(
      collect_source_files(root), vec![Path::new("/path/to/src/test.ts")]
    )
  }
}