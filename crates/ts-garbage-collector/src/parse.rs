use swc_common::{
  sync::Lrc,
  FileName, SourceMap,
};
use swc_ecma_ast::Module;
use swc_ecma_parser::{lexer::Lexer, Capturing, Parser, StringInput, Syntax};


pub fn parse_ts_file(filepath: &str, source: &str) -> Module {
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
