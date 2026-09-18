export interface Finding {
  ruleId: string;
  ruleName: string;
  ruleInstructions: string;
  severity: string | null;
  confidence: number | null;
  path: string | null;
  line: number | null;
}

export const commentMarker = (ruleId: string): string => `<!-- jev-review:${ruleId} -->`;

const MARKER_PATTERN = /<!-- jev-review:(.+?) -->/;

/**
 * Comment text is built entirely from structured fields plus the rule's own
 * static instructions — nothing here is model-generated free text, matching
 * the "no generated explanations" constraint the rest of the project follows.
 */
export function buildCommentBody(f: Finding): string {
  return [
    `**Jev: ${f.ruleName}**${f.severity ? ` · ${f.severity}` : ""}`,
    `Confidence: ${
      typeof f.confidence === "number" ? `${Math.round(f.confidence * 100)}%` : "unknown"
    } (confidence reflects model certainty, not correctness)`,
    "",
    "Rule (verbatim, not model-generated):",
    "> " + f.ruleInstructions.split("\n").join("\n> "),
    "",
    commentMarker(f.ruleId),
  ].join("\n");
}

export function extractMarker(commentBody: string): string | null {
  return commentBody.match(MARKER_PATTERN)?.[0] ?? null;
}

export interface CommentPlan {
  toPost: Finding[];
  skippedUnlocalized: number;
  skippedAlreadyPosted: number;
}

/**
 * Decides which findings should get a new PR comment: only ones Jev could
 * localize to a file/line, and only if a comment for that exact rule isn't
 * already present on the PR from a prior run (avoids re-commenting the same
 * violation on every push).
 */
export function planComments(findings: Finding[], existingCommentBodies: string[]): CommentPlan {
  const alreadyPosted = new Set(
    existingCommentBodies.map(extractMarker).filter((m): m is string => m !== null)
  );

  const toPost: Finding[] = [];
  let skippedUnlocalized = 0;
  let skippedAlreadyPosted = 0;

  for (const f of findings) {
    if (!f.path || !f.line) {
      skippedUnlocalized++;
      continue;
    }
    if (alreadyPosted.has(commentMarker(f.ruleId))) {
      skippedAlreadyPosted++;
      continue;
    }
    toPost.push(f);
  }

  return { toPost, skippedUnlocalized, skippedAlreadyPosted };
}
