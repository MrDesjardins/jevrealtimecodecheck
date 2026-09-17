# Jev Realtime Code Check

A VS Code / Cursor extension that checks your local Git changes against
your own coding rules, using [TypeSafe AI](https://docs.typesafe.ai)'s
**Jev** model. It watches your diff, not your whole repo — only the rules
relevant to the file types you actually touched get sent, and only *new*
violations introduced by your change are flagged.

📺 **Demo video:** https://youtu.be/goVDTUd7-J0

## What it does

- Reads a directory of Markdown rule files (default `jev/`), one `#`
  heading per rule.
- Each rule file can declare which files it applies to via a frontmatter
  header:
  ```md
  ---
  applies_to: **/*.ts, **/*.tsx
  ---
  ```
  A Python-only diff never loads your TypeScript rules; a `.tsx` change
  only loads your React rules. No frontmatter means "applies to
  everything."
- Collects the combined staged + unstaged diff for tracked files
  (`git diff HEAD`), plus surrounding file content, as context.
- Sends one `choice` question per applicable rule to Jev in as few
  requests as possible — batched adaptively by measured payload size (not
  a fixed count), since diff/file context size varies far more than rule
  count does.
- For anything Jev flags as a **violation**, a smaller follow-up request
  asks two more questions per violation: a `score` question rating
  **severity** (Minor → Moderate → Major → Blocking), and a `choice`
  question picking which specific added block of code is responsible.
- Real line numbers for that block come from parsing the diff's own hunk
  headers — never invented by the model. Clicking a violation jumps
  straight to that file/line; it also shows up as a Problems-panel
  diagnostic.
- Results are grouped in the sidebar by outcome (Violations and errors on
  top and expanded; Compliant/Not applicable collapsed at the bottom,
  since with hundreds of rules those are mostly noise, not signal), sorted
  within Violations by severity.
- Debounced analysis on save and on every edit (typing, paste, or
  programmatic changes), throttled to at most once per second.
- Works offline too: with no API key configured, a labeled **OFFLINE
  MOCK** mode runs simple heuristics instead of a live call, so you can
  still see the UI flow.

## Why "rules as data"

Rules are just Markdown you write and version-control like any other
project file — no plugin code, no schema beyond a heading and an optional
frontmatter line. This repo ships **370 example rules across 11 file
types** as a starting point/stress test (TypeScript, React/TSX, CSS, Sass,
Markdown, Python, Go, JSON, YAML, HTML, and shell), each with a Good/Bad
code example:

| File | Applies to | Rules |
|---|---|---|
| `jev/typescript.md` | `**/*.ts` | 123 |
| `jev/python.md` | `**/*.py` | 40 |
| `jev/css.md` | `**/*.css` | 35 |
| `jev/go.md` | `**/*.go` | 30 |
| `jev/markdown.md` | `**/*.md` | 25 |
| `jev/html.md` | `**/*.html` | 24 |
| `jev/react.md` | `**/*.tsx` | 23 |
| `jev/scss.md` | `**/*.scss` | 20 |
| `jev/shell.md` | `**/*.sh` | 20 |
| `jev/json.md` | `**/*.json` | 15 |
| `jev/yaml.md` | `**/*.yml`, `**/*.yaml` | 15 |

Delete what you don't need, edit anything, or write your own — a rule file
is just:

~~~md
---
applies_to: **/*.ts
---

# No console statements
Code must not contain `console.log`, `console.debug`, or `console.info`
calls. Use a proper logger, or remove them before committing.

Good:
```ts
logger.info("Config loaded", { path });
```

Bad:
```ts
console.log("Config loaded", path);
```
~~~

## Install

```bash
cursor --install-extension jev-code-check-0.1.0.vsix
```

Or in the UI: Extensions view → `...` → **Install from VSIX...**.

## Setup

1. Command Palette → **Jev: Set Jev API key** (stored in VS Code
   SecretStorage; alternatively set `TYPESAFE_API_KEY` in the launching
   environment). Without a key, results are labeled **OFFLINE MOCK**.
2. Open the **Jev Code Check** icon in the Activity Bar.
3. Run **Jev: Analyze changes**, or enable automatic analysis via
   **Jev: Toggle automatic analysis for this workspace** (opt-in, with an
   explicit confirmation dialog explaining what gets sent).

## Configuration

| Setting | Default | Description |
|---|---|---|
| `jevCodeCheck.rulesDir` | `jev` | Directory of `*.md` rule files, relative to the workspace root. |
| `jevCodeCheck.autoAnalyzeOnSave` | `false` | Opt-in: analyze as you edit and on save (throttled to 1/sec). |
| `jevCodeCheck.debounceMs` | `1200` | Inactivity delay before auto-analysis; floored at 1000ms. |
| `jevCodeCheck.maxDiffChars` | `20000` | Diff text cap sent to Jev; excess is disclosed, not silently dropped. |
| `jevCodeCheck.maxFileContextChars` | `8000` | Per-file content cap. |
| `jevCodeCheck.maxTotalContextChars` | `40000` | Total file-context cap across all changed files. |
| `jevCodeCheck.maxRulesPerRequest` | `20` | Upper bound on rules per request; actual batches are sized smaller automatically if diff/file context is large. |

## Project layout

```
src/                  Extension source (TypeScript)
test/                 Unit tests (node:test)
jev/                  Rule files for this repo's own code (dogfooding)
demo-fixture/         Small React app + jev/ rules for a guided before/after demo
playground.ts         Scratch file for exercising rules against real edits
```

## Development

```bash
npm install
npm run typecheck
node --import tsx --test test/*.test.ts
npm run package        # produces the .vsix
```

See `INSTALL.md` for a step-by-step install/demo walkthrough, and
`demo-fixture/BEFORE_AFTER.md` for a guided edit → violation → revert
script.
