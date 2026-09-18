import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCommentBody, planComments, commentMarker, Finding } from "../src/githubComments";

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    ruleId: "typescript.md::no-console-statements",
    ruleName: "No console statements",
    ruleInstructions: "Code must not contain console.log calls.",
    severity: "Major",
    confidence: 0.9,
    path: "src/foo.ts",
    line: 12,
    ...overrides,
  };
}

test("buildCommentBody includes the rule name, severity, confidence, verbatim instructions, and a hidden marker", () => {
  const body = buildCommentBody(makeFinding());
  assert.match(body, /No console statements/);
  assert.match(body, /Major/);
  assert.match(body, /90%/);
  assert.match(body, /Code must not contain console\.log calls\./);
  assert.match(body, /<!-- jev-review:typescript\.md::no-console-statements -->/);
});

test("buildCommentBody handles unknown confidence and missing severity gracefully", () => {
  const body = buildCommentBody(makeFinding({ confidence: null, severity: null }));
  assert.match(body, /Confidence: unknown/);
  assert.ok(!body.includes("· null"));
});

test("planComments skips findings that could not be localized to a file/line", () => {
  const findings = [makeFinding({ path: null }), makeFinding({ ruleId: "b", line: null })];
  const plan = planComments(findings, []);
  assert.equal(plan.toPost.length, 0);
  assert.equal(plan.skippedUnlocalized, 2);
});

test("planComments skips a finding whose marker already exists among prior comments", () => {
  const finding = makeFinding();
  const existingBody = `Some prior comment\n\n${commentMarker(finding.ruleId)}`;
  const plan = planComments([finding], [existingBody]);
  assert.equal(plan.toPost.length, 0);
  assert.equal(plan.skippedAlreadyPosted, 1);
});

test("planComments includes a localizable finding with no matching prior comment", () => {
  const finding = makeFinding();
  const plan = planComments([finding], ["unrelated comment with no marker"]);
  assert.deepEqual(plan.toPost, [finding]);
  assert.equal(plan.skippedAlreadyPosted, 0);
  assert.equal(plan.skippedUnlocalized, 0);
});

test("planComments does not confuse markers from different rule ids", () => {
  const finding = makeFinding({ ruleId: "typescript.md::rule-a" });
  const existingBody = commentMarker("typescript.md::rule-b");
  const plan = planComments([finding], [existingBody]);
  assert.deepEqual(plan.toPost, [finding]);
});
