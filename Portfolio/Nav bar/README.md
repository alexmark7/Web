# Navigation-only component

Open `index.html` after extracting the ZIP. No npm, server or internet is needed.
This is a separate extraction of the portfolio header; the full portfolio is unchanged.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Working demo with temporary link destinations |
| `navigation.html` | Header markup to copy into your page |
| `navigation.css` | Scoped header, desktop dropdown and mobile styles |
| `navigation.js` | Mobile toggling, Escape/focus handling and resize reset |

## Add it to your page

1. Copy `navigation.css` and `navigation.js` beside your HTML file.
2. Put these two lines inside your page's `<head>`:

```html
<link rel="stylesheet" href="navigation.css">
<script src="navigation.js" defer></script>
```

3. Copy the whole block from `navigation.html` inside `<body>`, before your main content.
   Do not link to navigation.html or fetch it: copying the markup keeps offline use simple.
4. Give your main content `id="page-content"` and `tabindex="-1"` for the skip link.
5. Leave at least 76px above your content (64px on mobile), because the header is fixed.
   For example, use `main { padding-top: 100px; }` in your own page stylesheet.
6. Replace demo links such as `href="#study"` with your page paths, for example
   `href="study/index.html"`. Adjust paths if your page is inside a subfolder.
7. Move `aria-current="page"` from Journey to whichever top-level link represents
   the current page. The component does not automatically detect the current URL.

## Customise it

- Change the brand text and links directly in the HTML.
- Change colours and the monospace font in the variables at the top of navigation.css.
- The desktop Foundations dropdown opens on hover or keyboard focus. Mobile shows
  the five main links; Foundations leads to its main page rather than opening the dropdown.
- To remove the Foundations dropdown, delete its `.mega-menu` block and remove
  `has-mega-menu` from that list item. Keep the main Foundations link.
- Keep the CSS and JavaScript breakpoint at 760/761px in sync.
- Use one navigation component per page; its IDs are intentionally unique.

The moon, animation progress readout, portfolio data and page renderer are not
required. Shared colours and reset rules needed by the header are included locally
and scoped to `.portfolio-nav`; your page's typography is not reset.

Validation: local asset and link targets, JavaScript syntax, DOM menu toggling,
Escape focus return and desktop resize reset were checked. Real-browser visual
QA was unavailable in this environment.
