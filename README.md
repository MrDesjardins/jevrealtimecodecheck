# Jev Code Check

Checks your code changes against your own coding rules, written as plain
Markdown, using [TypeSafe AI](https://docs.typesafe.ai)'s **Jev** model.
It looks at your diff, not your whole repo. Only the rules for the file
types you actually touched are sent, and only *new* violations introduced
by your change are flagged.

One engine (`src/`), four places to run it:

| | Where | Checks | Results go to |
|---|---|---|---|
| 1 | **Your editor** (VS Code / Cursor) | Uncommitted changes, on demand or as you edit | Sidebar + Problems panel |
| 2 | **Command line** | Uncommitted changes, or a branch vs its base | Terminal (JSON) |
| 3 | **CI, on a pull request** | The PR's diff | Inline PR review comments |
| 4 | **A coding agent**, via `AGENTS.md` | The agent's own uncommitted changes | The agent, which fixes them |

📺 **Demo video:** https://youtu.be/goVDTUd7-J0

## How it works

- Reads a directory of Markdown rule files (default `jev/`), one `#`
  heading per rule. A frontmatter `applies_to:` line scopes each file to
  matching paths, so a Python-only diff never loads your TypeScript rules.
  In a mixed diff, each rule is told its scope, and is only offered code
  locations in matching files.
- Collects the diff plus surrounding file content as context.
- Sends one `choice` question per applicable rule to Jev, in as few
  requests as possible. Requests are batched by measured payload size, not
  a fixed count, since diff/context size varies far more than rule count.
- For each **violation**, a smaller follow-up asks Jev for a **severity**
  (Minor → Moderate → Major → Blocking) and which added block of code is
  responsible.
- Real line numbers for that block come from the diff's own hunk headers —
  never invented by the model.

## Setup

Clone this repository **next to** the repositories you check, so they can
all reach it as `../jevrealtimecodecheck`, then install its dependencies:

```bash
cd /path/to/your/code        # the folder that holds your repositories
git clone https://github.com/MrDesjardins/jevrealtimecodecheck.git
cd jevrealtimecodecheck
npm ci
```

Then give it your API key (see below), for example a `.env` file here
containing `TYPESAFE_API_KEY=...`.

Check the setup from a repository that has a `jev/` folder:

```bash
node ../jevrealtimecodecheck/node_modules/tsx/dist/cli.mjs \
  ../jevrealtimecodecheck/scripts/review-pr.ts --cwd . --working-tree
```

With no uncommitted code it prints that no rule applies and exits 0.
Calling `node_modules/tsx/dist/cli.mjs` through `node` works on Windows,
macOS and Linux alike; `node_modules/.bin/tsx` is a shell script that
PowerShell and `cmd` cannot run directly.

To match CI exactly, check out the commit your workflow pins
(`git checkout <sha>`) instead of `main`.

**Claude Code in auto mode** may refuse to run this command the first
time, because it executes code from outside the repository being worked
on. Allow it once with `/permissions`, or add to that repository's
`.claude/settings.local.json`:

```json
{ "permissions": { "allow": [
  "Bash(node ../jevrealtimecodecheck/node_modules/tsx/dist/cli.mjs ../jevrealtimecodecheck/scripts/review-pr.ts:*)",
  "PowerShell(node ../jevrealtimecodecheck/node_modules/tsx/dist/cli.mjs ../jevrealtimecodecheck/scripts/review-pr.ts:*)"
] } }
```

## Ways to run it

All of these need a TypeSafe API key, `TYPESAFE_API_KEY`. The editor
stores it for you (**Jev: Set Jev API key**). The command line looks for
it in this order:

1. The environment.
2. A `.env` file in the repository being checked.
3. A `.env` file in this repository's root, next to `package.json`.

The simplest setup is a single `.env` here containing
`TYPESAFE_API_KEY=...`. Every repository you check, and every agent that
runs the check, then uses it with no extra setup. `.env` is gitignored.

### 1. In your editor

A VS Code / Cursor extension. Run **Jev: Analyze changes** (or the sync
icon in the sidebar), or opt in to automatic analysis with **Jev: Toggle
automatic analysis for this workspace**. Automatic mode is backed by a
filesystem watcher, debounced to fire once edits pause for ~1s, so it also
picks up files written to disk by an AI agent or formatter, not just
editor saves.

Results are grouped by outcome (violations first, sorted by severity) and
show up as Problems-panel diagnostics; clicking one jumps to the line.
With no API key, a labeled **OFFLINE MOCK** mode runs simple heuristics so
you can still see the UI flow.

```bash
npm run install:extension
```

This builds, packages, and installs into whichever of `cursor`/`code` is on
your PATH. Or: `npm run package`, then Extensions view → `...` → **Install
from VSIX...**. See `INSTALL.md` for a step-by-step walkthrough. The
extension ships with **no rules**; if your workspace has no `jev/`
directory, the sidebar's empty state scaffolds a starter rule file.

### 2. From the command line

`scripts/review-pr.ts` runs the same pipeline without an editor:

```bash
# Uncommitted (staged + unstaged) changes vs HEAD
node --import tsx scripts/review-pr.ts --working-tree

# Current branch vs its base, i.e. what a PR would show
node --import tsx scripts/review-pr.ts --base origin/main --dry-run
```

Each violation is printed as JSON (`ruleName`, `ruleInstructions`,
`severity`, `path`, `line`). To check a *different* repository, point
`--cwd` at it; its own `jev/` directory is used:

```bash
node ../jevrealtimecodecheck/node_modules/tsx/dist/cli.mjs \
  ../jevrealtimecodecheck/scripts/review-pr.ts --cwd . --working-tree
```

| Flag | Default | Description |
|---|---|---|
| `--working-tree` | off | Check uncommitted changes vs `HEAD` and print findings (never posts). |
| `--base <ref>` | `origin/main` | Base ref for branch mode (`base...HEAD`). |
| `--dry-run` | off | In branch mode, print findings instead of posting PR comments. |
| `--fail-on-violation` | off | Exit with code 1 if any violation is found. |
| `--cwd <dir>` | current dir | Repository to check. |
| `--rules-dir <dir>` | `jev` | Rule directory, relative to `--cwd`. |

Untracked files are not part of `git diff`. Run `git add -N <file>` on new
files so they are checked.

### 3. In CI, on a pull request

`.github/workflows/jev-review.yml` runs the script against the PR's diff
(`base...HEAD`) and posts a review comment on each violation it can place
on a file/line. Re-runs don't repost a comment that is already there.
Requires the `TYPESAFE_API_KEY` repository secret. Fork PRs are skipped
(no `pull_request_target`, to avoid running PR code with base-repo
secrets).

### 4. From a coding agent, via AGENTS.md

Agents (Claude Code, Codex, Cursor, etc.) read `AGENTS.md` (or
`CLAUDE.md`) for project instructions. Add a section telling the agent to
run the check on its own changes before it reports a task as done:

~~~md
## Rule check (Jev)

Before reporting a coding task as done, check your changes against the
project rules in `jev/`:

1. Run `git add -N <file>` for any new file you created, so it is part of
   the diff.
2. Run, from the repository root:
   ```bash
   node ../jevrealtimecodecheck/node_modules/tsx/dist/cli.mjs \
     ../jevrealtimecodecheck/scripts/review-pr.ts \
     --cwd . --working-tree --fail-on-violation
   ```
3. If it exits non-zero, each violation is printed as JSON with
   `ruleName`, `ruleInstructions`, `severity`, `path`, and `line`. Fix the
   code and run it again. If you believe a finding is wrong, say so in your
   reply instead of changing the code to satisfy it.
4. Never edit files in `jev/` to make the check pass.
5. If `../jevrealtimecodecheck` is missing, set it up as described in
   https://github.com/MrDesjardins/jevrealtimecodecheck#setup
   (clone next to this repository, `npm ci`). If it still cannot run (no
   API key, permission refused), report the check as not run, never as
   passing.
~~~

One-time setup: see [Setup](#setup). The agent needs nothing else.

## Rules are data

Rules are just Markdown you write and version-control like any other
project file — no plugin code, no schema beyond a heading and an optional
frontmatter line:

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

No frontmatter means the file applies to every changed file.

This repo ships **584 example rules across 13 file types** as a starting
point. Each has a Good/Bad example. They lean toward good practices and
language-specific "gotchas" (real semantic footguns: `.forEach` not
awaiting async, YAML's `NO` parsing as `false`, Go's pre-1.22 loop-variable
capture, Rust's silent `as` truncation, C++ iterator invalidation), plus
security, performance, and UI/accessibility practices. Delete what you
don't need, edit anything, or write your own.

| File | Applies to | Rules |
|---|---|---|
| `jev/typescript.md` | `**/*.ts` | 139 |
| `jev/python.md` | `**/*.py` | 56 |
| `jev/cpp.md` | `**/*.cpp`, `**/*.cc`, `**/*.cxx`, `**/*.h`, `**/*.hpp`, `**/*.hh`, `**/*.hxx` | 53 |
| `jev/rust.md` | `**/*.rs` | 52 |
| `jev/css.md` | `**/*.css` | 47 |
| `jev/go.md` | `**/*.go` | 42 |
| `jev/html.md` | `**/*.html` | 35 |
| `jev/react.md` | `**/*.tsx` | 33 |
| `jev/shell.md` | `**/*.sh` | 29 |
| `jev/markdown.md` | `**/*.md` | 29 |
| `jev/scss.md` | `**/*.scss` | 28 |
| `jev/yaml.md` | `**/*.yml`, `**/*.yaml` | 21 |
| `jev/json.md` | `**/*.json` | 20 |

## Editor configuration

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
src/                  Analysis engine + editor extension (TypeScript)
scripts/review-pr.ts  Command-line / CI / agent entry point
test/                 Unit tests (node:test)
jev/                  Example rule files (also used on this repo's own code)
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
