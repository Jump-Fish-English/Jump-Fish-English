use std::path::{Path, PathBuf};

use swc_common::{
  sync::Lrc,
  FileName, SourceMap,
};
use path_clean::clean;
use swc_ecma_ast::Module;
use swc_ecma_visit::{Visit, VisitWith};
use swc_ecma_parser::{lexer::Lexer, Capturing, Parser, StringInput, Syntax};



pub fn parse_ts_file(source: &String) -> Module {
  let cm: Lrc<SourceMap> = Default::default();


  let fm = cm.new_source_file(
      FileName::Anon,
      source.to_string()
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


pub fn get_import_sources(filename: &Path, module: Module) -> Vec<PathBuf> {
  struct ImportSources {
    filename: PathBuf,
    import_sources: Vec<PathBuf>,
  }

  impl Visit for ImportSources {
    fn visit_import_decl(&mut self,n: &swc_ecma_ast::ImportDecl) {
      let import_source = n.src.value.to_string();
      let path_buff = Path::new(&self.filename).parent().unwrap().join(import_source);
      self.import_sources.push(clean(path_buff));
    }
  }

  let mut visitor = ImportSources {
    filename: filename.to_path_buf(),
    import_sources: Vec::new()
  };

  module.visit_with(&mut visitor);

  return visitor.import_sources
}

#[cfg(test)]
mod get_import_sources_tests {
    use super::*;

    #[test]
    fn test_get_import_sources() {
      let parsed = parse_ts_file(&String::from("import { foo } from './somewhere';"));
      let result = get_import_sources(Path::new("/path/to/test.ts"), parsed);
      assert_eq!(result, vec![Path::new("/path/to/somewhere").join("")]);
    }
}
