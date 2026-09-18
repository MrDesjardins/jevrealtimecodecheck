import { test } from "node:test";
import assert from "node:assert/strict";
import { isInsideDir, isRuleFilePath, isNoisyPath } from "../src/pathUtils";

test("isInsideDir treats a genuine descendant as inside", () => {
  assert.ok(isInsideDir("/a/project/src/file.ts", "/a/project"));
  assert.ok(isInsideDir("/a/project", "/a/project"));
});

test("isInsideDir rejects a sibling path that merely shares a string prefix", () => {
  // Regression: a bare startsWith(root) check would wrongly match this.
  assert.ok(!isInsideDir("/a/project-backup/notes.ts", "/a/project"));
  assert.ok(!isInsideDir("/a/project2/file.ts", "/a/project"));
});

test("isRuleFilePath requires both .md extension and directory containment", () => {
  assert.ok(isRuleFilePath("/root/jev/typescript.md", "/root/jev"));
  assert.ok(!isRuleFilePath("/root/jev/typescript.ts", "/root/jev"));
  assert.ok(!isRuleFilePath("/root/jev-other/typescript.md", "/root/jev"));
});

test("isNoisyPath flags common churny directories", () => {
  assert.ok(isNoisyPath("/a/project/node_modules/foo/index.js"));
  assert.ok(isNoisyPath("/a/project/.git/index"));
  assert.ok(isNoisyPath("/a/project/dist/extension.js"));
  assert.ok(isNoisyPath("/a/project/__pycache__/mod.pyc"));
});

test("isNoisyPath does not flag ordinary source paths", () => {
  assert.ok(!isNoisyPath("/a/project/src/extension.ts"));
  assert.ok(!isNoisyPath("/a/project/distribution/notes.md")); // not a real "/dist/" segment
});
