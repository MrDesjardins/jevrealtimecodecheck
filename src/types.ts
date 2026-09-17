export interface Rule {
  id: string;
  name: string;
  instructions: string;
  headingLine: number;
}

export type RuleOutcome =
  | "compliant"
  | "violation"
  | "not_applicable"
  | "insufficient_context";

export interface RuleAssessment {
  ruleId: string;
  ruleName: string;
  outcome: RuleOutcome | "error";
  confidence: number | null;
  probabilities: Record<string, number> | null;
  errorMessage?: string;
}

export interface AnalysisResult {
  timestamp: number;
  durationMs: number;
  assessments: RuleAssessment[];
  contextNote: string | null;
  source: "live" | "mock";
}

export interface GitDiffResult {
  kind: "diff" | "empty" | "unsupported";
  diff: string;
  changedFiles: string[];
  reason?: string;
  untrackedFiles?: string[];
}

export interface FileContextEntry {
  path: string;
  content: string;
  truncated: boolean;
  omitted: boolean;
}
