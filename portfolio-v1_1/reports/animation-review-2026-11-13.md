# Animation review — 13 November 2026

Reviewed the six active portfolio pages in both themes, including shared scenery,
navigation, theme switching, UFO animation, stars, and Snake. This review follows
the mobile toolbar stabilization and leaves the historical portfolio copies alone.

## Additional fixes

| Trigger | Before | After |
| --- | --- | --- |
| Small phone rotates to landscape | Snake's canvas had zero CSS width at 667×375 and 640×360. | The short landscape layout retains a 178px canvas inside a 180px board; the dialog scrolls and Exit stays visible. |
| Continuous desktop resize | A 15-step DPR 2 resize burst triggered 13 full river/forest repaints. | Heavy painting waits 120ms for resizing to settle. The same burst triggered one repaint. The existing painting stays visible, and explicit theme preparation remains immediate. |
| Display density changes without a CSS size change | The viewport helper ignored density, leaving the old canvas resolution. | Density is part of the published state, with a rearmed resolution media query to detect changes. Screen geometry changes also notify the painter. |

The density watcher follows the browser's
[resolution media-query mechanism](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#monitoring_screen_resolution_or_zoom_level_changes).
Resize timers are canceled on page exit and the painting is refreshed on restoration.

## Verification

The final stress suite passed 21 scenarios, and the viewport regression suite
passed another 15. Both reported no runtime exceptions. A compact
[verification record](animation-review-2026-11-13.json) retains the results.

- After preparation, idle and scrolling on all six pages in both themes caused no additional scenery
  paints or ink rebuilds. The tested dark star pool stayed at 64 nodes, below its 600-node cap.
- Rapid theme changes settled on the requested and stored theme without stranded
  transition classes. Interrupted navigation and Back/Forward left content visible,
  interactive, and free of stuck loading states.
- Live reduced-motion changes, actual tab hiding, freeze/resume, and simulated
  pagehide/pageshow restoration completed without stuck animations.
- The mobile toolbar/scroll scenario also passed under a synthetic 4× CPU slowdown.
- Both landscape Snake cases, the desktop resize burst, and a density change at
  unchanged CSS dimensions passed their targeted checks.

JavaScript syntax and Git whitespace checks passed. The code review found no
additional blocking animation lifecycle or transform conflicts. Image dimensions
reserve space for the portrait and lazy case-study screenshots.

## Limits

Checks used local files served over HTTP in headless Microsoft Edge with emulated
touch and viewport sizes. External fonts were blocked in the harness. These are
functional rendering checks, not presented-frame/FPS or physical-phone measurements.
The CDP density override emitted neither resolution-media nor resize notifications;
an explicit resize event verified the density update from 1430 to 2860 canvas pixels.
A real monitor move and the iPhone app still need device verification after deployment.
Changes remain local.
