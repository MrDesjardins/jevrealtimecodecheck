import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FileContextEntry } from "./types";

export interface FileContextLimits {
  maxFileContextChars: number;
  maxTotalContextChars: number;
}

/**
 * Reads current working-tree content for each changed file, applying a
 * per-file cap and a total cap. Anything cut is marked so the caller can
 * disclose it rather than silently truncating.
 */
export async function collectFileContext(
  cwd: string,
  changedFiles: string[],
  limits: FileContextLimits
): Promise<FileContextEntry[]> {
  const entries: FileContextEntry[] = [];
  let totalUsed = 0;

  for (const relPath of changedFiles) {
    if (totalUsed >= limits.maxTotalContextChars) {
      entries.push({
        path: relPath,
        content: "",
        truncated: false,
        omitted: true,
      });
      continue;
    }

    let raw: string;
    try {
      raw = await readFile(join(cwd, relPath), "utf8");
    } catch {
      // Deleted file, binary, or unreadable: omit with disclosure.
      entries.push({
        path: relPath,
        content: "",
        truncated: false,
        omitted: true,
      });
      continue;
    }

    const remainingTotal = limits.maxTotalContextChars - totalUsed;
    const cap = Math.min(limits.maxFileContextChars, remainingTotal);
    const truncated = raw.length > cap;
    const content = truncated ? raw.slice(0, cap) : raw;
    totalUsed += content.length;

    entries.push({ path: relPath, content, truncated, omitted: false });
  }

  return entries;
}
