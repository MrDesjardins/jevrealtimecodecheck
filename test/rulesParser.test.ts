import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRules } from "../src/rulesParser";

test("parses multiple top-level headings into rules", () => {
  const md = [
    "# Functions must not return null",
    "Explain why null is bad.",
    "",
    "# Event listeners need cleanup",
    "Explain cleanup requirement.",
  ].join("\n");

  const rules = parseRules(md);
  assert.equal(rules.length, 2);
  assert.equal(rules[0].name, "Functions must not return null");
  assert.equal(rules[0].instructions, "Explain why null is bad.");
  assert.equal(rules[1].name, "Event listeners need cleanup");
});

test("ignores ## and deeper headings as rule content, not new rules", () => {
  const md = ["# Rule one", "## Subsection", "Some detail under subsection."].join("\n");
  const rules = parseRules(md);
  assert.equal(rules.length, 1);
  assert.match(rules[0].instructions, /## Subsection/);
  assert.match(rules[0].instructions, /Some detail under subsection\./);
});

test("does not treat # inside fenced code blocks as a heading", () => {
  const md = [
    "# Real rule",
    "Some text.",
    "```",
    "# This is a comment in code, not a heading",
    "```",
    "More text after fence.",
  ].join("\n");
  const rules = parseRules(md);
  assert.equal(rules.length, 1);
  assert.match(rules[0].instructions, /This is a comment in code/);
  assert.match(rules[0].instructions, /More text after fence\./);
});

test("handles tilde fences too", () => {
  const md = ["# Rule", "~~~", "# not a heading", "~~~"].join("\n");
  const rules = parseRules(md);
  assert.equal(rules.length, 1);
});

test("produces stable, unique, deterministic ids including for duplicate names", () => {
  const md = ["# Same Name", "a", "# Same Name", "b"].join("\n");
  const rules = parseRules(md);
  assert.equal(rules[0].id, "same-name");
  assert.equal(rules[1].id, "same-name-2");
});

test("returns empty array for markdown with no top-level headings", () => {
  const md = "Just some text\nwith no headings at all.";
  const rules = parseRules(md);
  assert.equal(rules.length, 0);
});

test("empty rules file yields zero rules", () => {
  assert.equal(parseRules("").length, 0);
});
