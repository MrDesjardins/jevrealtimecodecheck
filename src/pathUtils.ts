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
