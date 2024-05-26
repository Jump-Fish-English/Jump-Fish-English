use std::path::{Path,Component, PathBuf};


pub fn diff_path<P, B>(path: P, base: B) -> Option<PathBuf>
     where P: AsRef<Path>, B: AsRef<Path>
{
  let (mut base_a, mut base_b) = (path.as_ref().to_path_buf(), base.as_ref().to_path_buf());
    base_a.pop();
    base_b.pop();
    let is_same_directory = base_a.to_string_lossy() == base_b.to_string_lossy();

    let (path, base) = (path.as_ref(), base.as_ref());
    if path.has_root() != base.has_root() {
        return None;
    }

    let mut ita = path.components();
    let mut itb = base.components();
    let mut comps: Vec<Component> = vec![];
    loop {
        match (ita.next(), itb.next()) {
            (None, None) => break,
            (Some(a), None) => {
                comps.push(a);
                comps.extend(ita.by_ref());
                break;
            }
            (None, _) => comps.push(Component::ParentDir),
            (Some(a), Some(b)) if comps.is_empty() && a == b => (),
            (Some(a), Some(b)) if b == Component::CurDir => comps.push(a),
            (Some(_), Some(b)) if b == Component::ParentDir => return None,
            (Some(a), Some(_)) => {
              if (is_same_directory == true) {
                comps.push(Component::CurDir);
              } else {
                  comps.push(Component::ParentDir);
                  for _ in itb {
                      comps.push(Component::ParentDir);
                  }
                }
                comps.push(a);
                comps.extend(ita.by_ref());
                break;
            }
        }
    }

    Some(comps.iter().map(|c| c.as_os_str()).collect())
}