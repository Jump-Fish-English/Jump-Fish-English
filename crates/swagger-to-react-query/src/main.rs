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
  config_path: PathBuf,
}

fn main() {
  match env::current_dir() {
    Ok(current_dir) => {
      let args = Args::parse();
      let config = Config {
        config_path: current_dir.join(args.config),
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
