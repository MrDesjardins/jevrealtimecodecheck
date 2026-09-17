# Jev Realtime Code Check — install & demo (tonight)

## 1. Install the extension in Cursor

Package: `jev-code-check-0.1.0.vsix` (in this folder).

```bash
cursor --install-extension /home/miste/code/jevrealtimecodecheck/jev-code-check-0.1.0.vsix
```

Or in Cursor's UI: Extensions view → `...` menu → **Install from VSIX...** → pick the file.

Reload the window if prompted. A new **Jev Code Check** icon appears in the
Activity Bar with a "Rule Assessments" panel.

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

## 4. Run the demo

```bash
cursor /home/miste/code/jevrealtimecodecheck/demo-fixture
```

Open **that folder** as the workspace root (it's its own small Git repo with
one clean baseline commit and `jev-rules.md` with 3 example rules). Then
follow `demo-fixture/BEFORE_AFTER.md`:

1. Edit `src/api.ts` to return `null` instead of the result type → save →
   sidebar shows **Violation** for "Functions must not return null".
2. Revert → save → back to **Compliant**.
3. Same flow for `src/UserProfile.tsx` (remove the effect cleanup) and
   `src/errors.ts` (strip the recovery sentence from the error message).

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
