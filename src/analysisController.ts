import * as vscode from "vscode";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { parseRules } from "./rulesParser";
import { collectGitDiff } from "./gitDiff";
import { collectFileContext } from "./fileContext";
import { callJev, JevApiError, JevState } from "./jevClient";
import { mockAnalyze } from "./mockJev";
import { getApiKey } from "./credentials";
import { AnalysisResult, Rule } from "./types";

export type AnalysisStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "result"; result: AnalysisResult }
  | { kind: "no_rules"; rulesFilePath: string }
  | { kind: "unsupported"; reason: string }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export interface AnalysisConfig {
  rulesFile: string;
  maxDiffChars: number;
  maxFileContextChars: number;
  maxTotalContextChars: number;
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
      rulesFile: cfg.get<string>("rulesFile", "jev-rules.md"),
      maxDiffChars: cfg.get<number>("maxDiffChars", 60000),
      maxFileContextChars: cfg.get<number>("maxFileContextChars", 20000),
      maxTotalContextChars: cfg.get<number>("maxTotalContextChars", 100000),
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
      const rulesFilePath = join(workspaceRoot, config.rulesFile);

      let rulesText: string;
      try {
        rulesText = await readFile(rulesFilePath, "utf8");
      } catch {
        if (myGen !== this.generation) return;
        this.onStatus({ kind: "no_rules", rulesFilePath: config.rulesFile });
        return;
      }

      const rules: Rule[] = parseRules(rulesText);
      if (myGen !== this.generation) return;
      if (rules.length === 0) {
        this.onStatus({ kind: "no_rules", rulesFilePath: config.rulesFile });
        return;
      }

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

      const disclosures: string[] = [];
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
        : await callJev(apiKey as string, rules, state, abort.signal);

      if (myGen !== this.generation) return;

      const result: AnalysisResult = {
        timestamp: Date.now(),
        durationMs: Date.now() - startedAt,
        assessments,
        contextNote: disclosures.length > 0 ? disclosures.join(" • ") : null,
        source: useMock ? "mock" : "live",
      };
      this.onStatus({ kind: "result", result });
    } catch (err) {
      if (myGen !== this.generation) return;
      if (err instanceof JevApiError) {
        this.onStatus({ kind: "error", message: err.message });
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
