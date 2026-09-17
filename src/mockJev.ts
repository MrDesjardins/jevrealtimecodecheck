import { Rule, RuleAssessment } from "./types";
import { JevState } from "./jevClient";

/**
 * Offline fallback used only when no API key is configured, or when the
 * caller explicitly requests mock mode. Uses simple keyword heuristics over
 * added diff lines so the bundled demo rules produce a plausible result
 * without a live API call. This is NOT a substitute for real Jev judgment.
 */
export function mockAnalyze(rules: Rule[], state: JevState): RuleAssessment[] {
  const addedLines = state.diff
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .map((l) => l.slice(1));
  const addedText = addedLines.join("\n");

  // Current full content of touched files, used for checks that need to see
  // the whole picture (e.g. "is there a matching removeEventListener
  // anywhere in this file"), not just the added diff lines.
  const fullContent = state.files
    .filter((f) => !f.omitted)
    .map((f) => f.content)
    .join("\n");

  return rules.map((rule) => {
    const nameLower = rule.name.toLowerCase();
    let outcome: RuleAssessment["outcome"] = "compliant";
    let confidence = 0.55;

    if (nameLower.includes("null")) {
      if (/return[^;\n]*\bnull\b/.test(addedText)) {
        outcome = "violation";
        confidence = 0.78;
      }
    } else if (nameLower.includes("cleanup") || nameLower.includes("event listener")) {
      const addsListener = /addEventListener\s*\(/.test(fullContent);
      const hasCleanup = /removeEventListener\s*\(/.test(fullContent);
      if (addsListener && !hasCleanup) {
        outcome = "violation";
        confidence = 0.72;
      } else if (!addsListener) {
        outcome = "not_applicable";
        confidence = 0.5;
      }
    } else if (nameLower.includes("error") && nameLower.includes("recover")) {
      const candidates =
        fullContent.match(/["'`]([^"'`]{5,})["'`]/g)?.map((s) => s.slice(1, -1)) ?? [];
      const errorish = candidates.filter((s) =>
        /(could not|couldn't|failed|failure|unable|error|something went wrong)/i.test(s)
      );
      const hasGuidance = errorish.some((s) =>
        /(try again|please|check|reconnect|refresh|contact|retry)/i.test(s)
      );
      if (errorish.length > 0 && !hasGuidance) {
        outcome = "violation";
        confidence = 0.65;
      } else if (errorish.length === 0) {
        outcome = "not_applicable";
        confidence = 0.5;
      }
    } else if (addedLines.length === 0) {
      outcome = "not_applicable";
      confidence = 0.4;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      outcome,
      confidence,
      probabilities: null,
    };
  });
}
