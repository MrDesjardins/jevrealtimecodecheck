/**
 * True when `filePath` is `root` itself or a genuine descendant of it.
 * A bare `startsWith(root)` would also match sibling paths that merely share
 * `root` as a string prefix (e.g. root "/a/project" matching
 * "/a/project-backup/x.ts"), so the comparison must be separator-aware.
 */
export function isInsideDir(filePath: string, dirAbsPath: string): boolean {
  return filePath === dirAbsPath || filePath.startsWith(dirAbsPath + "/");
}

export function isRuleFilePath(filePath: string, rulesDirAbsPath: string): boolean {
  return filePath.toLowerCase().endsWith(".md") && isInsideDir(filePath, rulesDirAbsPath);
}

const NOISY_PATH_SEGMENTS = [
  "/node_modules/",
  "/.git/",
  "/dist/",
  "/out/",
  "/build/",
  "/.next/",
  "/target/",
  "/.venv/",
  "/__pycache__/",
];

/**
 * True for paths under directories that churn constantly for reasons
 * unrelated to a person (or an LLM agent) editing source — dependency
 * installs, build output, VCS internals. Used to keep a broad filesystem
 * watcher (which sees every write, not just edits to already-open editor
 * tabs) from scheduling an analysis on every npm install / build.
 */
export function isNoisyPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return NOISY_PATH_SEGMENTS.some((seg) => normalized.includes(seg));
}
