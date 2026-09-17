---
applies_to: **/*.scss
---

# Avoid nesting selectors more than 3 levels
Deeply nested Sass selectors compile into fragile, over-specific CSS; keep nesting shallow.

Good:
```scss
.card__title { font-weight: 600; }
```

Bad:
```scss
.page .content .card .header .title { font-weight: 600; }
```

# Use variables for repeated values
A value repeated more than twice (colors, spacing, timings) should be a Sass variable, not a literal.

Good:
```scss
$spacing-md: 16px;
padding: $spacing-md;
```

Bad:
```scss
padding: 16px;
```

# Document !default overrides
A variable declared with `!default` intended to be overridden by consumers should have a comment explaining its purpose.

Good:
```scss
// Override in _theme.scss to customize the brand color.
$primary-color: blue !default;
```

Bad:
```scss
$primary-color: blue !default;
```

# Prefer @use/@forward over the legacy @import
Use Sass's module system (`@use`/`@forward`) instead of the deprecated `@import` rule.

Good:
```scss
@use "./buttons";
```

Bad:
```scss
@import "buttons";
```

# Avoid overly generic mixin names
Mixin names should describe their specific purpose, not generic names like `mixin1` or `helper`.

Good:
```scss
@mixin flex-center { display: flex; align-items: center; }
```

Bad:
```scss
@mixin mixin1 { display: flex; align-items: center; }
```

# Do not duplicate mixin logic across files
The same styling logic implemented as separate near-identical mixins in different files should be consolidated.

Good:
```scss
// shared/_mixins.scss
@mixin truncate { overflow: hidden; text-overflow: ellipsis; }
```

Bad:
```scss
// a.scss and b.scss both redefine an identical truncate mixin
```

# Use meaningful placeholder selector names
A `%placeholder` selector meant for `@extend` should have a descriptive name, not a single letter or abbreviation.

Good:
```scss
%button-reset { border: 0; background: none; }
```

Bad:
```scss
%p1 { border: 0; background: none; }
```

# Avoid excessive @extend across unrelated selectors
`@extend` should group genuinely related selectors; overuse across unrelated rules bloats the compiled output unpredictably.

Good:
```scss
.btn-primary, .btn-secondary { @extend %button-base; }
```

Bad:
```scss
.btn { @extend %base; }
.card { @extend %base; }
.modal { @extend %base; }
.tooltip { @extend %base; }
```

# Prefix partial files with an underscore
Sass partials meant to be imported, not compiled standalone, must be named with a leading underscore (`_partial.scss`).

Good:
```scss
// _variables.scss
```

Bad:
```scss
// variables.scss
```

# Do not hardcode breakpoint values
Media query breakpoints should reference a shared variable/map, not repeated literal pixel values.

Good:
```scss
@media (min-width: map-get($breakpoints, md)) { ... }
```

Bad:
```scss
@media (min-width: 782px) { ... }
```

# Document deeply chained Sass maps
A Sass map nested more than 2 levels deep should have a comment explaining its structure.

Good:
```scss
// theme: { colors: { primary: { base, hover } } }
$theme: (colors: (primary: (base: blue, hover: darkblue)));
```

Bad:
```scss
$theme: (colors: (primary: (base: blue, hover: darkblue)));
```

# Give functions clear, descriptive names
A custom Sass function's name should describe what it computes, not be a vague abbreviation.

Good:
```scss
@function rem($px) { @return $px / 16px * 1rem; }
```

Bad:
```scss
@function f1($px) { @return $px / 16px * 1rem; }
```

# Do not leave commented-out Sass code
Dead, commented-out Sass rules or mixins should be deleted, not left in the file.

Good:
```scss
.btn { color: blue; }
```

Bad:
```scss
// .btn { color: red; }
.btn { color: blue; }
```

# Avoid magic numbers in calc()/math operations
A numeric literal used in a Sass math operation should be a named variable explaining its meaning.

Good:
```scss
$header-height: 64px;
height: calc(100vh - #{$header-height});
```

Bad:
```scss
height: calc(100vh - 64px);
```

# Use consistent unit types within a property
Do not mix units (e.g. `px` and `%`) for the same conceptual value within a file without reason.

Good:
```scss
margin: 1rem 1rem;
```

Bad:
```scss
margin: 1rem 16px;
```

# Avoid circular @use dependencies
Two Sass partials must not `@use` each other, creating a circular module dependency.

Good:
```scss
// buttons.scss @uses variables.scss only
```

Bad:
```scss
// buttons.scss @uses cards.scss
// cards.scss @uses buttons.scss
```

# Bound loop ranges clearly
A `@for`/`@each` loop should have a clear, bounded range that is obviously correct from reading the code.

Good:
```scss
@for $i from 1 through 5 { .col-#{$i} { width: $i * 20%; } }
```

Bad:
```scss
@for $i from 1 through $dynamic-unbounded-var { ... }
```

# Document overrides of framework variables
Overriding a third-party framework's Sass variable should have a comment explaining why the default wasn't used.

Good:
```scss
// Bootstrap default is 0.25rem; increased for our larger touch targets.
$border-radius: 0.5rem;
```

Bad:
```scss
$border-radius: 0.5rem;
```

# Do not mix CSS custom properties and Sass variables for the same value
A single themeable value should be represented consistently, not partly as a Sass variable and partly as a CSS custom property.

Good:
```scss
$color-primary: blue;
:root { --color-primary: #{$color-primary}; }
.btn { color: var(--color-primary); }
```

Bad:
```scss
.btn { color: $color-primary; }
.card { color: var(--color-primary); }
```

# Keep specificity low in component partials
Avoid ID selectors and deep nesting in component-level Sass partials to keep specificity predictable.

Good:
```scss
.card__title { font-weight: 600; }
```

Bad:
```scss
#main .card .card__title { font-weight: 600; }
```
