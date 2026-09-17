#!/usr/bin/env bash
# Builds, packages, and installs this extension into whichever of
# Cursor / VS Code is available, in one command.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run package

VSIX=$(ls -t jev-code-check-*.vsix | head -n1)

if command -v cursor >/dev/null 2>&1; then
  cursor --install-extension "$VSIX"
elif command -v code >/dev/null 2>&1; then
  code --install-extension "$VSIX"
else
  echo "Built $VSIX, but no 'cursor' or 'code' CLI was found on PATH."
  echo "Install it manually: Extensions view -> ... -> Install from VSIX... -> $VSIX"
  exit 1
fi

echo "Installed. Reload the window, then run \"Jev: Analyze changes\" (Command Palette)."
