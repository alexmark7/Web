# Responsive layout review — 14 November 2026

Fixed the mobile navigation spacing and audited responsive changes across Home, Projects, CV, About Me, Browser Games and the portfolio case study in both themes.

## Changes

- Navigation links stay in a compact, centered group. Font size and gaps no longer switch at 600/900px. The theme toggle stays at the far right at every width, with continuous side padding. Links use paired rows only when a full row cannot fit, and return to one row when space returns. The header still starts transparent and fades to its solid theme background and divider during scrolling.
- Birds, moon, clouds, ink, the corner tree and mountain interpolate between their phone and desktop arrangements. The river/forest renderer uses the same shared measurements, including its mist positions, so the landscape stays connected.
- Short landscape screens receive a gradual mountain adjustment rather than the previous abrupt change at 650px height. Stable mobile toolbar measurements remain in use.
- Home introduction and project widths use a continuous constraint. The previous 1100px rule could make two project cards become one column as the viewport widened; that reversal is removed.
- Section spacing and profile gaps change gradually. CV entry headings wrap according to available space. Narrow project/technology grids can shrink to their container without horizontal overflow. Footer clearance follows the tree's position.
- Ink keeps its initial composition during resizing. Stars retain existing nodes, appearance and pending twinkles while their row positions scale. Resizing no longer stops an active UFO or restarts its countdown; the next flight uses the new viewport.

Existing scenery artwork, bird/cloud scroll speeds, reduced-motion handling, and the recent image/filter/density optimizations remain in place. The shared scenery calculations reuse the existing resize path.

## Before and after

| Boundary | Previous behavior | Result |
| --- | --- | --- |
| Width 601→600px | Navigation gaps expanded from 17.7 to 93.5px | Gaps change from 17.55 to 17.50px |
| Width 601→600px | Main birds shifted about 47px horizontally and 72px vertically, shrinking 40px | Position and size change continuously; coordinate difference below 1px |
| Width 601→600px | Mountain width changed 640→760px; left changed −47→−150px | Width changes 759.3→760px, with continuous placement |
| Width 601→600px | Corner tree shifted about 201px horizontally | Subpixel position/size change |
| Width 1099→1100px | Home introduction narrowed 871→480px and the page gained about 333px height | Introduction and selected projects remain 540px wide at both widths |
| Height 651→650px at width 1366px | Mountain top jumped about 387px | Continuous change of about 3.4px |

## Verification

- **All six pages, both themes:** 26 widths from 320–1920 CSS pixels, widening and narrowing, plus short-height layouts: 768 final geometry snapshots, compared with an identical baseline matrix. Immediate neighbors of 360, 600, 768, 900, 950, 1100 and 1200px were included.
- **Height boundaries:** 24 additional shared-scenery snapshots cover 649/650/651 and 519/520/521px heights, supplemented by focused orientation and shared-geometry checks.
- **Content:** no horizontal overflow, JavaScript/resource errors or resize-direction inconsistencies in the final matrix. All 288 local references resolve, including lazy case-study images and the CV PDF.
- **Navigation, Firefox and Chromium:** actual integrated layout checked down to 280px, including wrapping and expanding again. Links and theme toggle retain at least 44×44px targets. Both themes preserve the transparent/solid/transparent scroll behavior and have no navigation backdrop blur.
- **Snake, both themes:** ready, running, paused, expanded scores, orientation changes and Exit checked at 320×720 portrait and 844×390 landscape. No dialog overflow or inaccessible critical controls.
- **Artwork:** desktop and phone screenshots inspected across all six pages. Additional live-scroll footer captures confirm the tree is visible at the bottom and footer links remain clear of it.
- **Dark animation continuity:** common star nodes and pending twinkles survive 601→600→601px resizing, the pool stays below 600 nodes, and light mode clears its nodes/timers. An active UFO remains active without a coordinate reset during viewport changes.
- JavaScript syntax and whitespace checks pass. Temporary measurement scripts and raw evidence remain outside the project.

The remaining larger movements are normal content reflow: text wrapping, columns stacking on narrow layouts, paired navigation when necessary, and footer columns rearranging. Automated geometry captures temporarily paused CSS motion inside isolated test pages; separate live checks covered animation continuity and the footer. Chromium uses software rendering here, so this review does not claim a particular FPS on physical hardware.
