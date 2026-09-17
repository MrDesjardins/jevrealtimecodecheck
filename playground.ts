// Scratch file for exercising jev-rules.md against real edits.
// Not part of the extension build (tsconfig only includes src/** and test/**).

export function isValidEmail(input: string): boolean {
  const at = input.indexOf("@");
  return at > 0 && at < input.length;
}

export function parseCount(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

