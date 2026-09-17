import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectFileContext } from "../src/fileContext";

test("truncates a single file beyond the per-file cap and discloses it", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-ctx-"));
  await writeFile(join(dir, "big.txt"), "x".repeat(1000));

  const entries = await collectFileContext(dir, ["big.txt"], {
    maxFileContextChars: 100,
    maxTotalContextChars: 10000,
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].truncated, true);
  assert.equal(entries[0].content.length, 100);
  await rm(dir, { recursive: true, force: true });
});

test("omits files once the total context budget is exhausted", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-ctx-"));
  await writeFile(join(dir, "a.txt"), "x".repeat(80));
  await writeFile(join(dir, "b.txt"), "y".repeat(80));

  const entries = await collectFileContext(dir, ["a.txt", "b.txt"], {
    maxFileContextChars: 100,
    maxTotalContextChars: 80,
  });

  assert.equal(entries[0].omitted, false);
  assert.equal(entries[1].omitted, true);
  await rm(dir, { recursive: true, force: true });
});

test("omits missing/deleted files instead of throwing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-ctx-"));
  const entries = await collectFileContext(dir, ["does-not-exist.txt"], {
    maxFileContextChars: 100,
    maxTotalContextChars: 100,
  });
  assert.equal(entries[0].omitted, true);
  await rm(dir, { recursive: true, force: true });
});
