# Jev Realtime Code Check — install & demo (tonight)

## 1. Install the extension

One command builds, packages, and installs it (auto-detects `cursor` or
`code` on PATH):

```bash
npm run install:extension
```

Or manually:

```bash
npm run package   # produces jev-code-check-0.1.0.vsix
cursor --install-extension jev-code-check-0.1.0.vsix   # or: code --install-extension ...
```

Or in the UI: Extensions view → `...` menu → **Install from VSIX...** → pick the file.

Reload the window if prompted. A new **Jev Code Check** icon appears in the
Activity Bar with a "Rule Assessments" panel. The extension itself ships
with **no rules** — that's on the installing project to define (see step 5).

## 2. Set your API key (optional but recommended for live results)

Command Palette → **Jev: Set Jev API key** → paste your TypeSafe key.
Stored in VS Code SecretStorage (never written to disk in plain text, never
logged). Alternatively, set `TYPESAFE_API_KEY` in the environment Cursor is
launched from.

Without a key, the extension still works and clearly labels results as
**OFFLINE MOCK** (heuristic, not live Jev output) — good enough to see the
UI, not a substitute for real judgment.

## 3. Enable automatic analysis for a workspace (optional)

Command Palette → **Jev: Toggle automatic analysis for this workspace**.
You'll get an explicit one-time confirmation dialog explaining that your
changed code and surrounding file context will be sent to TypeSafe on every
save. It's off by default and scoped per workspace. You can always trigger
analysis manually with **Jev: Analyze changes** (also available as the sync
icon in the panel's title bar) instead of enabling auto-save analysis.

## 4. Commit the current baseline first

Everything (extension source, `jev-rules.md`, `demo-fixture/`,
`playground.ts`) is currently staged but **not committed**. The extension
diffs against `HEAD`, so commit once to establish a clean baseline before
testing:

```bash
cd /home/miste/code/jevrealtimecodecheck
git commit -m "Add Jev Realtime Code Check extension"
```

`demo-fixture/` is a plain folder in this same repo (no nested `.git`), so
diffs from either workspace below are scoped correctly to whatever folder
you open.

## 5. Rules live in a directory now, not one file

`jevCodeCheck.rulesDir` (default `jev/`) points to a folder of `*.md` rule
files. Each file may start with a frontmatter header:

```md
---
applies_to: **/*.ts, **/*.tsx
---
```

A file's rules only get sent to Jev when at least one **changed** file in
the diff matches one of its globs — a Python-only diff never loads
`jev/typescript.md`, a `.tsx` change loads `jev/react.md`, etc. No
frontmatter means "applies to everything". The sidebar header shows which
rule files were actually applied for a given analysis.

**In a fresh install with no rules yet**, the sidebar's empty state is
clickable: it runs **Jev: Create example rule**, which scaffolds
`jev/example.md` with one generic rule (`applies_to: **/*`) so you have a
real file to edit instead of a blank slate. Delete it, edit it, or add more
`*.md` files alongside it — that's the whole authoring model.

This repo's own dogfooding rules, checking its own source, live in
`/home/miste/code/jevrealtimecodecheck/jev/` (11 files, 370 rules across
TypeScript, React, CSS, Sass, Markdown, Python, Go, JSON, YAML, HTML, and
shell) — none of that ships with the extension; it's just this project's
own rule set, kept in the repo like any other file.

## 6. Run the demo

Two options, same repo:

**A. React demo (`demo-fixture/jev/typescript.md` + `react.md`):**

```bash
cursor /home/miste/code/jevrealtimecodecheck/demo-fixture
```

Follow `demo-fixture/BEFORE_AFTER.md`:
1. Edit `src/api.ts` to return `null` instead of the result type → save →
   sidebar shows **Violation** for "Functions must not return null".
2. Revert → save → back to **Compliant**.
3. Same flow for `src/UserProfile.tsx` (remove the effect cleanup) and
   `src/errors.ts` (strip the recovery sentence from the error message).

**B. Root playground (`jev/typescript.md`, 74 rules):**

```bash
cursor /home/miste/code/jevrealtimecodecheck
```

Edit `playground.ts` (a scratch file, not part of the extension build) —
e.g. add `console.log(value);` inside `parseCount` → save → **Violation**
for "No console statements". Revert → **Compliant**. Same idea for `any`
types, empty `catch {}`, a bare `TODO`, etc.

Use **Jev: Analyze changes** any time instead of waiting for auto-save.

## What was verified before tonight

- TypeScript compiles clean (`npm run typecheck`), extension bundles clean
  (`node esbuild.js`), packaging succeeds (`npx @vscode/vsce package`).
- 15 unit tests pass covering rule parsing (top-level headings, `##`
  subsections treated as body text, fenced code blocks not treated as
  headings, duplicate-name id collisions, empty file) and Git diff
  collection (non-repo, no-HEAD, empty diff, combined staged+unstaged diff,
  untracked files excluded and reported).
- The packaged `.vsix` was installed into this machine's Cursor via
  `cursor --install-extension` and confirmed present via
  `cursor --list-extensions`, then uninstalled again so tonight's install is
  fresh.
- The full non-VS Code pipeline (rules parsing → git diff → file context →
  mock Jev) was run end-to-end against the demo fixture for all 3 rules,
  in both the violating and reverted state, and produced the expected
  `violation` → `compliant` transitions.
- **Not verified tonight:** no live call to `https://api.typesafe.ai/v1/systemone`
  was made (no API key available in this environment), and the sidebar UI
  itself was not visually exercised inside a running Cursor window (this
  is a headless environment). The request/response shapes were built
  directly from the current docs at `docs.typesafe.ai/introduction` and
  `docs.typesafe.ai/api`, but you should do one real save-triggered
  analysis with your key before relying on it live.
