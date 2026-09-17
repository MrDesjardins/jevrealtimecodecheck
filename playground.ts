import * as vscode from "vscode";
import { AnalysisController, AnalysisStatus } from "./analysisController";
import { RulesTreeProvider } from "./sidebarProvider";
import { setApiKey, clearApiKey } from "./credentials";


function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function getRulesFileAbsPath(root: string): string {
  const cfg = vscode.workspace.getConfiguration("jevCodeCheck");
  const rel = cfg.get<string>("rulesFile", "jev-rules.md");
  return vscode.Uri.joinPath(vscode.Uri.file(root), rel).fsPath;
}

export function activate(context: vscode.ExtensionContext): void {
  console.log("Activating Jev Code Check");
  const provider = new RulesTreeProvider();
  const treeView = vscode.window.createTreeView("jevCodeCheck.rulesView", {
    treeDataProvider: provider,
  });
  provider.treeView = treeView;
  context.subscriptions.push(treeView);

  const diagnostics = vscode.languages.createDiagnosticCollection("jevCodeCheck");
  context.subscriptions.push(diagnostics);

  // Diagnostics use locatedLine, which comes straight from the diff's own
  // hunk headers (see diffLocations.ts) — never a line number invented by
  // the model — so a squiggle always points at a real changed line.
  function updateDiagnostics(status: AnalysisStatus): void {
    diagnostics.clear();
    if (status.kind !== "result") return;
    const root = getWorkspaceRoot();
    if (!root) return;

    const byFile = new Map<string, vscode.Diagnostic[]>();
    for (const a of status.result.assessments) {
      if (a.outcome !== "violation" || !a.locatedFile || !a.locatedLine) continue;
      const line = Math.max(0, a.locatedLine - 1);
      const range = new vscode.Range(line, 0, line, 1000);
      const sevLabel = a.severity ? ` [${a.severity.level}]` : "";
      const diag = new vscode.Diagnostic(
        range,
        `Jev: possible violation of "${a.ruleName}"${sevLabel}`,
        a.severity?.level === "Blocking" || a.severity?.level === "Major"
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information
      );
      diag.source = "Jev Code Check";
      const list = byFile.get(a.locatedFile) ?? [];
      list.push(diag);
      byFile.set(a.locatedFile, list);
    }
    for (const [relPath, diags] of byFile) {
      diagnostics.set(vscode.Uri.file(vscode.Uri.joinPath(vscode.Uri.file(root), relPath).fsPath), diags);
    }
  }

  const controller = new AnalysisController(context.secrets, (status) => {
    provider.setStatus(status);
    updateDiagnostics(status);
  });

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function analyzeNow(): void {
    const root = getWorkspaceRoot();
    if (!root) {
      vscode.window.showWarningMessage("Jev Code Check: open a folder/workspace to analyze changes.");
      return;
    }
    void controller.run(root);
  }

  function scheduleDebouncedAnalyze(): void {
    const cfg = vscode.workspace.getConfiguration("jevCodeCheck");
    // Floored at 1s regardless of configuration, so rapid typing/paste/LLM
    // edits can never trigger more than one analysis per second.
    const delay = Math.max(1000, cfg.get<number>("debounceMs", 1200));
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      analyzeNow();
    }, delay);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("jevCodeCheck.analyze", analyzeNow),

    vscode.commands.registerCommand("jevCodeCheck.setApiKey", async () => {
      const value = await vscode.window.showInputBox({
        prompt: "Enter your TypeSafe Jev API key",
        password: true,
        ignoreFocusOut: true,
      });
      if (value) {
        await setApiKey(context.secrets, value.trim());
        vscode.window.showInformationMessage("Jev API key saved in SecretStorage.");
      }
    }),

    vscode.commands.registerCommand("jevCodeCheck.clearApiKey", async () => {
      await clearApiKey(context.secrets);
      vscode.window.showInformationMessage("Jev API key cleared.");
    }),

    vscode.commands.registerCommand(
      "jevCodeCheck.openLocation",
      async (relPath: string, line: number | null) => {
        const root = getWorkspaceRoot();
        if (!root) return;
        const uri = vscode.Uri.file(vscode.Uri.joinPath(vscode.Uri.file(root), relPath).fsPath);
        try {
          const doc = await vscode.workspace.openTextDocument(uri);
          const editor = await vscode.window.showTextDocument(doc, { preview: true });
          const pos = new vscode.Position(Math.max(0, (line ?? 1) - 1), 0);
          editor.selection = new vscode.Selection(pos, pos);
          editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
        } catch {
          vscode.window.showWarningMessage(`Jev Code Check: could not open "${relPath}".`);
        }
      }
    ),

    vscode.commands.registerCommand("jevCodeCheck.toggleAutoAnalyze", async () => {
      const cfg = vscode.workspace.getConfiguration("jevCodeCheck");
      const current = cfg.get<boolean>("autoAnalyzeOnSave", false);
      if (!current) {
        const choice = await vscode.window.showInformationMessage(
          "Enabling automatic analysis will send your changed code (diff) and surrounding file context to TypeSafe's Jev API as you edit (typing, paste, or any other change) and on save, for this workspace. Requests are throttled to at most once per second. Enable?",
          { modal: true },
          "Enable"
        );
        if (choice !== "Enable") {
          return;
        }
      }
      await cfg.update(
        "autoAnalyzeOnSave",
        !current,
        vscode.ConfigurationTarget.Workspace
      );
      vscode.window.showInformationMessage(
        `Jev automatic analysis is now ${!current ? "ON" : "OFF"} for this workspace.`
      );
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const root = getWorkspaceRoot();
      if (!root) return;

      const savedPath = doc.uri.fsPath;
      const rulesPath = getRulesFileAbsPath(root);
      if (savedPath === rulesPath) {
        // Rules changed: always reanalyze, independent of the auto-analyze setting.
        scheduleDebouncedAnalyze();
        return;
      }

      const cfg = vscode.workspace.getConfiguration("jevCodeCheck", doc.uri);
      const autoEnabled = cfg.get<boolean>("autoAnalyzeOnSave", false);
      if (autoEnabled && savedPath.startsWith(root)) {
        scheduleDebouncedAnalyze();
      }
    }),

    // Covers typing, paste, and programmatic/LLM edits alike — VS Code
    // reports them all through the same change event. scheduleDebouncedAnalyze
    // shares one timer with the save handler above and is floored at 1s, so
    // this can't fire more than once per second regardless of edit source.
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length === 0 || e.document.uri.scheme !== "file") {
        return;
      }
      const root = getWorkspaceRoot();
      if (!root) return;

      const changedPath = e.document.uri.fsPath;
      const rulesPath = getRulesFileAbsPath(root);
      if (changedPath === rulesPath) {
        scheduleDebouncedAnalyze();
        return;
      }

      const cfg = vscode.workspace.getConfiguration("jevCodeCheck", e.document.uri);
      const autoEnabled = cfg.get<boolean>("autoAnalyzeOnSave", false);
      if (autoEnabled && changedPath.startsWith(root)) {
        scheduleDebouncedAnalyze();
      }
    })
  );
}

export function deactivate(): void {
  // No-op: no timers or connections need explicit teardown beyond
  // what context.subscriptions already disposes.
}
