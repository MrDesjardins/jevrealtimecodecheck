import * as vscode from "vscode";
import { join } from "node:path";
import { collectGitDiff } from "./gitDiff";
import { collectFileContext } from "./fileContext";
import { callJev, enrichViolations, JevApiError, JevState } from "./jevClient";
import { mockAnalyze } from "./mockJev";
import { getApiKey } from "./credentials";
import { firstChangedLineByFile, parseDiffBlocks } from "./diffLocations";
import { loadRuleFiles, RuleFile } from "./ruleFiles";
import { matchesAnyGlob } from "./globMatch";
import { AnalysisResult, Rule, RuleAssessment } from "./types";

export type AnalysisStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "result"; result: AnalysisResult }
  | { kind: "no_rules"; message: string }
  | { kind: "unsupported"; reason: string }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export interface AnalysisConfig {
  rulesDir: string;
  maxDiffChars: number;
  maxFileContextChars: number;
  maxTotalContextChars: number;
  maxRulesPerRequest: number;
}

/**
 * Combines rules from every rule file whose `applies_to` globs match at
 * least one changed file. Rule ids are namespaced per file
 * (`<file>::<rule-id>`) since parseRules only guarantees uniqueness within
 * a single file, and multiple rule files are now combined into one set of
 * Jev questions.
 */
function selectApplicableRules(
  ruleFiles: RuleFile[],
  changedFiles: string[]
): { rules: Rule[]; matchedFileNames: string[] } {
  const matched = ruleFiles.filter((rf) => changedFiles.some((f) => matchesAnyGlob(f, rf.globs)));
  const rules: Rule[] = matched.flatMap((rf) =>
    rf.rules.map((r) => ({ ...r, id: `${rf.relPath}::${r.id}` }))
  );
  return { rules, matchedFileNames: matched.map((rf) => rf.relPath) };
}

export class AnalysisController {
  private generation = 0;
  private activeAbort: AbortController | null = null;

  constructor(
    private readonly secrets: vscode.SecretStorage,
    private readonly onStatus: (status: AnalysisStatus) => void
  ) {}

  private getConfig(): AnalysisConfig {
    const cfg = vscode.workspace.getConfiguration("jevCodeCheck");
    return {
      rulesDir: cfg.get<string>("rulesDir", "jev"),
      maxDiffChars: cfg.get<number>("maxDiffChars", 20000),
      maxFileContextChars: cfg.get<number>("maxFileContextChars", 8000),
      maxTotalContextChars: cfg.get<number>("maxTotalContextChars", 40000),
      maxRulesPerRequest: cfg.get<number>("maxRulesPerRequest", 20),
    };
  }

  async run(workspaceRoot: string, options: { forceMock?: boolean } = {}): Promise<void> {
    this.generation++;
    const myGen = this.generation;

    if (this.activeAbort) {
      this.activeAbort.abort();
    }
    const abort = new AbortController();
    this.activeAbort = abort;

    this.onStatus({ kind: "running" });
    const startedAt = Date.now();

    try {
      const config = this.getConfig();
      const rulesDirAbsPath = join(workspaceRoot, config.rulesDir);

      const diffResult = await collectGitDiff(workspaceRoot);
      if (myGen !== this.generation) return;

      if (diffResult.kind === "unsupported") {
        this.onStatus({ kind: "unsupported", reason: diffResult.reason ?? "Unsupported repository state." });
        return;
      }
      if (diffResult.kind === "empty") {
        this.onStatus({ kind: "empty" });
        return;
      }

      const ruleFiles = await loadRuleFiles(rulesDirAbsPath);
      if (myGen !== this.generation) return;
      if (ruleFiles.length === 0) {
        this.onStatus({
          kind: "no_rules",
          message: `No rule files (*.md) found in "${config.rulesDir}/". Add one, e.g. "${config.rulesDir}/typescript.md".`,
        });
        return;
      }

      const { rules, matchedFileNames } = selectApplicableRules(ruleFiles, diffResult.changedFiles);
      if (rules.length === 0) {
        this.onStatus({
          kind: "no_rules",
          message: `None of the ${ruleFiles.length} rule file(s) in "${config.rulesDir}/" (${ruleFiles
            .map((f) => f.relPath)
            .join(", ")}) apply to the changed file(s): ${diffResult.changedFiles.join(", ")}.`,
        });
        return;
      }

      const disclosures: string[] = [`Applied rules from: ${matchedFileNames.join(", ")}.`];
      let diff = diffResult.diff;
      let diffTruncated = false;
      if (diff.length > config.maxDiffChars) {
        diff = diff.slice(0, config.maxDiffChars);
        diffTruncated = true;
        disclosures.push(
          `Diff truncated to ${config.maxDiffChars} characters (full diff was ${diffResult.diff.length} characters).`
        );
      }

      if (diffResult.untrackedFiles && diffResult.untrackedFiles.length > 0) {
        disclosures.push(
          `${diffResult.untrackedFiles.length} untracked file(s) excluded (untracked files are not analyzed): ${diffResult.untrackedFiles
            .slice(0, 5)
            .join(", ")}${diffResult.untrackedFiles.length > 5 ? ", ..." : ""}`
        );
      }

      const files = await collectFileContext(workspaceRoot, diffResult.changedFiles, {
        maxFileContextChars: config.maxFileContextChars,
        maxTotalContextChars: config.maxTotalContextChars,
      });
      if (myGen !== this.generation) return;

      const omitted = files.filter((f) => f.omitted);
      const truncated = files.filter((f) => f.truncated);
      if (omitted.length > 0) {
        disclosures.push(`${omitted.length} changed file(s) omitted from context (deleted, unreadable, or over the total context limit).`);
      }
      if (truncated.length > 0) {
        disclosures.push(`${truncated.length} file(s) had their context truncated to ${config.maxFileContextChars} characters.`);
      }

      const state: JevState = { diff, diffTruncated, files, disclosures };

      const apiKey = await getApiKey(this.secrets);
      const useMock = options.forceMock || !apiKey;
      if (useMock && !options.forceMock) {
        disclosures.push("No Jev API key configured — showing OFFLINE MOCK results, not live Jev output.");
      } else if (useMock) {
        disclosures.push("Mock mode requested — showing OFFLINE MOCK results, not live Jev output.");
      }

      const assessments = useMock
        ? mockAnalyze(rules, state)
        : await callJev(apiKey as string, rules, state, abort.signal, config.maxRulesPerRequest);

      if (myGen !== this.generation) return;

      const buildResult = (): AnalysisResult => ({
        timestamp: Date.now(),
        durationMs: Date.now() - startedAt,
        assessments,
        contextNote: disclosures.length > 0 ? disclosures.join(" • ") : null,
        source: useMock ? "mock" : "live",
      });

      // Second pass: for real violations only, ask Jev to rate severity
      // (score primitive) and localize the responsible file (choice
      // primitive), on top of the initial choice-per-rule pass. Best-effort —
      // a failure here is disclosed but does not fail the whole analysis.
      //
      // Classifications are shown immediately, before this second request
      // even goes out, so the (usually much larger) primary result isn't
      // held up waiting on severity/location for a handful of violations.
      const violations: RuleAssessment[] = useMock
        ? []
        : assessments.filter((a) => a.outcome === "violation");

      if (violations.length > 0) {
        this.onStatus({ kind: "result", result: buildResult() });

        const rulesById = new Map(rules.map((r) => [r.id, r]));
        const diffBlocks = parseDiffBlocks(diffResult.diff);
        try {
          const enrichment = await enrichViolations(
            apiKey as string,
            violations
              .map((a) => rulesById.get(a.ruleId))
              .filter((r): r is Rule => Boolean(r))
              .map((rule) => ({ rule })),
            state,
            diffBlocks,
            abort.signal,
            config.maxRulesPerRequest
          );
          if (myGen !== this.generation) return;
          for (const a of violations) {
            const e = enrichment.get(a.ruleId);
            if (e) {
              a.severity = e.severity ?? undefined;
              a.locatedFile = e.locatedFile;
              a.locatedLine = e.locatedLine;
            }
          }
        } catch (err) {
          disclosures.push(
            `Severity/location enrichment failed (${
              err instanceof Error ? err.message : String(err)
            }) — violations shown without severity or file localization.`
          );
        }
      }

      // Fallback only: live enrichment already resolves a precise locatedLine
      // per diff block. Mock mode only sets locatedFile, so fall back to the
      // file's first changed line there.
      const diffLineByFile = firstChangedLineByFile(diffResult.diff);
      for (const a of assessments) {
        if (a.locatedFile && a.locatedLine == null) {
          a.locatedLine = diffLineByFile.get(a.locatedFile) ?? null;
        }
      }

      this.onStatus({ kind: "result", result: buildResult() });
    } catch (err) {
      if (myGen !== this.generation) return;
      if (err instanceof JevApiError) {
        const hint =
          err.kind === "payload_too_large"
            ? ` Try lowering "jevCodeCheck.maxRulesPerRequest" (currently ${this.getConfig().maxRulesPerRequest}) in settings.`
            : "";
        this.onStatus({ kind: "error", message: err.message + hint });
      } else {
        this.onStatus({
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      if (this.activeAbort === abort) {
        this.activeAbort = null;
      }
    }
  }
}
