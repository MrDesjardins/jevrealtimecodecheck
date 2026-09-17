import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseRuleFileContent, loadRuleFiles } from "../src/ruleFiles";

test("parses applies_to frontmatter and strips it from the rules body", () => {
  const text = [
    "---",
    "applies_to: **/*.ts, **/*.tsx",
    "---",
    "# Rule one",
    "Do the thing.",
  ].join("\n");
  const { globs, rules } = parseRuleFileContent(text);
  assert.deepEqual(globs, ["**/*.ts", "**/*.tsx"]);
  assert.equal(rules.length, 1);
  assert.equal(rules[0].name, "Rule one");
});

test("defaults to matching everything when there is no frontmatter", () => {
  const text = "# Rule one\nDo the thing.";
  const { globs, rules } = parseRuleFileContent(text);
  assert.deepEqual(globs, ["**/*"]);
  assert.equal(rules.length, 1);
});

test("defaults to matching everything when frontmatter has no applies_to line", () => {
  const text = ["---", "author: me", "---", "# Rule one", "Body."].join("\n");
  const { globs } = parseRuleFileContent(text);
  assert.deepEqual(globs, ["**/*"]);
});

test("loadRuleFiles reads every .md file in the directory, ignoring non-md files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-rulefiles-"));
  await writeFile(join(dir, "typescript.md"), "---\napplies_to: **/*.ts\n---\n# TS rule\nBody.");
  await writeFile(join(dir, "css.md"), "---\napplies_to: **/*.css\n---\n# CSS rule\nBody.");
  await writeFile(join(dir, "notes.txt"), "not a rule file");

  const files = await loadRuleFiles(dir);
  assert.equal(files.length, 2);
  assert.deepEqual(
    files.map((f) => f.relPath).sort(),
    ["css.md", "typescript.md"]
  );
  const ts = files.find((f) => f.relPath === "typescript.md")!;
  assert.deepEqual(ts.globs, ["**/*.ts"]);
  assert.equal(ts.rules[0].name, "TS rule");

  await rm(dir, { recursive: true, force: true });
});

test("loadRuleFiles returns an empty array when the directory does not exist", async () => {
  const files = await loadRuleFiles("/nonexistent/path/for/jev/rules");
  assert.deepEqual(files, []);
});
