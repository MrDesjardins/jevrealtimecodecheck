import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { GitDiffResult } from "./types";

const execFileAsync = promisify(execFile);

async function runGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 1024 * 1024 * 32,
  });
  return stdout;
}

/**
 * Collects the combined staged+unstaged diff for tracked files, relative to
 * HEAD. Untracked files are never included (git diff does not see them) and
 * are reported separately so the caller can disclose the limitation.
 */
export async function collectGitDiff(cwd: string): Promise<GitDiffResult> {
  try {
    await runGit(cwd, ["rev-parse", "--is-inside-work-tree"]);
  } catch {
    return {
      kind: "unsupported",
      diff: "",
      changedFiles: [],
      reason: "This folder is not a Git repository.",
    };
  }

  try {
    await runGit(cwd, ["rev-parse", "--verify", "HEAD"]);
  } catch {
    return {
      kind: "unsupported",
      diff: "",
      changedFiles: [],
      reason:
        "Repository has no HEAD commit yet. Make an initial commit to enable analysis.",
    };
  }

  const [diff, nameOnly, status] = await Promise.all([
    runGit(cwd, ["diff", "HEAD", "--", "."]),
    runGit(cwd, ["diff", "HEAD", "--name-only", "--", "."]),
    runGit(cwd, ["status", "--porcelain"]),
  ]);

  const changedFiles = nameOnly
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const untrackedFiles = status
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim())
    .filter(Boolean);

  if (!diff.trim()) {
    return {
      kind: "empty",
      diff: "",
      changedFiles: [],
      untrackedFiles,
    };
  }

  return {
    kind: "diff",
    diff,
    changedFiles,
    untrackedFiles,
  };
}
