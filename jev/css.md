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
