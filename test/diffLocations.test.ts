import { test } from "node:test";
import assert from "node:assert/strict";
import { firstChangedLineByFile, parseDiffBlocks } from "../src/diffLocations";

test("extracts the first hunk's new-file start line per file", () => {
  const diff = [
    "diff --git a/a.txt b/a.txt",
    "index 111..222 100644",
    "--- a/a.txt",
    "+++ b/a.txt",
    "@@ -10,3 +10,4 @@",
    " context",
    "+added",
    " context",
    "diff --git a/b.txt b/b.txt",
    "index 333..444 100644",
    "--- a/b.txt",
    "+++ b/b.txt",
    "@@ -1,2 +1,3 @@",
    "+added at top",
    " context",
  ].join("\n");

  const map = firstChangedLineByFile(diff);
  assert.equal(map.get("a.txt"), 10);
  assert.equal(map.get("b.txt"), 1);
});

test("only records the first hunk when a file has multiple hunks", () => {
  const diff = [
    "diff --git a/a.txt b/a.txt",
    "--- a/a.txt",
    "+++ b/a.txt",
    "@@ -5,2 +5,3 @@",
    "+first hunk",
    "@@ -50,2 +51,3 @@",
    "+second hunk",
  ].join("\n");

  const map = firstChangedLineByFile(diff);
  assert.equal(map.get("a.txt"), 5);
});

test("returns an empty map for a diff with no recognizable hunks", () => {
  const map = firstChangedLineByFile("not a real diff");
  assert.equal(map.size, 0);
});

test("parseDiffBlocks splits a whole-file rewrite (one giant hunk) into per-block candidates with real line numbers", () => {
  // This mirrors the bug report: a file rewritten top to bottom shows up as
  // a single @@ -1,N +1,M @@ hunk, so "first hunk line" always resolves to
  // line 1 no matter which part of the file actually changed.
  const diff = [
    "diff --git a/playground.ts b/playground.ts",
    "--- a/playground.ts",
    "+++ b/playground.ts",
    "@@ -1,2 +1,7 @@",
    "-old top comment",
    "+import * as vscode from \"vscode\";",
    "+",
    "+function getWorkspaceRoot(): string | undefined {",
    "+  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;",
    "+}",
    "+",
    "+export function activate(context: vscode.ExtensionContext): void {",
  ].join("\n");

  const blocks = parseDiffBlocks(diff);
  assert.ok(blocks.length >= 3, `expected at least 3 blocks, got ${blocks.length}`);
  assert.equal(blocks[0].startLine, 1);
  assert.match(blocks[0].preview, /import \* as vscode/);
  // The function block must NOT be reported at line 1 — it's further down.
  const fnBlock = blocks.find((b) => b.preview.includes("getWorkspaceRoot"));
  assert.ok(fnBlock);
  assert.ok(fnBlock!.startLine > 1);
});

test("parseDiffBlocks does not advance the line counter for removed lines", () => {
  const diff = [
    "diff --git a/a.txt b/a.txt",
    "--- a/a.txt",
    "+++ b/a.txt",
    "@@ -1,3 +1,3 @@",
    " kept line",
    "-removed line",
    "+replacement line",
    " trailing context",
  ].join("\n");

  const blocks = parseDiffBlocks(diff);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].startLine, 2);
  assert.match(blocks[0].preview, /replacement line/);
});

test("parseDiffBlocks caps blocks per file", () => {
  const lines = ["diff --git a/a.txt b/a.txt", "--- a/a.txt", "+++ b/a.txt", "@@ -1,1 +1,200 @@"];
  for (let i = 0; i < 100; i++) {
    lines.push(`+block${i}`, "+");
  }
  const diff = lines.join("\n");
  const blocks = parseDiffBlocks(diff, 10);
  assert.equal(blocks.length, 10);
});

test("parseDiffBlocks splits a long contiguous addition with no internal blank lines into multiple blocks", () => {
  // Regression: a PR added an 8-line function body in one go, no blank
  // lines inside it. Every violation inside that function resolved to the
  // same first line, because the whole function was one block.
  const diff = [
    "diff --git a/playground.ts b/playground.ts",
    "--- a/playground.ts",
    "+++ b/playground.ts",
    "@@ -201,3 +201,12 @@",
    " }",
    "+",
    "+export function computeRetryDelay(attempt: number): number {",
    "+  // TODO: make this configurable",
    "+  if (attempt > 5) {",
    "+    console.log(\"giving up after too many attempts\", attempt);",
    "+    return 5000;",
    "+  }",
    "+  return attempt * 1000;",
    "+}",
  ].join("\n");

  const blocks = parseDiffBlocks(diff);
  assert.ok(blocks.length > 1, `expected more than one block, got ${blocks.length}`);

  const todoBlock = blocks.find((b) => b.preview.includes("TODO"));
  const consoleBlock = blocks.find((b) => b.preview.includes("console.log"));
  assert.ok(todoBlock);
  assert.ok(consoleBlock);
  // The two violations must NOT collapse onto the same line.
  assert.notEqual(todoBlock!.startLine, consoleBlock!.startLine);
});

test("parseDiffBlocks guarantees every changed file gets representation, not just the first ones in the diff", () => {
  // Regression test: a global cap taken in file order silently dropped every
  // candidate for later files, so violations in those files could never be
  // localized (and therefore were never clickable in the sidebar).
  const lines: string[] = [];
  const fileNames = Array.from({ length: 10 }, (_, i) => `file${i}.ts`);
  for (const name of fileNames) {
    lines.push(`diff --git a/${name} b/${name}`, `--- a/${name}`, `+++ b/${name}`, "@@ -1,1 +1,30 @@");
    for (let i = 0; i < 15; i++) {
      lines.push(`+line${i} in ${name}`, "+");
    }
  }
  const diff = lines.join("\n");
  const blocks = parseDiffBlocks(diff, 8);
  const filesRepresented = new Set(blocks.map((b) => b.file));
  assert.equal(filesRepresented.size, fileNames.length, "every file must have at least one block");
  for (const name of fileNames) {
    const count = blocks.filter((b) => b.file === name).length;
    assert.ok(count > 0 && count <= 8, `${name} should have 1-8 blocks, got ${count}`);
  }
});
