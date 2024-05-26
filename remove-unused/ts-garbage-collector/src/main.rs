use std::{env, path::PathBuf};

use crate::frameworks::{astro::get_unused_files, resolve_package_framework};
mod parse;
mod frameworks;

fn main() {
  let args: Vec<String> = env::args().collect();
  let path = PathBuf::from(args.get(1).expect(""));
  match resolve_package_framework(&path) {
    Ok(framework) => {
      match framework {
        frameworks::Framework::Astro(astro) => {
          match get_unused_files(&astro) {
            Ok(unused_files) => {
              dbg!(unused_files);
            },
            Err(err) => {
              dbg!(err);
            }
          }
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
