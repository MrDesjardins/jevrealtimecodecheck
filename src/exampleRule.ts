export const EXAMPLE_RULE_FILE_NAME = "example.md";

// Deliberately generic (applies_to: **/* and no language-specific syntax) so
// it works as a first try regardless of what the installing project is
// written in — the point is to show the file format, not to be a real rule.
export const EXAMPLE_RULE_CONTENT = `---
applies_to: **/*
---

# No TODO comments without a tracking reference
A \`TODO\` or \`FIXME\` comment must reference a ticket or issue (e.g.
\`TODO(PROJ-123): ...\`). A bare \`TODO\` with no reference is a violation.

Good:
\`\`\`
// TODO(PROJ-42): handle the empty-input case once auth lands.
\`\`\`

Bad:
\`\`\`
// TODO: handle this later
\`\`\`
`;
