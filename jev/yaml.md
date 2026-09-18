---
applies_to: **/*.yml, **/*.yaml
---

# Use consistent 2-space indentation
YAML files should use 2-space indentation consistently throughout the document.

Good:
```yaml
server:
  port: 8080
  host: localhost
```

Bad:
```yaml
server:
    port: 8080
  host: localhost
```

# Avoid tabs for indentation
YAML indentation must use spaces; tab characters are invalid or error-prone in most parsers.

Good:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```

Bad:
```yaml
jobs:
	build:
		runs-on: ubuntu-latest
```

# Quote ambiguous scalar values explicitly
Values that could be misinterpreted as booleans or numbers (e.g. `yes`, `no`, `on`, `1.0` meant as a string) should be quoted.

Good:
```yaml
enabled: "yes"
```

Bad:
```yaml
enabled: yes
```

# Use anchors and aliases to avoid duplicated blocks
A configuration block repeated verbatim in multiple places should use a YAML anchor/alias instead of copy-pasting.

Good:
```yaml
defaults: &defaults
  timeout: 30
prod:
  <<: *defaults
```

Bad:
```yaml
defaults:
  timeout: 30
prod:
  timeout: 30
```

# Avoid deeply nested mappings
Mappings nested more than about 5 levels deep are hard to read; consider flattening the structure.

Good:
```yaml
app:
  db:
    host: localhost
```

Bad:
```yaml
app:
  services:
    db:
      connection:
        primary:
          host: localhost
```

# Do not hardcode secrets in committed YAML
CI configs and manifests must not contain literal API keys, tokens, or passwords; use secret references instead.

Good:
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

Bad:
```yaml
env:
  API_KEY: sk_live_51Hxyz...
```

# Use consistent list-item indentation style
List items (`- item`) should be indented consistently relative to their parent key throughout the file.

Good:
```yaml
items:
  - a
  - b
```

Bad:
```yaml
items:
- a
  - b
```

# Avoid trailing whitespace
Lines must not have trailing spaces; some YAML tooling flags this and it complicates diffs.

Good:
```yaml
name: build
```

Bad:
```yaml
name: build   
```

# Separate multi-document files with a document marker
A YAML file containing multiple documents must separate them with `---`.

Good:
```yaml
---
name: doc1
---
name: doc2
```

Bad:
```yaml
name: doc1
name: doc2
```

# Use variable substitution for environment-specific values
Environment-specific values (hostnames, ports) should be templated/substituted, not hardcoded per environment file.

Good:
```yaml
host: ${DB_HOST}
```

Bad:
```yaml
host: prod-db.internal
```

# Do not duplicate keys within the same mapping
The same key must not appear twice in one mapping; the later value silently wins and the duplication is usually a mistake.

Good:
```yaml
timeout: 1000
```

Bad:
```yaml
timeout: 500
timeout: 1000
```

# Comment non-obvious configuration choices
A configuration value that isn't self-explanatory (a magic timeout, a specific flag) should have a brief comment explaining why.

Good:
```yaml
# 30s: matches the upstream gateway's timeout
timeout: 30
```

Bad:
```yaml
timeout: 30
```

# Avoid excessively long single lines
Long values (URLs, multi-part strings) should use YAML's block scalar syntax rather than one very long line.

Good:
```yaml
description: >
  A long description
  that wraps across lines.
```

Bad:
```yaml
description: A long description that goes on and on across one very long single line in the file.
```

# Pin versions explicitly
Version fields (image tags, action versions) should be pinned explicitly, not left to float on `latest`.

Good:
```yaml
image: node:20.11.0
```

Bad:
```yaml
image: node:latest
```

# Do not leave large commented-out configuration blocks
Stale, commented-out configuration should be deleted, not left as dead weight in the file.

Good:
```yaml
steps:
  - run: npm test
```

Bad:
```yaml
steps:
  - run: npm test
  # - run: npm run old-step
  # - run: npm run another-old-step
```

# Unquoted yes/no/on/off/null parse as their special types
YAML 1.1 treats unquoted `yes`, `no`, `on`, `off`, `null`, and similar words as booleans or null, not strings — known as the "Norway problem" (`NO` the country code becomes `false`).

Good:
```yaml
country_code: "NO"
```

Bad:
```yaml
country_code: NO # parses as boolean false, not the string "NO"
```

# A leading zero on an unquoted number can be parsed as octal
Some YAML parsers interpret an unquoted number with a leading zero (e.g. `0755`) as octal, silently producing a different decimal value than expected.

Good:
```yaml
file_mode: "0755"
```

Bad:
```yaml
file_mode: 0755 # some parsers read this as octal 493, not the string "0755"
```

# Merge key (<<:) resolution varies by parser
The `<<:` merge key for combining mappings is a YAML 1.1 convention, not part of the core spec; its exact override/precedence behavior can differ between parser implementations and versions.

Good:
```yaml
# Prefer explicit duplication or a templating step over relying on <<: semantics
prod:
  timeout: 30
  retries: 3
```

Bad:
```yaml
defaults: &defaults
  timeout: 30
prod:
  <<: *defaults
  timeout: 60 # override order isn't guaranteed identical across all parsers
```

# A duplicate anchor name silently overwrites the earlier one
Defining the same anchor name (`&name`) twice in one document is not an error in most parsers; the later definition silently wins, and any alias resolves to the last one only.

Good:
```yaml
base: &base_config
  timeout: 30
other: &other_config
  retries: 3
```

Bad:
```yaml
base: &config
  timeout: 30
other: &config # same anchor name reused, first definition is lost
  retries: 3
```

# Flow-style collections need different quoting/comma rules than block style
Inline (flow) style `{a: 1, b: 2}` / `[1, 2, 3]` requires commas and different escaping than block style; copying a value between the two styles without adjusting syntax is a common source of parse errors.

Good:
```yaml
ports: [80, 443, 8080]
```

Bad:
```yaml
ports:
  80
  443 # missing the block-style "- " list markers, invalid YAML
```

# Avoid deeply nested anchor/alias expansion (a YAML bomb)
A small number of anchors that reference each other in a nested chain can expand exponentially when parsed (the "billion laughs" pattern), causing excessive memory/CPU use — a real denial-of-service vector for YAML accepted from untrusted sources.

Good:
```yaml
# Keep anchor chains shallow, and never parse untrusted YAML without a parser-level expansion limit.
item: &item
  value: 1
```

Bad:
```yaml
a: &a [1,1,1,1,1,1,1,1,1]
b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]
c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b] # each level multiplies the expanded size by ~9x
```
