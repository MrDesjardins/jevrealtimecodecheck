// Scratch file for exercising jev-rules.md against real edits.
// Not part of the extension build (tsconfig only includes src/** and test/**).

export function isValidEmail(input: string): boolean {
  const at = input.indexOf("@");
  return at > 0 && at < input.length - 1;
}

export function parseCount(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export async function loadConfig(path: string): Promise<Record<string, string>> {
  try {
    const data = await readConfigFile(path);
    return data;
  } catch (err) {
    console.error("Failed to load config", err);
    throw err;
  }
}

async function readConfigFile(path: string): Promise<Record<string, string>> {
  return { path };
}
