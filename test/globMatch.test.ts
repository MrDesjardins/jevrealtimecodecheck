import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesGlob, matchesAnyGlob } from "../src/globMatch";

test("**/*.ext matches files at any depth including the root", () => {
  assert.ok(matchesGlob("foo.ts", "**/*.ts"));
  assert.ok(matchesGlob("src/foo.ts", "**/*.ts"));
  assert.ok(matchesGlob("src/nested/deep/foo.ts", "**/*.ts"));
  assert.ok(!matchesGlob("foo.tsx", "**/*.ts"));
});

test("*.ext only matches top-level files", () => {
  assert.ok(matchesGlob("foo.css", "*.css"));
  assert.ok(!matchesGlob("src/foo.css", "*.css"));
});

test("exact filename glob matches only that name", () => {
  assert.ok(matchesGlob("README.md", "README.md"));
  assert.ok(!matchesGlob("src/README.md", "README.md"));
});

test("matchesAnyGlob is true if any pattern matches", () => {
  assert.ok(matchesAnyGlob("src/App.tsx", ["**/*.ts", "**/*.tsx"]));
  assert.ok(!matchesAnyGlob("src/App.py", ["**/*.ts", "**/*.tsx"]));
});

test("does not let * cross directory boundaries", () => {
  assert.ok(!matchesGlob("a/b/c.ts", "a/*.ts"));
  assert.ok(matchesGlob("a/c.ts", "a/*.ts"));
});
