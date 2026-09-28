# Flickering ASCII background only

Extract the ZIP and open `index.html`. The demo displays only flickering stars
on solid black. No moon, navigation, scroll-driven geometry, glow, external
fonts, npm, server or internet connection is required.

This is a standalone ASCII star background. Every star is placed separately at
a random horizontal and vertical position, so the stars are not limited to a
text grid. During each pulse, a scattered group changes brightness and symbol,
and some of those stars move to new random positions.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Ready-to-open, background-only demo |
| `background.html` | Small markup block to copy into a page |
| `background.css` | Black fixed layer, star typography and foreground helper |
| `background.js` | Random star placement, flicker and screen resizing |

## Add it to an existing page

Copy `background.css` and `background.js` beside your HTML file. Add to `<head>`:

```html
<link rel="stylesheet" href="background.css">
<script src="background.js" defer></script>
```

Immediately after `<body>`, paste:

```html
<div class="ascii-star-background" aria-hidden="true">
  <div id="ascii-stars"></div>
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
- `pulseMilliseconds`: time between pulses; larger values flicker more slowly.
- `changeFraction`: fraction of stars changed per pulse (0–1).
- `moveFraction`: fraction of changing stars that move to a new position.
- `pixelsPerStar`: controls how many stars are made for the screen size. A
  smaller value creates more stars.
- `minimumStars` and `maximumStars`: limits for small and large screens.
- `minimumSize` and `maximumSize`: size range for the ASCII symbols.
- `minimumOpacity` and `maximumOpacity`: brightness range for the stars.

Change `color` in background.css to give the stars another colour. Change
`minimumOpacity` and `maximumOpacity` in background.js to make them dimmer or
brighter.

Scrolling does not move the background. Resizing creates a new set of stars for
the new screen size. The background pauses in hidden tabs and remains still when
the visitor has reduced motion turned on.

## Verification limits

JavaScript syntax and file checks can be completed without a browser. Actual
browser visual testing may still be needed to adjust the amount and brightness
of stars to personal preference.
