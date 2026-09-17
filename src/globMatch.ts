/**
 * Minimal glob matcher for rule-file `applies_to` patterns. Supports `*`
 * (any chars except `/`), `**` (any number of path segments, including
 * zero), and `?` (one char except `/`). No dependency needed for the small
 * pattern vocabulary rule files actually use (`**\/*.ts`, `*.css`, etc.).
 */
function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        i++;
        if (glob[i + 1] === "/") i++;
        re += "(?:.*/)?";
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (".+^${}()|[]\\".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

export function matchesGlob(relPath: string, glob: string): boolean {
  return globToRegExp(glob).test(relPath);
}

export function matchesAnyGlob(relPath: string, globs: string[]): boolean {
  return globs.some((g) => matchesGlob(relPath, g));
}
