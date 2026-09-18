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

# Tables must have a header separator row
A Markdown table must include the `---` header-separator row so it renders correctly.

Good:
```md
| Name | Value |
| --- | --- |
| a | 1 |
```

Bad:
```md
| Name | Value |
| a | 1 |
```

# Ordered lists should use consistent numbering
Use consistent numbering style in ordered lists (either all `1.` or sequential numbers), not a random mix.

Good:
```md
1. First
2. Second
3. Third
```

Bad:
```md
1. First
1. Second
3. Third
```

# Avoid raw HTML when a Markdown equivalent exists
Prefer Markdown syntax over raw HTML tags for things Markdown already supports (bold, links, lists).

Good:
```md
**Important**
```

Bad:
```md
<b>Important</b>
```

# TODO markers in docs need a tracking link
A `TODO` left in published documentation must link to a tracked issue, not be a bare note.

Good:
```md
<!-- TODO(JIRA-321): document the new auth flow -->
```

Bad:
```md
<!-- TODO: document this -->
```

# Images must have descriptive alt text
An image reference `![]()` must not have empty or filename-only alt text; describe what the image shows.

Good:
```md
![Architecture diagram showing the request flow](diagram.png)
```

Bad:
```md
![img](diagram.png)
```

# Avoid excessively long prose lines
Wrap long paragraphs at a reasonable width instead of single multi-hundred-character lines, for diff readability.

Good:
```md
This is a short paragraph that wraps
at a reasonable width for readability.
```

Bad:
```md
This is a paragraph that goes on for an extremely long single line without ever wrapping which makes diffs unreadable.
```

# Avoid bare 'click here' link text
Link text should describe the destination ("see the API reference"), not the generic "click here".

Good:
```md
See the [API reference](https://docs.example.com/api).
```

Bad:
```md
Click [here](https://docs.example.com/api) for the API reference.
```

# Code spans must not span multiple lines
Inline code spans (single backticks) must stay on one line; use a fenced code block for multi-line code.

Good:
```md
```
const x = 1;
const y = 2;
```
```

Bad:
```md
`const x = 1;
const y = 2;`
```

# Avoid duplicate top-level headings
A document should not repeat the same `#` heading text twice.

Good:
```md
# Installation

# Configuration
```

Bad:
```md
# Installation

# Installation
```

# Front matter must be complete when present
If a document has a frontmatter block, required fields (e.g. title) must not be left empty.

Good:
```md
---
title: Getting Started
---
```

Bad:
```md
---
title:
---
```

# Do not leave placeholder text in merged docs
Placeholder text like "TBD" or "Lorem ipsum" must not remain in a document once it is merged.

Good:
```md
This feature lets you configure retry limits.
```

Bad:
```md
TBD: describe this feature.
```

# Blockquotes should not be used for plain emphasis
Use bold/italic for emphasis; reserve blockquotes (`>`) for actual quoted material or callouts.

Good:
```md
**Note:** this only applies to production.
```

Bad:
```md
> This only applies to production.
```

# Avoid nested lists deeper than 3 levels
Deeply nested bullet lists are hard to read; restructure with headings or a table instead.

Good:
```md
- A
  - B
    - C
```

Bad:
```md
- A
  - B
    - C
      - D
        - E
```

# Do not reference nonexistent files or paths
A link or path mentioned in documentation must point to something that actually exists in the repository.

Good:
```md
See [src/extension.ts](../src/extension.ts).
```

Bad:
```md
See [src/missing.ts](../src/missing.ts).
```

# Section headings should use sentence case
Headings should read as sentence case ("Getting started"), not ALL CAPS or Title Case Everywhere.

Good:
```md
## Getting started
```

Bad:
```md
## GETTING STARTED
```

# Avoid excessive emoji in technical documentation
Technical docs should use emoji sparingly, if at all, so the content stays scannable and professional.

Good:
```md
## Installation
```

Bad:
```md
## 🚀🔥 Installation 🎉✨
```

# Do not leave merge conflict markers in committed docs
Markers like `<<<<<<<`, `=======`, `>>>>>>>` must never be present in a committed Markdown file.

Good:
```md
The API returns a JSON object.
```

Bad:
```md
<<<<<<< HEAD
The API returns JSON.
=======
The API returns a JSON object.
>>>>>>> main
```

# Table rows must have a consistent column count
Every row in a Markdown table must have the same number of `|`-separated columns as the header.

Good:
```md
| A | B |
| --- | --- |
| 1 | 2 |
```

Bad:
```md
| A | B |
| --- | --- |
| 1 | 2 | 3 |
```

# Avoid excessively long single documents
A document that grows very large should be split into multiple focused documents with cross-links.

Good:
```md
See [Installation](./install.md), [Configuration](./config.md).
```

Bad:
```md
# One 4000-line document covering install, config, API, and troubleshooting
```

# Use a consistent bullet marker within a list
Do not mix `-`, `*`, and `+` as bullet markers within the same list.

Good:
```md
- First
- Second
- Third
```

Bad:
```md
- First
* Second
+ Third
```

# Setext-style headings are easy to miss when scanning source
A line underlined with `===` or `---` is also a heading (level 1 or 2 respectively), not just `#`-prefixed lines — easy to overlook when searching a document for headings by eye or with a `^#` grep.

Good:
```md
# Title

Section
-------
```

Bad:
```md
Title
=====

Section
-------
```

# Four-space indentation is parsed as a code block, not a nested list
A line indented 4+ spaces starts an indented code block in standard Markdown; a list item meant to be nested under a bullet needs the right (often 2-space) indentation for that renderer, not a full tab-stop.

Good:
```md
- Item
  - Nested item (2-space indent)
```

Bad:
```md
- Item
    - Meant to be nested, but 4 spaces renders as a code block instead
```

# A reference-style link with no matching definition renders as plain text
`[text][ref]` requires a corresponding `[ref]: url` definition somewhere in the document; if the definition is missing or misspelled, most renderers silently show the literal bracket text instead of a link.

Good:
```md
See the [API reference][api-ref].

[api-ref]: https://docs.example.com/api
```

Bad:
```md
See the [API reference][api-ref].
<!-- no [api-ref]: ... definition anywhere in the document -->
```

# A list right after a paragraph with no blank line may not render as a list
Some Markdown renderers require a blank line between a paragraph and a following list for the list to be recognized as a list rather than continuing the paragraph's text.

Good:
```md
Steps to install:

- Step one
- Step two
```

Bad:
```md
Steps to install:
- Step one
- Step two
```
