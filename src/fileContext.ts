import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FileContextEntry } from "./types";
import { mapWithConcurrency } from "./concurrency";

export interface FileContextLimits {
  maxFileContextChars: number;
  maxTotalContextChars: number;
}

const READ_CONCURRENCY = 8;

/**
 * Reads current working-tree content for each changed file, applying a
 * per-file cap and a total cap. Anything cut is marked so the caller can
 * disclose it rather than silently truncating.
 *
 * Reads run with bounded concurrency (independent I/O), but the total-budget
 * accounting below is applied afterward in the original file order, so which
 * files get truncated/omitted first stays deterministic regardless of read
 * timing.
 */
export async function collectFileContext(
  cwd: string,
  changedFiles: string[],
  limits: FileContextLimits
): Promise<FileContextEntry[]> {
  const rawContents = await mapWithConcurrency(changedFiles, READ_CONCURRENCY, async (relPath) => {
    try {
      return await readFile(join(cwd, relPath), "utf8");
    } catch {
      // Deleted file, binary, or unreadable: omit with disclosure.
      return null;
    }
  });

  const entries: FileContextEntry[] = [];
  let totalUsed = 0;

  changedFiles.forEach((relPath, i) => {
    const raw = rawContents[i];
    if (raw === null || totalUsed >= limits.maxTotalContextChars) {
      entries.push({ path: relPath, content: "", truncated: false, omitted: true });
      return;
    }

    const remainingTotal = limits.maxTotalContextChars - totalUsed;
    const cap = Math.min(limits.maxFileContextChars, remainingTotal);
    const truncated = raw.length > cap;
    const content = truncated ? raw.slice(0, cap) : raw;
    totalUsed += content.length;

    entries.push({ path: relPath, content, truncated, omitted: false });
  });

  return entries;
}
