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
