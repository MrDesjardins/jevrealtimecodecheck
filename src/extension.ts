import * as vscode from "vscode";
import { AnalysisController } from "./analysisController";
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
  const provider = new RulesTreeProvider();
  const treeView = vscode.window.createTreeView("jevCodeCheck.rulesView", {
    treeDataProvider: provider,
  });
  provider.treeView = treeView;
  context.subscriptions.push(treeView);

  const controller = new AnalysisController(context.secrets, (status) => {
    provider.setStatus(status);
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
    const delay = cfg.get<number>("debounceMs", 1200);
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

    vscode.commands.registerCommand("jevCodeCheck.toggleAutoAnalyze", async () => {
      const cfg = vscode.workspace.getConfiguration("jevCodeCheck");
      const current = cfg.get<boolean>("autoAnalyzeOnSave", false);
      if (!current) {
        const choice = await vscode.window.showInformationMessage(
          "Enabling automatic analysis will send your changed code (diff) and surrounding file context to TypeSafe's Jev API every time you save, for this workspace. Enable?",
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
        `Jev automatic analysis on save is now ${!current ? "ON" : "OFF"} for this workspace.`
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
    })
  );

}

export function deactivate(): void {
  // No-op: no timers or connections need explicit teardown beyond
  // what context.subscriptions already disposes.
}
