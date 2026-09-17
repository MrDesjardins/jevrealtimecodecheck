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

export const SEVERITY_LEVELS = ["Minor", "Moderate", "Major", "Blocking"] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export interface SeverityAssessment {
  level: SeverityLevel;
  score: number;
  confidence: number | null;
}

export interface RuleAssessment {
  ruleId: string;
  ruleName: string;
  outcome: RuleOutcome | "error";
  confidence: number | null;
  probabilities: Record<string, number> | null;
  errorMessage?: string;
  /** Only populated for violations, via a follow-up Jev `score` question. */
  severity?: SeverityAssessment;
  /** Only populated for violations, via a follow-up Jev `choice` question. Null means Jev could not pin it to one file. */
  locatedFile?: string | null;
  /** Resolved deterministically from the diff's hunk headers for locatedFile — never asked of the model. */
  locatedLine?: number | null;
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
