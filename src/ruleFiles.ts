import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { matchesAnyGlob } from "./globMatch";
import { parseRules } from "./rulesParser";
import { Rule } from "./types";

export interface RuleFile {
  /** Absolute path on disk. */
  filePath: string;
  /** File name relative to the rules directory, e.g. "typescript.md". */
  relPath: string;
  /** Globs this file's rules apply to. Defaults to ["**\/*"] (all files) when no frontmatter is present. */
  globs: string[];
  rules: Rule[];
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * A rule file may start with a `---`-delimited frontmatter block containing
 * `applies_to: <glob>, <glob>, ...`. Everything after it is parsed as the
 * usual rules Markdown (parseRules). No frontmatter means the file's rules
 * apply to every changed file, same as the old single-rules-file behavior.
 */
export function parseRuleFileContent(text: string): { globs: string[]; rules: Rule[] } {
  const match = text.match(FRONTMATTER_RE);
  if (!match) {
    return { globs: ["**/*"], rules: parseRules(text) };
  }

  const header = match[1];
  const body = text.slice(match[0].length);
  const line = header.split(/\r?\n/).find((l) => l.trim().toLowerCase().startsWith("applies_to:"));

  let globs = ["**/*"];
  if (line) {
    const value = line.slice(line.indexOf(":") + 1).trim();
    const parsed = value
      .split(",")
      .map((g) => g.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    if (parsed.length > 0) {
      globs = parsed;
    }
  }

  return { globs, rules: parseRules(body) };
}

/**
 * Loads every `.md` file directly inside the rules directory (non-recursive)
 * and parses each into its globs + rules. Missing directory yields an empty
 * list rather than an error — that's surfaced by the caller as "no rules".
 */
export async function loadRuleFiles(rulesDirAbsPath: string): Promise<RuleFile[]> {
  let entries: string[];
  try {
    entries = (await readdir(rulesDirAbsPath)).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return [];
  }

  const files: RuleFile[] = [];
  for (const name of entries.sort()) {
    const filePath = join(rulesDirAbsPath, name);
    let text: string;
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      continue;
    }
    const { globs, rules } = parseRuleFileContent(text);
    files.push({ filePath, relPath: name, globs, rules });
  }
  return files;
}

/**
 * Combines rules from every rule file whose `applies_to` globs match at
 * least one changed file. Rule ids are namespaced per file
 * (`<file>::<rule-id>`) since parseRules only guarantees uniqueness within
 * a single file, and multiple rule files are combined into one set of Jev
 * questions. Each rule carries its file's globs as `appliesTo` (unless they
 * cover every file), since a mixed diff still sends e.g. Rust changes along
 * with TypeScript rules.
 */
export function selectApplicableRules(
  ruleFiles: RuleFile[],
  changedFiles: string[]
): { rules: Rule[]; matchedFileNames: string[] } {
  const matched = ruleFiles.filter((rf) => changedFiles.some((f) => matchesAnyGlob(f, rf.globs)));
  const rules: Rule[] = matched.flatMap((rf) => {
    const appliesTo = rf.globs.includes("**/*") ? undefined : rf.globs;
    return rf.rules.map((r) => ({ ...r, id: `${rf.relPath}::${r.id}`, appliesTo }));
  });
  return { rules, matchedFileNames: matched.map((rf) => rf.relPath) };
}
