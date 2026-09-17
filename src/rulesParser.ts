import { Rule } from "./types";

const FENCE_RE = /^(```|~~~)/;
const TOP_HEADING_RE = /^#(?!#)\s+(.+?)\s*$/;

function slugify(name: string, used: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "rule";
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n++;
  }
  used.add(candidate);
  return candidate;
}

/**
 * Parses top-level `#` headings as rules. Content inside fenced code blocks
 * (``` or ~~~) is never treated as a heading, even if it starts with `#`.
 */
export function parseRules(markdown: string): Rule[] {
  const lines = markdown.split(/\r\n|\r|\n/);
  const used = new Set<string>();

  type Draft = { name: string; headingLine: number; bodyLines: string[] };
  const drafts: Draft[] = [];

  let inFence = false;
  let fenceMarker = "";
  let current: Draft | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(FENCE_RE);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1];
      } else if (line.trim().startsWith(fenceMarker)) {
        inFence = false;
        fenceMarker = "";
      }
      current?.bodyLines.push(line);
      continue;
    }

    if (!inFence) {
      const headingMatch = line.match(TOP_HEADING_RE);
      if (headingMatch) {
        current = { name: headingMatch[1], headingLine: i, bodyLines: [] };
        drafts.push(current);
        continue;
      }
    }

    current?.bodyLines.push(line);
  }

  return drafts.map((d) => ({
    id: slugify(d.name, used),
    name: d.name,
    instructions: d.bodyLines.join("\n").trim(),
    headingLine: d.headingLine,
  }));
}
