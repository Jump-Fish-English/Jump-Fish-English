use clap::Parser;
use std::{env, error::Error, fs, path::{Path, PathBuf}};

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    config: String,
}

#[derive(Debug)]
struct Config {
  dir: PathBuf,
  config_path: PathBuf,
}

fn main() {
  match env::current_dir() {
    Ok(current_dir) => {
      let args = Args::parse();
      let config_path = &current_dir.join(args.config);
      let config = Config {
        dir: current_dir,
        config_path: config_path.to_path_buf(),
      };
      read_config(config.config_path);
    },
    Err(err) => {
      dbg!(err);
    }
  }
}

fn read_config(path: PathBuf) -> Result<(), Box<dyn Error>> {
  let contents = fs::read_to_string(path)?;
  dbg!(contents);
  return Ok(());
}
