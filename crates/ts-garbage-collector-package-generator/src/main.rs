use std::process::Command;
use std::fs::{create_dir_all,remove_dir_all};
use std::path::{Path, PathBuf};
use std::fs;

enum Frameworks {
  Next,
  Astro,
}

struct FrameworkFile {
  path: PathBuf,
  contents: String,
}

struct FrameworkGenerator {
  name: String,
  framework: Frameworks,
  version: String,
  files: Vec<FrameworkFile>,
}

struct OutputDefinition {
  outdir: PathBuf,
  command: String,
}

fn generate_command(gen: &FrameworkGenerator) -> OutputDefinition {
  match gen.framework {
    Frameworks::Next => {
      let version = &gen.version;
      let name = &gen.name;
      let outdir = Path::new("dist/frameworks").join("next").join(version).join(name);
      let command = format!("npx create-next-app@{} {} foo --ts --eslint --app --no-tailwind --no-src-dir --no-import-alias", version, outdir.display());
      return OutputDefinition {
        outdir,
        command,
      }
    }
    Frameworks::Astro => {
      let version = &gen.version;
      let name = &gen.name;
      let outdir = Path::new("dist/frameworks").join("astro").join(version).join(name);
      let command = format!("npm create astro@{} -y {} -- --no-install --no-git --yes", version, outdir.display());
      return OutputDefinition {
        outdir,
        command,
      }
    }
  }
}

fn main() -> std::io::Result<()> {
  let frameworks: Vec<FrameworkGenerator> = vec![
    FrameworkGenerator {
      framework: Frameworks::Next,
      version: String::from("14.2.3"),
      name: String::from("app-dir-no-import-alias"),
      files: vec![
        FrameworkFile {
          path: Path::new("app").join("foo").join("page.tsx"),
          contents: String::from("
              export default function FooRoute() {
                return (
                  <div>Foo Route</div>
                );
              }
          ")
        },
        FrameworkFile {
          path: Path::new("app").join("foo").join("template.tsx"),
          contents: String::from("
            import { ReactNode } from \"react\";

            export default function Layout({ children }: { children: ReactNode }) {
              return (
                <div>{children}</div>
              )
            }
          ")
        },
        FrameworkFile {
          path: Path::new("app").join("unused.tsx"),
          contents: String::from("
            // unused!
          ")
        }
      ],
    },
    FrameworkGenerator {
      framework: Frameworks::Astro,
      version: String::from("4.8.0"),
      name: String::from("vanilla"),
      files: vec![
        FrameworkFile {
          path: Path::new("src").join("pages").join("page.astro"),
          contents: String::from("
            ---
            import Layout from '../layouts/Layout.astro';
            import Card from '../components/Card.astro';
            ---

            <div>Used</div>
          ")
        },
        FrameworkFile {
          path: Path::new("src").join("components").join("unused.tsx"),
          contents: String::from("
            // unused!
          ")
        }
      ],
    }
  ];

  for framework in frameworks {
    let generated = generate_command(&framework);
    let command = generated.command;
    let outdir = generated.outdir;
    let files = framework.files;
    if Path::new(&outdir).exists() {
      remove_dir_all(&outdir).expect("Failed to remove directory");
    }
    
    create_dir_all(&outdir).expect("Failed to create output directory");
    
    Command::new("sh")
      .arg("-c")
      .arg(command)
      .output()
      .expect("failed to execute process");

    for file_def in &files {
      let full_path = outdir.join(&file_def.path);
      let mut dir = full_path.clone();
      dir.pop();
      create_dir_all(dir).expect("Failed to create output directory");
      fs::write(full_path, &file_def.contents).expect("Unable to write file");
    }
  }
  Ok(())
  
}