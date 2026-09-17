import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { collectGitDiff } from "../src/gitDiff";

const execFileAsync = promisify(execFile);

async function git(cwd: string, args: string[]) {
  await execFileAsync("git", args, { cwd });
}

async function makeRepo(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "jev-git-test-"));
  await git(dir, ["init", "-q"]);
  await git(dir, ["config", "user.email", "test@example.com"]);
  await git(dir, ["config", "user.name", "Test"]);
  return dir;
}

test("reports unsupported for a non-git folder", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-notgit-"));
  const result = await collectGitDiff(dir);
  assert.equal(result.kind, "unsupported");
  await rm(dir, { recursive: true, force: true });
});

test("reports unsupported when repository has no HEAD", async () => {
  const dir = await makeRepo();
  const result = await collectGitDiff(dir);
  assert.equal(result.kind, "unsupported");
  assert.match(result.reason ?? "", /no HEAD/i);
  await rm(dir, { recursive: true, force: true });
});

test("reports empty when there are no changes relative to HEAD", async () => {
  const dir = await makeRepo();
  await writeFile(join(dir, "a.txt"), "hello\n");
  await git(dir, ["add", "."]);
  await git(dir, ["commit", "-q", "-m", "init"]);
  const result = await collectGitDiff(dir);
  assert.equal(result.kind, "empty");
  await rm(dir, { recursive: true, force: true });
});

test("collects combined staged and unstaged diff for tracked files", async () => {
  const dir = await makeRepo();
  await writeFile(join(dir, "a.txt"), "hello\n");
  await writeFile(join(dir, "b.txt"), "world\n");
  await git(dir, ["add", "."]);
  await git(dir, ["commit", "-q", "-m", "init"]);

  // Staged change.
  await writeFile(join(dir, "a.txt"), "hello staged\n");
  await git(dir, ["add", "a.txt"]);
  // Unstaged change.
  await writeFile(join(dir, "b.txt"), "world unstaged\n");

  const result = await collectGitDiff(dir);
  assert.equal(result.kind, "diff");
  assert.match(result.diff, /hello staged/);
  assert.match(result.diff, /world unstaged/);
  assert.deepEqual(result.changedFiles.sort(), ["a.txt", "b.txt"]);

  await rm(dir, { recursive: true, force: true });
});

test("excludes untracked files from the diff but reports them separately", async () => {
  const dir = await makeRepo();
  await writeFile(join(dir, "a.txt"), "hello\n");
  await git(dir, ["add", "."]);
  await git(dir, ["commit", "-q", "-m", "init"]);

  await mkdir(join(dir, "sub"), { recursive: true });
  await writeFile(join(dir, "new-file.txt"), "new\n");

  const result = await collectGitDiff(dir);
  assert.equal(result.kind, "empty");
  assert.ok(result.untrackedFiles?.includes("new-file.txt"));

  await rm(dir, { recursive: true, force: true });
});
