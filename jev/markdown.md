---
applies_to: **/*.md
---

# Fenced code blocks must specify a language

A fenced code block (three backticks) must declare a language (e.g. `ts`,
`json`, `bash`) so it renders with syntax highlighting, unless it is
intentionally plain output/text.

Good:
~~~md
```ts
const total = computeTotal(items);
```
~~~

Bad:
~~~md
```
const total = computeTotal(items);
```
~~~

# Headings must not skip levels

Heading levels should increase by one at a time (`#` then `##` then `###`);
do not jump from `#` straight to `###`.

Good:
```md
# Title

## Section

### Subsection
```

Bad:
```md
# Title

### Subsection
```

# Links must not be bare URLs

A link should use descriptive Markdown link syntax rather than a bare URL
pasted into the text, so the rendered text is readable.

Good:
```md
See the [API reference](https://docs.typesafe.ai/api) for details.
```

Bad:
```md
See https://docs.typesafe.ai/api for details.
```

# No trailing whitespace at end of line

Lines must not end with trailing spaces or tabs; in Markdown, trailing
whitespace can silently change rendering (e.g. two trailing spaces force a
line break) and is easy to introduce by accident.

Good:
```md
This is a normal line.
This is the next line.
```

Bad:
```md
This is a normal line.··
This is the next line.
```

# Internal document links must point to an existing heading

A relative link to another section (e.g. `[see below](#installation)`) must
match an actual heading's generated anchor in the same document; a stale
anchor left over from a renamed section is a violation.

Good:
```md
## Installation

See the [installation steps](#installation) above.
```

Bad:
```md
## Setup

See the [installation steps](#installation) above.
```
