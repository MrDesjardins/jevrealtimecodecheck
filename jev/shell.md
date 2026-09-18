---
applies_to: **/*.sh
---

# Scripts must start with a shebang line
Every executable shell script must begin with a `#!/usr/bin/env bash` (or equivalent) shebang line.

Good:
```bash
#!/usr/bin/env bash
set -euo pipefail
```

Bad:
```bash
echo "starting deploy"
```

# Use set -euo pipefail for safer execution
Bash scripts should enable `set -euo pipefail` near the top so errors, unset variables, and pipe failures aren't silently ignored.

Good:
```bash
#!/usr/bin/env bash
set -euo pipefail
```

Bad:
```bash
#!/usr/bin/env bash
```

# Always quote variable expansions
Use `"$var"` rather than bare `$var` unless word-splitting/globbing is specifically intended.

Good:
```bash
rm -rf "$target_dir"
```

Bad:
```bash
rm -rf $target_dir
```

# Avoid parsing ls output
Do not parse the output of `ls` to get filenames; use globs or `find` instead, which handle special characters correctly.

Good:
```bash
for f in *.log; do echo "$f"; done
```

Bad:
```bash
for f in $(ls *.log); do echo "$f"; done
```

# Use $(...) instead of backticks for command substitution
Prefer `$(command)` over legacy backtick syntax; it nests more clearly and is easier to read.

Good:
```bash
branch=$(git rev-parse --abbrev-ref HEAD)
```

Bad:
```bash
branch=`git rev-parse --abbrev-ref HEAD`
```

# Check command exit codes
A command whose failure matters must have its exit status checked (via `set -e`, `if`, or `||`), not ignored.

Good:
```bash
if ! deploy.sh; then
  echo "deploy failed" >&2
  exit 1
fi
```

Bad:
```bash
deploy.sh
echo "done"
```

# Avoid hardcoded absolute paths
Scripts should use relative paths or configurable variables instead of machine-specific absolute paths.

Good:
```bash
cd "$(dirname "$0")"
```

Bad:
```bash
cd /Users/ada/project
```

# Use [[ ]] instead of [ ] for bash conditionals
Prefer bash's `[[ ]]` test construct over the POSIX `[ ]` for safer string/pattern comparisons.

Good:
```bash
[[ -n "$name" && "$name" == prod-* ]]
```

Bad:
```bash
[ -n "$name" -a "$name" == prod-* ]
```

# Do not use eval on untrusted input
`eval` must never be applied to data derived from user input or external sources.

Good:
```bash
case "$cmd" in
  start) start_service ;;
esac
```

Bad:
```bash
eval "$user_supplied_cmd"
```

# Define functions before they are used
A shell function must be defined earlier in the file than its first call site.

Good:
```bash
deploy() { ... }
deploy
```

Bad:
```bash
deploy
deploy() { ... }
```

# Avoid global mutable state across sourced scripts
Scripts meant to be sourced should avoid setting shared mutable variables that other sourced scripts depend on implicitly.

Good:
```bash
# lib.sh
get_config() { echo "$1"; }
```

Bad:
```bash
# lib.sh
CONFIG_VALUE=""
load_config() { CONFIG_VALUE=$1; }
```

# Use readonly for constants
A variable meant to be a constant should be declared with `readonly` so accidental reassignment fails loudly.

Good:
```bash
readonly MAX_RETRIES=3
```

Bad:
```bash
MAX_RETRIES=3
```

# Do not leave debug echo statements
Temporary `echo`/`set -x` debug output must be removed before committing.

Good:
```bash
deploy_service
```

Bad:
```bash
echo "DEBUG: about to deploy"
deploy_service
```

# Prefer local variables inside functions
Variables used only within a function should be declared `local` to avoid leaking into the global shell scope.

Good:
```bash
greet() {
  local name=$1
  echo "Hello, $name"
}
```

Bad:
```bash
greet() {
  name=$1
  echo "Hello, $name"
}
```

# Check cd's return value
A `cd` into a directory that might not exist should be checked (`cd dir || exit 1`), not assumed to succeed.

Good:
```bash
cd "$target" || exit 1
```

Bad:
```bash
cd "$target"
```

# Clean up temp files on exit
Scripts creating temporary files should register a `trap` to clean them up on exit, including on error.

Good:
```bash
tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT
```

Bad:
```bash
tmpfile=$(mktemp)
# never removed
```

# Explain suppressed errors
A `command || true` that intentionally ignores failure must have a comment explaining why the failure is safe to ignore.

Good:
```bash
# Cleanup may fail if the dir was already removed; that's fine.
rm -rf ./tmp || true
```

Bad:
```bash
rm -rf ./tmp || true
```

# Use consistent indentation
Shell scripts should use a consistent indentation width (2 or 4 spaces) throughout.

Good:
```bash
if [[ -f "$file" ]]; then
  echo "found"
fi
```

Bad:
```bash
if [[ -f "$file" ]]; then
    echo "found"
  fi
```

# Avoid deeply nested if/else chains
Prefer early `return`/`exit` guard clauses over deeply nested `if`/`else` chains in shell functions.

Good:
```bash
if [[ ! -f "$file" ]]; then
  echo "missing" >&2
  exit 1
fi
process "$file"
```

Bad:
```bash
if [[ -f "$file" ]]; then
  if [[ -r "$file" ]]; then
    process "$file"
  else
    echo "unreadable"
  fi
else
  echo "missing"
fi
```

# Validate required arguments before use
A script expecting positional arguments must check they were provided before using them, rather than failing with an unclear error later.

Good:
```bash
if [[ $# -lt 1 ]]; then
  echo "usage: $0 <env>" >&2
  exit 1
fi
```

Bad:
```bash
env=$1
deploy "$env"
```

# Unquoted variables with spaces are word-split
An unquoted variable expansion is subject to word splitting and globbing — a value containing spaces becomes multiple separate arguments instead of one.

Good:
```bash
cp "$source_file" "$dest_dir"
```

Bad:
```bash
cp $source_file $dest_dir # a space in either path splits it into extra arguments
```

# $? only reflects the immediately preceding command
`$?` holds the exit status of the last command run — any command in between, including something like `echo`, overwrites it before you get a chance to check the one you actually cared about.

Good:
```bash
run_migration
status=$?
if [[ $status -ne 0 ]]; then exit 1; fi
```

Bad:
```bash
run_migration
echo "migration attempted"
if [[ $? -ne 0 ]]; then exit 1; fi # $? now reflects echo, not run_migration
```

# A command in a pipeline runs in a subshell
Each stage of a pipeline runs in its own subshell; variable assignments made inside a piped command do not persist in the parent shell after the pipeline finishes.

Good:
```bash
count=$(grep -c pattern file.txt)
```

Bad:
```bash
grep pattern file.txt | while read -r line; do count=$((count+1)); done
echo "$count" # always empty/0: the while loop ran in a subshell
```

# An empty or unset variable in a bare [ ] test causes a syntax error
`[ $var = x ]` with an unquoted, empty/unset `$var` expands to `[ = x ]`, which is a syntax error rather than a false comparison.

Good:
```bash
if [[ "$var" = "x" ]]; then ...; fi
```

Bad:
```bash
if [ $var = x ]; then ...; fi # errors out if $var is unset or empty
```

# set -e does not abort inside an if/while condition or a non-last pipeline stage
`set -e` does not stop the script when a failing command is used as part of an `if`/`while` condition, or when it's anything but the last command in a pipeline — those failures are expected to be checked, not fatal.

Good:
```bash
if ! run_step; then
  echo "step failed" >&2
  exit 1
fi
```

Bad:
```bash
set -e
if run_step; then
  echo "ok"
fi # run_step failing here does NOT trigger set -e, by design — but easy to forget
```

# Avoid constructing commands from unsanitized user input
Interpolating user-controlled input directly into a command string (even without `eval`) can allow argument or command injection if the input contains shell metacharacters and is not properly quoted/validated.

Good:
```bash
read -r branch
if [[ "$branch" =~ ^[a-zA-Z0-9._/-]+$ ]]; then
  git checkout "$branch"
fi
```

Bad:
```bash
read -r branch
git checkout $branch # unquoted and unvalidated: "; rm -rf ." is a valid "branch"
```

# Do not run scripts as root without necessity
A script should not require or assume root privileges unless the specific operations genuinely need them; running everything as root turns any bug or injected command into a full-system compromise.

Good:
```bash
sudo install -m 755 binary /usr/local/bin/  # only the one privileged step uses sudo
```

Bad:
```bash
# entire script run via: sudo ./script.sh
```

# Verify checksums before executing downloaded scripts
Piping a downloaded script directly into a shell (`curl ... | bash`) executes it without any verification; download it first, check its checksum/signature, then run it.

Good:
```bash
curl -fsSL -o install.sh https://example.com/install.sh
echo "expectedsha256  install.sh" | sha256sum -c -
bash install.sh
```

Bad:
```bash
curl -fsSL https://example.com/install.sh | bash # executes whatever the server returns, unverified
```

# Avoid spawning a subprocess per loop iteration when one batched call suffices
Invoking an external command inside a loop pays process-startup overhead every iteration; many tools accept a batch of arguments/files in one invocation instead.

Good:
```bash
grep -l pattern -- "${files[@]}"
```

Bad:
```bash
for f in "${files[@]}"; do
  grep -l pattern "$f" # spawns a new grep process per file
done
```
