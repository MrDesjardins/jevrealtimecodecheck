---
applies_to: **/*.css
---

# Avoid !important

`!important` should not be used to override specificity conflicts; fix the
underlying specificity or cascade order instead. It makes styles hard to
override later and is a common source of CSS debugging pain.

Good:
```css
.button--primary {
  background-color: blue;
}
```

Bad:
```css
.button {
  background-color: blue !important;
}
```

# Use relative units for font sizes

Font sizes should use `rem` or `em`, not `px`, so text scales with the
user's browser/OS accessibility settings.

Good:
```css
.body-text {
  font-size: 1rem;
}
```

Bad:
```css
.body-text {
  font-size: 16px;
}
```

# Avoid overly specific selectors

A selector should not chain more than 2-3 levels of nesting or combine ids
with multiple classes; deep selectors are fragile and hard to override.

Good:
```css
.card__title {
  font-weight: 600;
}
```

Bad:
```css
div#page .content .card > ul li a.card__title {
  font-weight: 600;
}
```

# No hardcoded colors outside design tokens

Color values should reference a shared variable/custom property rather than
a hardcoded hex/rgb value repeated across the codebase.

Good:
```css
.alert {
  color: var(--color-danger);
}
```

Bad:
```css
.alert {
  color: #d32f2f;
}
```

# Vendor prefixes must not be added by hand

Do not hand-write vendor-prefixed properties (e.g. `-webkit-`, `-moz-`);
rely on a build-time autoprefixer instead, so prefixes stay correct as
browser support changes.

Good:
```css
.box {
  display: flex;
}
```

Bad:
```css
.box {
  display: -webkit-flex;
  display: flex;
}
```

# Avoid ID selectors for styling
Style with classes, not `#id` selectors; ids should be reserved for JS hooks/anchors, not CSS specificity.

Good:
```css
.submit-button { color: blue; }
```

Bad:
```css
#submit-button { color: blue; }
```

# Do not use inline styles in markup
Styling should live in CSS files/classes, not `style="..."` attributes in HTML/JSX.

Good:
```css
<div class="banner"></div>
```

Bad:
```css
<div style="color: red;"></div>
```

# Prefer flexbox or grid over floats for layout
Use `display: flex` or `display: grid` for layout instead of `float`-based techniques.

Good:
```css
.row { display: flex; }
```

Bad:
```css
.row .col { float: left; }
```

# Avoid nesting selectors more than 3 levels deep
Deeply nested selectors are fragile and hard to override; flatten with BEM-style class names instead.

Good:
```css
.card__title { font-weight: 600; }
```

Bad:
```css
.page .content .card .header .title { font-weight: 600; }
```

# Prefer CSS custom properties for themeable values
Values that vary by theme (colors, spacing scale) should be CSS custom properties, not hardcoded literals.

Good:
```css
color: var(--color-primary);
```

Bad:
```css
color: #1a73e8;
```

# Avoid the universal selector in performance-sensitive rules
Do not use `*` in selectors applied broadly across large pages; it forces the browser to match every element.

Good:
```css
.container > * { margin: 0; }
```

Bad:
```css
* { margin: 0; }
```

# Do not use px for line-height
`line-height` should be a unitless number, not a fixed pixel value, so it scales with font-size.

Good:
```css
line-height: 1.5;
```

Bad:
```css
line-height: 24px;
```

# Prefer shorthand properties when setting all sides equally
Use `margin: 8px;` instead of setting `margin-top`, `margin-right`, `margin-bottom`, `margin-left` individually to the same value.

Good:
```css
margin: 8px;
```

Bad:
```css
margin-top: 8px;
margin-right: 8px;
margin-bottom: 8px;
margin-left: 8px;
```

# Avoid duplicate selectors within the same file
The same selector should not be declared twice in one file with different rules; merge them.

Good:
```css
.btn {
  color: blue;
  padding: 8px;
}
```

Bad:
```css
.btn { color: blue; }
.btn { padding: 8px; }
```

# Do not use fixed pixel widths on responsive containers
A container meant to be responsive should use percentage, `fr`, or `minmax()` widths, not a fixed `px` width.

Good:
```css
width: 100%;
max-width: 640px;
```

Bad:
```css
width: 640px;
```

# Prefer rem for spacing over hardcoded px
Margins and paddings should generally use `rem` so spacing scales with the root font size.

Good:
```css
padding: 1rem;
```

Bad:
```css
padding: 16px;
```

# Avoid z-index values without a documented stacking scale
A `z-index` value should come from a small, documented scale (e.g. 10/20/30), not an arbitrary large number.

Good:
```css
z-index: var(--z-modal); /* 30 */
```

Bad:
```css
z-index: 9999;
```

# Avoid transition: all
`transition: all` should be avoided; list the specific properties being transitioned for predictability and performance.

Good:
```css
transition: opacity 0.2s, transform 0.2s;
```

Bad:
```css
transition: all 0.2s;
```

# Do not hide focusable content with overflow: hidden without care
`overflow: hidden` on a scrollable focus container must not trap keyboard focus on hidden content.

Good:
```css
.menu { overflow: visible; }
```

Bad:
```css
.menu { overflow: hidden; } /* tab-focused items get clipped */
```

# Prefer aspect-ratio over the padding-hack for responsive media
Use the `aspect-ratio` property instead of the padding-percentage trick for maintaining media aspect ratio.

Good:
```css
.video { aspect-ratio: 16 / 9; }
```

Bad:
```css
.video { position: relative; padding-bottom: 56.25%; }
```

# Avoid magic breakpoint values
Media query breakpoints should reference shared variables, not one-off pixel values scattered across files.

Good:
```css
@media (min-width: $breakpoint-md) { ... }
```

Bad:
```css
@media (min-width: 782px) { ... }
```

# Do not leave empty rule blocks
A selector with an empty `{}` body should be removed.

Good:
```css
.card { padding: 8px; }
```

Bad:
```css
.card {}
```

# Prefer logical properties over physical ones for i18n
Use `margin-inline-start` instead of `margin-left` so layouts correctly mirror for right-to-left languages.

Good:
```css
margin-inline-start: 8px;
```

Bad:
```css
margin-left: 8px;
```

# Do not use color alone to convey state
State (error, success, disabled) must be conveyed with more than color alone, so it's accessible to colorblind users.

Good:
```css
.error { color: red; } .error::before { content: "⚠ "; }
```

Bad:
```css
.error { color: red; }
```

# Prefer CSS Grid named areas for complex layouts
A layout with several named regions should use `grid-template-areas` rather than deeply nested flex containers.

Good:
```css
grid-template-areas: "header header" "sidebar content";
```

Bad:
```css
.layout .sidebar { float: left; } .layout .content { float: right; }
```

# Avoid inconsistent unitless-zero usage
Be consistent about omitting units on zero values (`0` vs `0px`) within the same file.

Good:
```css
margin: 0;
padding: 0;
```

Bad:
```css
margin: 0px;
padding: 0;
```

# Do not duplicate the same color value repeatedly
A color value used more than twice should be extracted into a shared variable/custom property.

Good:
```css
border-color: var(--color-border);
```

Bad:
```css
border-color: #e0e0e0;
```

# Prefer removing will-change after the animation completes
`will-change` should be applied only while an animation is active and removed afterward, not left on permanently.

Good:
```css
.el.animating { will-change: transform; }
```

Bad:
```css
.el { will-change: transform; } /* left on permanently */
```

# Avoid box-shadow spreads that overflow their container
A `box-shadow` spread value should not visually break out of a container with `overflow: hidden` in an unintended way.

Good:
```css
box-shadow: 0 2px 4px rgba(0,0,0,0.2);
```

Bad:
```css
box-shadow: 0 0 0 50px red; /* breaks out of a clipped container */
```

# Do not use display: none to hide content that should remain accessible
Content still meant to be available to assistive tech should use visually-hidden techniques, not `display: none`.

Good:
```css
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; }
```

Bad:
```css
.sr-only { display: none; }
```

# Prefer consistent quote style for CSS strings
Use one quote style (single or double) consistently for string values like `content` or `url()`.

Good:
```css
content: "→";
```

Bad:
```css
content: '→';
content: "←";
```

# Avoid redundant tag+class selector chains
Do not write `div.container` when `.container` alone is sufficient and less brittle.

Good:
```css
.container { ... }
```

Bad:
```css
div.container { ... }
```

# Do not hardcode font stacks across many files
A font-family stack should be defined once as a variable and reused, not repeated inline everywhere.

Good:
```css
font-family: var(--font-body);
```

Bad:
```css
font-family: -apple-system, "Segoe UI", sans-serif;
```

# Avoid excessive use of !important as a specificity workaround
Repeated `!important` usage across a file is a sign the selector architecture needs restructuring, not another override.

Good:
```css
.btn--primary { color: blue; }
```

Bad:
```css
.btn { color: blue !important; }
```

# Prefer prefers-reduced-motion support for animations
Non-essential animations should respect the `prefers-reduced-motion` media feature.

Good:
```css
@media (prefers-reduced-motion: no-preference) {
  .el { transition: transform 0.3s; }
}
```

Bad:
```css
.el { transition: transform 0.3s; }
```
