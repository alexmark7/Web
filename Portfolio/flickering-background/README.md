# Flickering ASCII background only

Extract the ZIP and open `index.html`. The demo displays only flickering stars
on solid black. No moon, navigation, scroll-driven geometry, glow, external
fonts, npm, server or internet connection is required.

This is a standalone adaptation of the portfolio's star renderer. It retains
the original seeded placement, shuffled update order, five symbols and 180 ms
pulse interval. Scene blending and lunar rendering have been removed. The main
portfolio and navigation-only package are unchanged.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Ready-to-open, background-only demo |
| `background.html` | Small markup block to copy into a page |
| `background.css` | Black fixed layer, star typography and foreground helper |
| `background.js` | Grid sizing, star placement, flicker and scheduling |

## Add it to an existing page

Copy `background.css` and `background.js` beside your HTML file. Add to `<head>`:

```html
<link rel="stylesheet" href="background.css">
<script src="background.js" defer></script>
```

Immediately after `<body>`, paste:

```html
<div class="ascii-star-background" aria-hidden="true">
  <pre id="ascii-stars"></pre>
</div>
```

Place your foreground content above it:

```html
<main class="ascii-star-content">
  <h1>Your heading</h1>
  <p>Your content.</p>
</main>
```

The background has z-index 0 and captures no clicks. The helper class places
content at z-index 1. If your page already has its own stacking system, keep its
foreground above the background. Opaque foreground backgrounds will cover stars.
Use this component once per page. No HTML import or fetch is necessary.

## Customise

Edit SETTINGS near the top of background.js:

- `characters`: the symbols to cycle through. Keep a non-empty array of single,
  equal-width characters. The default is `.`, `·`, `:`, `*`, `+`.
- `starFraction`: approximately how many grid cells contain a star (0–1).
- `pulseMilliseconds`: time between pulses; larger values flicker more slowly.
- `changeFraction`: fraction of stars changed per pulse (0–1).
- `targetCells`: approximate grid work budget; larger grids require more work.

Change `color` in background.css for tint/brightness. To match the dimmer stars
on the portfolio's reading pages, lower its alpha from 0.82 to about 0.37.

Star locations stay fixed while idle and while scrolling. Resize rebuilds the
responsive grid. Each pulse changes a scattered sample, then commits one whole
text frame; it does not visibly paint one row at a time. The renderer sleeps
between pulses, pauses in hidden tabs and shows static stars for reduced motion.

## Verification limits

JavaScript syntax and a simulated runtime check cover responsive sizing,
scattered flicker, stable positions, one text commit per update, no scroll
listener, hidden-tab pausing and reduced motion. Assets and ZIP integrity are
checked. Actual browser visual QA is not available in this environment.
