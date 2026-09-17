import * as vscode from "vscode";
import { AnalysisStatus } from "./analysisController";
import { RuleAssessment } from "./types";

function outcomeLabel(outcome: RuleAssessment["outcome"]): string {
  switch (outcome) {
    case "compliant":
      return "Compliant";
    case "violation":
      return "Violation";
    case "not_applicable":
      return "Not applicable";
    case "insufficient_context":
      return "Insufficient context";
    case "error":
      return "Error";
  }
}

function outcomeIcon(outcome: RuleAssessment["outcome"]): vscode.ThemeIcon {
  switch (outcome) {
    case "compliant":
      return new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("testing.iconPassed"));
    case "violation":
      return new vscode.ThemeIcon("error", new vscode.ThemeColor("testing.iconFailed"));
    case "not_applicable":
      return new vscode.ThemeIcon("circle-slash", new vscode.ThemeColor("disabledForeground"));
    case "insufficient_context":
      return new vscode.ThemeIcon("question", new vscode.ThemeColor("testing.iconQueued"));
    case "error":
      return new vscode.ThemeIcon("warning", new vscode.ThemeColor("problemsWarningIcon.foreground"));
  }
}

function severityIcon(level: string): vscode.ThemeIcon {
  switch (level) {
    case "Blocking":
      return new vscode.ThemeIcon("flame", new vscode.ThemeColor("testing.iconFailed"));
    case "Major":
      return new vscode.ThemeIcon("error", new vscode.ThemeColor("testing.iconFailed"));
    case "Moderate":
      return new vscode.ThemeIcon("warning", new vscode.ThemeColor("problemsWarningIcon.foreground"));
    default:
      return new vscode.ThemeIcon("info");
  }
}

class RuleTreeItem extends vscode.TreeItem {
  constructor(assessment: RuleAssessment) {
    super(assessment.ruleName, vscode.TreeItemCollapsibleState.None);
    const confidencePct =
      typeof assessment.confidence === "number"
        ? `${Math.round(assessment.confidence * 100)}% confidence`
        : "confidence unknown";

    const descParts = [outcomeLabel(assessment.outcome)];
    if (assessment.severity) {
      descParts.push(assessment.severity.level);
    }
    descParts.push(confidencePct);
    if (assessment.locatedFile) {
      descParts.push(assessment.locatedFile);
    } else if (assessment.outcome === "violation") {
      descParts.push("location unclear");
    }
    this.description = descParts.join(" · ");
    this.iconPath = assessment.severity ? severityIcon(assessment.severity.level) : outcomeIcon(assessment.outcome);

    const tooltipLines = [
      `Rule: ${assessment.ruleName}`,
      `Assessment: ${outcomeLabel(assessment.outcome)}`,
      `Confidence: ${confidencePct} (confidence reflects model certainty, not correctness)`,
    ];
    if (assessment.severity) {
      const sevConfidence =
        typeof assessment.severity.confidence === "number"
          ? `${Math.round(assessment.severity.confidence * 100)}%`
          : "unknown";
      tooltipLines.push(`Severity: ${assessment.severity.level} (confidence ${sevConfidence})`);
    }
    if (assessment.locatedFile) {
      tooltipLines.push(`Likely file: ${assessment.locatedFile}${assessment.locatedLine ? `:${assessment.locatedLine}` : ""}`);
    } else if (assessment.outcome === "violation") {
      tooltipLines.push("Location: could not be pinned to a single file/block (not clickable).");
    }
    if (assessment.probabilities) {
      tooltipLines.push("Probabilities:");
      for (const [k, v] of Object.entries(assessment.probabilities)) {
        tooltipLines.push(`  ${k}: ${(v * 100).toFixed(0)}%`);
      }
    }
    if (assessment.errorMessage) {
      tooltipLines.push(`Note: ${assessment.errorMessage}`);
    }
    this.tooltip = tooltipLines.join("\n");

    if (assessment.locatedFile) {
      this.command = {
        command: "jevCodeCheck.openLocation",
        title: "Open location",
        arguments: [assessment.locatedFile, assessment.locatedLine ?? null],
      };
    }
  }
}

class InfoTreeItem extends vscode.TreeItem {
  constructor(label: string, icon: string, tooltip?: string, command?: vscode.Command) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(icon);
    if (tooltip) {
      this.tooltip = tooltip;
    }
    if (command) {
      this.command = command;
    }
  }
}

const CREATE_EXAMPLE_RULE_COMMAND: vscode.Command = {
  command: "jevCodeCheck.createExampleRule",
  title: "Create an example rule",
};

// Groups are ordered most-actionable first (violations/errors) so they land
// at the top of the panel; compliant/not-applicable start collapsed since
// with dozens of rules they're the bulk of the noise, not the signal.
const GROUP_ORDER: {
  outcome: RuleAssessment["outcome"];
  label: string;
  initialState: vscode.TreeItemCollapsibleState;
}[] = [
  { outcome: "violation", label: "Violations", initialState: vscode.TreeItemCollapsibleState.Expanded },
  { outcome: "error", label: "Errors", initialState: vscode.TreeItemCollapsibleState.Expanded },
  {
    outcome: "insufficient_context",
    label: "Insufficient context",
    initialState: vscode.TreeItemCollapsibleState.Expanded,
  },
  { outcome: "not_applicable", label: "Not applicable", initialState: vscode.TreeItemCollapsibleState.Collapsed },
  { outcome: "compliant", label: "Compliant", initialState: vscode.TreeItemCollapsibleState.Collapsed },
];

class GroupTreeItem extends vscode.TreeItem {
  constructor(
    public readonly outcome: RuleAssessment["outcome"],
    label: string,
    public readonly assessments: RuleAssessment[],
    initialState: vscode.TreeItemCollapsibleState
  ) {
    super(`${label} (${assessments.length})`, initialState);
    this.iconPath = outcomeIcon(outcome);
    this.contextValue = "jevRuleGroup";
  }
}

export class RulesTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  private status: AnalysisStatus = { kind: "idle" };
  public treeView: vscode.TreeView<vscode.TreeItem> | undefined;

  setStatus(status: AnalysisStatus): void {
    this.status = status;
    this.emitter.fire();
    this.updateViewMessage();
  }

  private updateViewMessage(): void {
    if (!this.treeView) return;
    if (this.status.kind === "result") {
      const r = this.status.result;
      const when = new Date(r.timestamp).toLocaleTimeString();
      const sourceLabel = r.source === "mock" ? "OFFLINE MOCK" : "live Jev";
      let msg = `Last analysis: ${when} · ${r.durationMs}ms · source: ${sourceLabel}`;
      if (r.contextNote) {
        msg += `\n${r.contextNote}`;
      }
      this.treeView.message = msg;
    } else if (this.status.kind === "running") {
      this.treeView.message = "Analyzing...";
    } else {
      this.treeView.message = undefined;
    }
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (element instanceof GroupTreeItem) {
      return element.assessments.map((a) => new RuleTreeItem(a));
    }

    switch (this.status.kind) {
      case "idle":
        return [new InfoTreeItem("Run \"Jev: Analyze changes\" to get started", "info")];
      case "running":
        return [new InfoTreeItem("Analyzing changes...", "loading~spin")];
      case "no_rules":
        return [
          new InfoTreeItem(
            this.status.message,
            "warning",
            "Click to create a starter example.md with one rule and an applies_to glob you can edit.",
            CREATE_EXAMPLE_RULE_COMMAND
          ),
        ];
      case "unsupported":
        return [new InfoTreeItem(this.status.reason, "warning")];
      case "empty":
        return [new InfoTreeItem("No changes relative to HEAD", "check")];
      case "error":
        return [new InfoTreeItem(`Error: ${this.status.message}`, "error")];
      case "result": {
        const assessments = this.status.result.assessments;
        if (assessments.length === 0) {
          return [new InfoTreeItem("No rule assessments returned", "warning")];
        }
        return GROUP_ORDER.filter((g) => assessments.some((a) => a.outcome === g.outcome)).map((g) => {
          const members = assessments.filter((a) => a.outcome === g.outcome);
          if (g.outcome === "violation") {
            // Most severe first — this is the actual triage order.
            members.sort((a, b) => (b.severity?.score ?? -1) - (a.severity?.score ?? -1));
          }
          return new GroupTreeItem(g.outcome, g.label, members, g.initialState);
        });
      }
    }
  }
}
