use std::{env, path::{PathBuf}};

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
