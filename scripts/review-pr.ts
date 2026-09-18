#!/usr/bin/env node
/**
 * Runs the same rule-matching + Jev analysis as the editor extension, but
 * against a PR's committed diff (base...HEAD) instead of the working tree,
 * and posts a GitHub PR review comment on each violation that could be
 * localized to a file/line — instead of showing results in a VS Code
 * sidebar. Reuses every vscode-independent module from src/ as-is; nothing
 * here duplicates the extension's analysis logic.
 *
 * Usage (see .github/workflows/jev-review.yml for the intended CI usage):
 *   node --import tsx scripts/review-pr.ts [--base <ref>] [--rules-dir <dir>] [--dry-run]
 *
 * Required env: TYPESAFE_API_KEY.
 * For posting comments: GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_PATH
 * (all set automatically by GitHub Actions on a pull_request event). Without
 * them, findings are printed to stdout instead (useful for local dry runs).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { collectGitDiffAgainstRef } from "../src/gitDiff";
import { collectFileContext } from "../src/fileContext";
import { loadRuleFiles } from "../src/ruleFiles";
import { matchesAnyGlob } from "../src/globMatch";
import { callJev, enrichViolations, JevApiError, JevState } from "../src/jevClient";
import { parseDiffBlocks } from "../src/diffLocations";
import { Rule } from "../src/types";
import { Finding, buildCommentBody, planComments } from "../src/githubComments";

interface CliOptions {
  cwd: string;
  rulesDir: string;
  baseRef: string;
  maxDiffChars: number;
  maxFileContextChars: number;
  maxTotalContextChars: number;
  maxRulesPerRequest: number;
  dryRun: boolean;
  failOnViolation: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    cwd: process.cwd(),
    rulesDir: process.env.JEV_RULES_DIR ?? "jev",
    baseRef:
      process.env.JEV_BASE_REF ??
      (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "origin/main"),
    maxDiffChars: 20000,
    maxFileContextChars: 8000,
    maxTotalContextChars: 40000,
    maxRulesPerRequest: 20,
    dryRun: false,
    failOnViolation: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--cwd") opts.cwd = argv[++i];
    else if (arg === "--rules-dir") opts.rulesDir = argv[++i];
    else if (arg === "--base") opts.baseRef = argv[++i];
    else if (arg === "--max-diff-chars") opts.maxDiffChars = Number(argv[++i]);
    else if (arg === "--max-file-context-chars") opts.maxFileContextChars = Number(argv[++i]);
    else if (arg === "--max-total-context-chars") opts.maxTotalContextChars = Number(argv[++i]);
    else if (arg === "--max-rules-per-request") opts.maxRulesPerRequest = Number(argv[++i]);
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--fail-on-violation") opts.failOnViolation = true;
  }
  return opts;
}

async function githubRequest<T>(
  path: string,
  token: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

async function postFindingsToGithub(findings: Finding[]): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!token || !repo || !eventPath) {
    console.log(
      "Not running with GitHub PR context (GITHUB_TOKEN/GITHUB_REPOSITORY/GITHUB_EVENT_PATH) — printing findings instead of posting comments."
    );
    for (const f of findings) console.log(JSON.stringify(f));
    return;
  }

  const event = JSON.parse(readFileSync(eventPath, "utf8")) as {
    pull_request?: { number: number; head: { sha: string } };
  };
  const pr = event.pull_request;
  if (!pr) {
    console.log("Event payload has no pull_request — skipping comment posting.");
    return;
  }
  const [owner, name] = repo.split("/");

  const existing = await githubRequest<{ body: string }[]>(
    `/repos/${owner}/${name}/pulls/${pr.number}/comments?per_page=100`,
    token
  );
  const plan = planComments(
    findings,
    existing.map((c) => c.body)
  );
  if (plan.skippedUnlocalized > 0) {
    console.log(`${plan.skippedUnlocalized} violation(s) could not be localized to a single file/line — not posted as comments.`);
  }

  for (const f of plan.toPost) {
    await githubRequest(`/repos/${owner}/${name}/pulls/${pr.number}/comments`, token, "POST", {
      body: buildCommentBody(f),
      commit_id: pr.head.sha,
      path: f.path,
      line: f.line,
      side: "RIGHT",
    });
  }
  console.log(`Posted ${plan.toPost.length} new review comment(s) (${plan.skippedAlreadyPosted} already present from a prior run).`);
}

async function main(): Promise<void> {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    console.error("TYPESAFE_API_KEY is required.");
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));
  const cwd = options.cwd;

  const diffResult = await collectGitDiffAgainstRef(cwd, options.baseRef);
  if (diffResult.kind === "unsupported") {
    console.error(`Cannot review: ${diffResult.reason}`);
    process.exit(1);
  }
  if (diffResult.kind === "empty") {
    console.log(`No changes vs ${options.baseRef} — nothing to review.`);
    return;
  }

  const ruleFiles = await loadRuleFiles(join(cwd, options.rulesDir));
  if (ruleFiles.length === 0) {
    console.log(`No rule files (*.md) found in "${options.rulesDir}/" — nothing to check.`);
    return;
  }
  const matched = ruleFiles.filter((rf) => diffResult.changedFiles.some((f) => matchesAnyGlob(f, rf.globs)));
  const rules: Rule[] = matched.flatMap((rf) => rf.rules.map((r) => ({ ...r, id: `${rf.relPath}::${r.id}` })));
  if (rules.length === 0) {
    console.log(`None of the rule files in "${options.rulesDir}/" apply to the changed files.`);
    return;
  }
  console.log(`Applying ${rules.length} rule(s) from: ${matched.map((f) => f.relPath).join(", ")}`);

  let diff = diffResult.diff;
  const diffTruncated = diff.length > options.maxDiffChars;
  if (diffTruncated) diff = diff.slice(0, options.maxDiffChars);

  const files = await collectFileContext(cwd, diffResult.changedFiles, {
    maxFileContextChars: options.maxFileContextChars,
    maxTotalContextChars: options.maxTotalContextChars,
  });
  const state: JevState = { diff, diffTruncated, files, disclosures: [] };

  const assessments = await callJev(apiKey, rules, state, undefined, options.maxRulesPerRequest);
  const violations = assessments.filter((a) => a.outcome === "violation");
  console.log(`Result: ${violations.length} violation(s) out of ${assessments.length} rule(s) checked.`);

  const findings: Finding[] = [];
  if (violations.length > 0) {
    const rulesById = new Map(rules.map((r) => [r.id, r]));
    const diffBlocks = parseDiffBlocks(diffResult.diff);
    const enrichment = await enrichViolations(
      apiKey,
      violations.map((a) => ({ rule: rulesById.get(a.ruleId)! })),
      state,
      diffBlocks,
      undefined,
      options.maxRulesPerRequest
    );
    for (const v of violations) {
      const e = enrichment.get(v.ruleId);
      const rule = rulesById.get(v.ruleId)!;
      findings.push({
        ruleId: v.ruleId,
        ruleName: v.ruleName,
        ruleInstructions: rule.instructions,
        severity: e?.severity?.level ?? null,
        confidence: v.confidence,
        path: e?.locatedFile ?? null,
        line: e?.locatedLine ?? null,
      });
    }
  }

  if (options.dryRun) {
    for (const f of findings) console.log(JSON.stringify(f, null, 2));
  } else {
    await postFindingsToGithub(findings);
  }

  if (options.failOnViolation && violations.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  if (err instanceof JevApiError) {
    console.error(`Jev API error (${err.kind}): ${err.message}`);
  } else {
    console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  }
  process.exit(1);
});
