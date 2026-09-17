---
applies_to: **/*.html
---

# Every img must have an alt attribute
An `<img>` element must include an `alt` attribute describing the image (or `alt=""` if purely decorative).

Good:
```html
<img src="logo.png" alt="Company logo">
```

Bad:
```html
<img src="logo.png">
```

# Form inputs must have associated labels
Every form input must have a `<label>` associated via `for`/`id` or by wrapping, not rely on placeholder text alone.

Good:
```html
<label for="email">Email</label>
<input id="email" type="email">
```

Bad:
```html
<input type="email" placeholder="Email">
```

# Do not use inline event handler attributes
Avoid `onclick="..."` and similar inline handlers; attach event listeners in script instead.

Good:
```html
button.addEventListener("click", handleClick);
```

Bad:
```html
<button onclick="handleClick()">Go</button>
```

# Avoid inline styles
Use CSS classes rather than `style="..."` attributes for styling.

Good:
```html
<div class="banner"></div>
```

Bad:
```html
<div style="color:red;"></div>
```

# Headings must not skip levels
Heading levels should increase by one at a time (`h1` then `h2` then `h3`), not jump from `h1` to `h3`.

Good:
```html
<h1>Title</h1>
<h2>Section</h2>
```

Bad:
```html
<h1>Title</h1>
<h3>Section</h3>
```

# Prefer semantic elements over generic divs
Use `<nav>`, `<button>`, `<header>`, `<main>` etc. where semantically appropriate instead of generic `<div>`/`<span>`.

Good:
```html
<button>Submit</button>
```

Bad:
```html
<div class="button" onclick="submit()">Submit</div>
```

# Interactive elements must be keyboard accessible
Custom interactive elements must be reachable and operable via keyboard (tab order, Enter/Space activation), not mouse-only.

Good:
```html
<button onClick={toggle}>Toggle</button>
```

Bad:
```html
<div onClick={toggle}>Toggle</div>
```

# Avoid deprecated tags
Deprecated elements like `<font>`, `<center>`, `<marquee>` must not be used; use CSS equivalents.

Good:
```html
<strong>Warning</strong>
```

Bad:
```html
<marquee>Warning</marquee>
```

# Do not duplicate id attributes within a page
Each `id` value must be unique within the document; duplicates break `#id` selectors and accessibility APIs.

Good:
```html
<div id="header"></div>
<div id="footer"></div>
```

Bad:
```html
<div id="section"></div>
<div id="section"></div>
```

# Links must have descriptive text
Anchor text should describe the destination, not a generic "click here" or a bare URL.

Good:
```html
<a href="/pricing">View pricing plans</a>
```

Bad:
```html
<a href="/pricing">click here</a>
```

# Avoid tables for layout
`<table>` should be used for tabular data only, not as a layout mechanism; use CSS layout instead.

Good:
```html
<div class="grid"><div>A</div><div>B</div></div>
```

Bad:
```html
<table><tr><td>A</td><td>B</td></tr></table>
```

# Add rel="noopener" to target="_blank" links
A link opened with `target="_blank"` should include `rel="noopener"` to prevent the new page from accessing `window.opener`.

Good:
```html
<a href="https://ext.com" target="_blank" rel="noopener">Docs</a>
```

Bad:
```html
<a href="https://ext.com" target="_blank">Docs</a>
```

# Do not nest interactive elements
A `<button>` or `<a>` must not be nested inside another interactive element; it breaks accessibility semantics and some browsers' behavior.

Good:
```html
<a href="/item">View item</a>
```

Bad:
```html
<a href="/item"><button>View item</button></a>
```

# Each page should have exactly one h1
A page should have a single top-level `<h1>` describing its main content.

Good:
```html
<h1>Dashboard</h1>
```

Bad:
```html
<h1>Dashboard</h1>
<h1>Overview</h1>
```

# Avoid excessive DOM nesting depth
Very deep DOM nesting hurts readability and rendering performance; flatten where reasonable.

Good:
```html
<section><article><p>Text</p></article></section>
```

Bad:
```html
<div><div><div><div><div><div><p>Text</p></div></div></div></div></div></div>
```

# Use defer or async for non-critical scripts
Script tags that don't need to block parsing should use `defer` or `async`.

Good:
```html
<script src="analytics.js" defer></script>
```

Bad:
```html
<script src="analytics.js"></script>
```

# Include a responsive viewport meta tag
Pages meant to be responsive must include `<meta name="viewport" content="width=device-width, initial-scale=1">`.

Good:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Bad:
```html
<!-- no viewport meta tag -->
```

# Avoid autoplaying media with sound
Audio/video should not autoplay with sound; require explicit user interaction.

Good:
```html
<video controls src="demo.mp4"></video>
```

Bad:
```html
<video autoplay src="demo.mp4"></video>
```

# Do not leave sensitive information in HTML comments
HTML comments are visible in page source; they must not contain credentials or internal notes.

Good:
```html
<!-- checkout flow v2 -->
```

Bad:
```html
<!-- staging admin password: temp123 -->
```

# Ensure sufficient color contrast
Text and background color combinations must meet accessible contrast ratio guidelines.

Good:
```html
color: #1a1a1a; background: #ffffff;
```

Bad:
```html
color: #cccccc; background: #ffffff;
```

# Avoid mixing tabs and spaces for indentation
Use one consistent indentation style throughout an HTML file.

Good:
```html
<div>
  <p>Text</p>
</div>
```

Bad:
```html
<div>
	<p>Text</p>
  </div>
```

# Use data- prefix for custom attributes
Custom attributes on elements must use the `data-` prefix rather than inventing non-standard attribute names.

Good:
```html
<div data-testid="submit-button"></div>
```

Bad:
```html
<div testid="submit-button"></div>
```

# Do not use presentational HTML attributes
Attributes like `bgcolor` and `align` are presentational and deprecated; use CSS instead.

Good:
```html
<td class="highlight"></td>
```

Bad:
```html
<td bgcolor="yellow"></td>
```

# Iframes must have a descriptive title attribute
Every `<iframe>` must have a `title` attribute describing its content for assistive technology.

Good:
```html
<iframe src="map.html" title="Store location map"></iframe>
```

Bad:
```html
<iframe src="map.html"></iframe>
```
