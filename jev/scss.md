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

# !default does not override a variable already set to any value
`!default` only assigns if the variable is completely undefined — if it was already set to an empty string, `false`, or `null` by an earlier `@use`/`@import`, `!default` will NOT override it either, which can be surprising.

Good:
```scss
// Set intentional values before any !default declarations that might no-op against them
$enable-shadows: true;
```

Bad:
```scss
$enable-shadows: false;
// ... later ...
$enable-shadows: true !default; // no-ops: false is still "set", not undefined
```

# @extend inside a media query only affects selectors in that same query
A placeholder or selector `@extend`ed from within a media query block only pulls in rules for selectors that are ALSO within that same media query, not the base (unscoped) declaration of that selector.

Good:
```scss
%btn-base { color: blue; }
.btn { @extend %btn-base; }
@media (min-width: 600px) {
  .btn-wide { @extend %btn-base; }
}
```

Bad:
```scss
%btn-base { color: blue; }
@media (min-width: 600px) {
  .btn-wide { @extend %btn-base; } // won't match the base %btn-base outside this query
```

# Sass map keys need quoting to avoid being parsed as color names or booleans
An unquoted map key that happens to match a CSS color keyword (e.g. `red`, `tan`) or `true`/`false` is parsed as that special value, not as a plain string key.

Good:
```scss
$sizes: ("small": 8px, "large": 24px);
```

Bad:
```scss
$sizes: (red: 8px, large: 24px); // "red" is parsed as the color, not a string key
```

# Nesting & with pseudo-classes depends on placement
Where `&` appears relative to a pseudo-class selector changes the compiled output — `&:hover` versus `& :hover` compile to a completely different (attached vs. descendant) selector.

Good:
```scss
.btn {
  &:hover { color: blue; } // .btn:hover
}
```

Bad:
```scss
.btn {
  & :hover { color: blue; } // .btn :hover — any hovered descendant, not the button itself
```

# / for division is deprecated outside of specific contexts
Using `/` for arithmetic division is deprecated in favor of `math.div()`; `/` still works unchanged for CSS shorthand like `font: 16px/1.5`, which can make it unclear whether a given `/` is arithmetic or shorthand syntax.

Good:
```scss
@use "sass:math";
$half: math.div($width, 2);
```

Bad:
```scss
$half: $width / 2; // deprecated arithmetic usage, easy to confuse with shorthand syntax
```

# Use shared spacing-scale variables instead of literal values
Spacing values used in Sass should reference a shared scale/map variable, not one-off literals, so the compiled CSS stays visually consistent across components.

Good:
```scss
$space-2: 8px;
.card { padding: $space-2 * 2; }
```

Bad:
```scss
.card { padding: 15px; } // arbitrary value, not from the shared scale
```

# Avoid @extending unrelated selectors just to share a few properties
@extending a placeholder from many unrelated selectors bloats the compiled CSS with a long, hard-to-read combined selector list; a mixin (which duplicates only the needed declarations) is often clearer for loosely related cases.

Good:
```scss
@mixin card-shadow {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.card { @include card-shadow; }
.tooltip { @include card-shadow; }
```

Bad:
```scss
%shadow { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.card, .tooltip, .modal, .dropdown, .popover { @extend %shadow; } // huge combined selector in output
```

# Keep generated selector specificity predictable for overrides
Deep nesting compiles to high-specificity selectors that are hard for consumers (or later code) to override without `!important`; keep nesting shallow so overriding a component's styles stays straightforward.

Good:
```scss
.card__title {
  font-weight: 600;
}
```

Bad:
```scss
.page .content .card .header .card__title {
  font-weight: 600; // very high specificity, hard to override later
}
```
