import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAMPLE_RULE_CONTENT } from "../src/exampleRule";
import { parseRuleFileContent } from "../src/ruleFiles";

test("the scaffolded example rule content parses into exactly one rule matching every file", () => {
  const { globs, rules } = parseRuleFileContent(EXAMPLE_RULE_CONTENT);
  assert.deepEqual(globs, ["**/*"]);
  assert.equal(rules.length, 1);
  assert.match(rules[0].name, /TODO/);
  assert.match(rules[0].instructions, /Good:/);
  assert.match(rules[0].instructions, /Bad:/);
});
