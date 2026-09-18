/**
 * Extracts, for each file touched by a unified diff, the 1-based line number
 * (in the NEW version of the file) where its first hunk begins. Used to jump
 * the editor to a real location without ever asking the model for a line
 * number — hunk headers are exact, so there's nothing to hallucinate.
 */
export function firstChangedLineByFile(diff: string): Map<string, number> {
  const result = new Map<string, number>();
  const lines = diff.split("\n");

  let currentFile: string | null = null;

  for (const line of lines) {
    const fileHeaderMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileHeaderMatch) {
      currentFile = fileHeaderMatch[1];
      continue;
    }

    if (currentFile && !result.has(currentFile)) {
      const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        result.set(currentFile, parseInt(hunkMatch[1], 10));
      }
    }
  }

  return result;
}

export interface DiffBlock {
  file: string;
  /** 1-based line number in the NEW version of the file. */
  startLine: number;
  preview: string;
}

/**
 * Splits a unified diff into small added-line blocks, each carrying the real
 * starting line number from the diff itself. This gives Jev finer-grained
 * candidates to localize a violation to than "the file's first hunk" —
 * important when a whole file is rewritten as one giant hunk, which
 * otherwise always resolves to line 1 regardless of where the violation
 * actually is. Line numbers are still never invented by the model: they're
 * read directly off the hunk headers and running line count.
 *
 * A run of added lines is first split on blank lines / removals / context
 * lines (paragraph-like boundaries), same as before. But a long run with NO
 * internal blank line — e.g. one 8-line function body added in one go — is
 * then further chunked into groups of at most `maxLinesPerBlock` lines
 * (default: 1, i.e. one candidate location per added line). Without this,
 * an entire multi-line function collapses into a single block, so every
 * violation inside it resolves to the same (first) line regardless of which
 * statement it's actually about — confirmed in practice: a TODO on one line
 * and a console.log two lines later both resolved to the function's first
 * line until this was added.
 *
 * Limiting is done PER FILE (`maxBlocksPerFile`), not with one global cap —
 * a single global cap taken in file order silently dropped every candidate
 * for files that happened to come later in the diff, so any violation in
 * those files could only ever resolve to "unclear" (and therefore wasn't
 * clickable). `maxTotalBlocks` is just a hard safety ceiling for pathological
 * diffs, not the primary limiting mechanism.
 */
export function parseDiffBlocks(
  diff: string,
  maxBlocksPerFile = 40,
  maxTotalBlocks = 600,
  maxLinesPerBlock = 1
): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let currentFile: string | null = null;
  let newLineNo = 0;
  let current: { file: string; lines: { lineNo: number; text: string }[] } | null = null;

  const finalize = () => {
    if (current && current.lines.length > 0) {
      for (let i = 0; i < current.lines.length; i += maxLinesPerBlock) {
        const chunk = current.lines.slice(i, i + maxLinesPerBlock);
        blocks.push({
          file: current.file,
          startLine: chunk[0].lineNo,
          preview: chunk
            .map((l) => l.text)
            .join(" ")
            .trim()
            .slice(0, 100),
        });
      }
    }
    current = null;
  };

  for (const line of diff.split("\n")) {
    if (blocks.length >= maxTotalBlocks) break;

    if (line.startsWith("diff --git")) {
      finalize();
      currentFile = null;
      continue;
    }
    const fileHeaderMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileHeaderMatch) {
      finalize();
      currentFile = fileHeaderMatch[1];
      continue;
    }
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      finalize();
      newLineNo = parseInt(hunkMatch[1], 10);
      continue;
    }
    if (!currentFile || line.startsWith("---") || line.startsWith("index ")) {
      continue;
    }

    if (line.startsWith("+")) {
      const content = line.slice(1);
      if (content.trim() === "") {
        finalize();
      } else if (current) {
        current.lines.push({ lineNo: newLineNo, text: content.trim() });
      } else {
        current = { file: currentFile, lines: [{ lineNo: newLineNo, text: content.trim() }] };
      }
      newLineNo++;
    } else if (line.startsWith("-")) {
      finalize();
      // Removed line only existed in the old file — new-file line count doesn't advance.
    } else {
      // Context line (or anything else): breaks the current run.
      finalize();
      newLineNo++;
    }
  }
  finalize();

  const perFileCount = new Map<string, number>();
  return blocks.filter((b) => {
    const count = perFileCount.get(b.file) ?? 0;
    if (count >= maxBlocksPerFile) return false;
    perFileCount.set(b.file, count + 1);
    return true;
  });
}
