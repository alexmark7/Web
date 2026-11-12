# Portfolio performance audit — 12 November 2026

> Baseline snapshot: the measurements below precede the focused scroll-rendering changes documented at the end.

**Backdrop blur and frequent star updates are the main rendering costs. Remove the small badge/social/button blurs, simplify case-study panel blur, and optimize the star field. Keep the artwork and mist. Removing box shadows did not produce a dependable improvement.**

Audited the current local `portfolio-v1_1` workspace, including its uncommitted changes. Reviewed all six pages and shared scripts; measured loading, scenery preparation, idle animation and scrolling. The audit itself made no implementation changes; temporary browser overrides were used for comparisons. A later scroll-popping follow-up is documented below.

## Measured blur and shadow impact

Primary comparison: hardware-accelerated Firefox 159, WebRender on an RTX 4070 SUPER, native Wayland window, 1920 × 1080 viewport, device-pixel ratio 1. Home was positioned at Current technologies, with sun/cloud animations starting at matching points. Each variant ran three times in different orders, with warm assets. Scroll tests followed the same path over 3.2 seconds. Observed animation callback cadence was approximately 144 Hz.

Numbers below are **whole-browser CPU work in milliseconds per second**, summed across Firefox and its subprocesses. 1,000 ms/s represents one logical CPU core's work; multiple processes can exceed that. These are not GPU utilization, battery measurements or presented-frame counts.

| Temporary change | Idle CPU ms/s, median [range] | Idle reduction | Scroll CPU ms/s, median [range] | Scroll reduction |
| --- | ---: | ---: | ---: | ---: |
| Current design | 709 [669–714] | — | 1,376 [1,300–1,490] | — |
| Remove technology/project badge and social blur | 340 [280–345] | **52%** | 890 [884–942] | **35%** |
| Remove every backdrop blur | 211 [202–215] | **70%** | 718 [688–728] | **48%** |
| Remove box shadows only | 759 [706–773] | No consistent gain | 1,440 [1,337–1,736] | No consistent gain |

The blur ranges are clearly separated from the current design across all three repeats. Shadow results overlap normal variation or are worse; this does not establish that removing shadows causes a slowdown. The callback cadence stayed similar, so the demonstrated gain is less CPU work and more performance headroom, not a measured FPS increase. Savings from different removals cannot be added together.

A narrow 390 × 844, DPR 2 desktop-browser check was also run. Its baseline samples included an interruption and large variation, so no narrow-screen percentage is claimed. This was not a physical phone test.

A separate broad pass at approximately 60 Hz corroborated the result: Home idle CPU fell from about 401 ms/s to 185 without badge/social blur and 103 without any backdrop blur. That pass also covered Projects, the case study and dark Home. It included interrupted samples and a later display-cadence change, so the clean confirmation above is the basis for the headline percentages.

Backdrop filters process what is behind each surface and require additional rendering passes. Moving scenery makes that distinction relevant here. [WebKit's implementation explanation](https://webkit.org/blog/3632/introducing-backdrop-filters/) supports the mechanism; the percentages above come from this site's tests.

## What I recommend removing or reducing

| Priority | Element | Impact and recommendation |
| --- | --- | --- |
| 1 | Technology/project badges and social icons | **Remove backdrop blur.** Removing these small filters produces a large measured saving with a modest visual change. Keep the colored tint and border. Firefox already reduces their light-mode blur from 18px to 6px, but the remaining cost is still substantial. |
| 2 | Stars in dark mode | **Optimize alongside blur.** Build a viewport-sized pool, cap simultaneous twinkles, and test 150–250ms updates instead of 45ms. Avoid creating thousands of hidden light-mode stars. Pausing star activity gave the largest dark-idle reduction; see the separate comparison below. |
| 3 | Ordinary buttons | **Remove their 12px backdrop blur.** Use their existing tint/border for separation. This was included with panels in the broad test, so no isolated button percentage is claimed. |
| 4 | Case-study code blocks, screenshots and nested badge containers | **Remove utilitarian and nested blur.** The page has 39 blurred code blocks, 15 blurred badge-group containers and eight blurred figures. Some badges blur an already-blurred container. Use a readable paper/dark surface tint instead. |
| 5 | Large project/content cards | **Reduce 12px blur to 4–6px, or remove it.** The exact benefit of an intermediate radius has not been measured. Keep adequate surface opacity for text. The all-blur removal result is the upper comparison, not a prediction for a 6px setting. |
| 6 | Double panel shadows and button shadows | **Optional simplification.** One restrained panel shadow and no button shadow would be reasonable styling, but shadow removal is not a demonstrated major performance win. |
| 7 | Dark text shadows | **Reduce selectively if needed.** Each main text element gets three shadows. The broad dark test showed a smaller, variable improvement when they were disabled. Preserve contrast where the moon passes behind text; do not remove this readability treatment everywhere without a visual check. |
| 8 | Navbar blur | **Keep modest or test separately.** It is 4px after scrolling in light mode and 8px in dark mode. Its isolated cost was not measured, so there is no basis to promise a particular saving from removing it alone. |

Home declares 32 backdrop-filter surfaces, Projects 48, CV 31, About 12, Browser Games nine, and the case study 100. These are whole-page declarations, including offscreen content, not simultaneous visible filter counts. The light navbar at the top has zero blur. At the measured Home position, all 23 technology badges were visible.

## Scenery, animation and interaction findings

**Keep the river, forest and mist.** They are already one static canvas. It paints on preparation/geometry changes; it has no idle frame loop. Mist removal would mainly affect preparation work and appearance, not eliminate a continuous mist animation.

Warm desktop scenery preparation took about **95–97ms at DPR 2**, compared with **29–39ms at DPR 1**. These are elapsed preparation times, including synchronous drawing/readback and promise scheduling, not isolated CPU times. Repeating preparation at an unchanged size took approximately 0–2ms. Coalesce/debounce resize painting and reuse the current painting while resizing. Consider a 1–1.5 DPR cap for decorative canvas after checking image quality.

Eight clouds and the sun animate continuously. In the broad light test, disabling CSS animation/transition reduced idle work substantially, but stopped the motion the design is meant to retain. Remove blur first. If further savings are needed, animate fewer clouds or provide a reduced-effects choice. **Preserve the 0.1° Firefox rotation fix** that resolved the earlier sun/cloud stepping.

**The star pool grows beyond what the current page needs.** At this viewport, Home initially had 389 star elements; the case study created 5,075. Shorter pages retained those 5,075, even in light mode. The Browser Games document consequently contained 5,282 elements despite its small amount of content. Dark mode filters the retained list every 45ms, and page exit serializes it to session storage. This is a specific implementation issue worth fixing rather than removing the night sky.

A separate three-repeat dark Home test followed a case-study visit, retaining approximately 5,100 stars. It kept the UFO's countdown from reaching a flight in every variant. Pausing stars used the existing page-hide cleanup before measurement, leaving CSS scenery and blur in place. Existing opacity transitions could finish briefly after cleanup; new star activity was stopped. This is an upper-bound comparison, **not a forecast that pooling alone will save 91%**.

| Dark idle test | Median CPU ms/s [range] | Reduction versus its own baseline |
| --- | ---: | ---: |
| Current stars and blur | 1,455 [1,449–1,512] | — |
| Pause star timer and pending changes | 125 [112–143] | **91%** |
| Remove all backdrop blur | 731 [696–825] | **50%** |
| Pause stars and remove blur | 93 [81–336] | **94%** |
| Remove moon drop-shadow only | 1,414 [1,405–1,440] | About 3%; low priority |

Star updates and blur interact: changing pixels behind glass forces more backdrop work. The pause result includes avoiding those repaints as well as the star timer/scanning work. Use fewer simultaneous changes, a smaller pool and less frequent repositioning before considering a static star field. Keep the moon glow unless its appearance is unwanted.

The UFO animates only during flight/dragging. It writes `left` and `top` each frame; positioning entirely with transforms is a sensible follow-up. Navigation scans descendants/computed styles and creates many text/border animations, particularly on the case study. Limit transitions to visible groups and avoid repeated containment scans. These are source-supported optimization candidates; their individual timing savings were not measured.

Browser Games currently uses static previews and a brief selection animation, not a continuously running game engine. Shared scripts initialize once, and navigation/animation cancellation is present; no obvious accumulating listener loop was found.

## Loading and image budget

The first fresh light Home load reported these unique resource body sizes:

| Resource | Bytes |
| --- | ---: |
| 15 optimized light paintings at 1× | 409,138 |
| Moon image, despite being hidden in light mode | 114,419 |
| JavaScript | 82,794 |
| Two unique font files | 55,680 |
| CSS | 54,930 + unreported Google Fonts CSS |
| HTML and SVG/icons | 12,028 |
| **Known total** | **728,989 + unreported font CSS** |

These are local resource body sizes, not a production network-speed score. A duplicated font timing entry was cached/reused, so it is counted once. The local server does not establish GitHub Pages compression or real visitor latency.

Recommended loading changes:

1. Defer the moon image until dark mode needs it. It represents about **16% of the known initial light-page resource bodies**.
2. Reconsider warming every light painting for dark visitors. The painting set is **409KB at 1× or 1.25MB at 2×**. Delaying it until toggle intent or respecting Save-Data saves unused work, with a tradeoff against the currently smooth first theme switch. Preserve the existing decode/readiness gate so scenery still appears together.
3. Consider limiting decorative high-density assets. Decoded RGBA artwork alone is roughly **12MB at 1× / 37MB at 2×**, before canvas and GPU copies.
4. Keep only minimal early theme selection synchronous, then defer the remaining 6.9KB theme logic. It currently blocks HTML parsing in the head. This is a secondary improvement; the preload scanner and hosting cache can reduce its real cost.
5. Keep responsive portraits, density-specific paintings, lazy case-study screenshots and explicit image dimensions. Screenshot WebP/AVIF conversion and self-hosted/subset fonts are lower priorities than the measured blur work.

All six pages completed the loading/scenery checks. Local first-contentful-paint observations ranged from 94–303ms; these are a functional local sanity check, not representative production loading results. No Lighthouse score, field INP or field Core Web Vitals claim is made. Historic portfolio folders are excluded from the Pages upload and do not increase visitors' downloads.

## Evidence and limits

[Primary comparison data](performance-2026-11-12/home-light-confirmation.json), [broad comparison data](performance-2026-11-12/broad-pass.json), [six-page loading/resize data](performance-2026-11-12/loading-and-resize.json), [dark-star comparison](performance-2026-11-12/dark-star-comparison.json), and [narrow-viewport samples](performance-2026-11-12/narrow-viewport-comparison.json) are included for review. Primary samples remained visible/focused. CPU accounting uses each process's user/system ticks, traversing children spawned by every Firefox thread and checking process start times. Tick resolution is 10ms; transient process exits can cause a small undercount.

The test machine and other running desktop workloads affect absolute values. The native graphics backend was verified in a fresh profile's `about:support`. Firefox's sanitized WebGL renderer string was not used as its hardware identity. An attempted 60Hz cap in the temporary confirmation profile did not cap the observed callback cadence; results are labeled by the observed approximately 144Hz cadence. User browser preferences were not changed. Software-rendered Chrome probes and the early incomplete CPU counter were excluded from the results above.

Source references: [blur and shadows](../portfolio-v1_1/css/style.css), [stars/scenery](../portfolio-v1_1/js/background.js), [static canvas](../portfolio-v1_1/js/river-scene.js), [preloading/theme switching](../portfolio-v1_1/js/theme.js), [navigation](../portfolio-v1_1/js/page-transition.js), [UFO](../portfolio-v1_1/js/ufo.js).

## Follow-up: popping during smooth/trackpad scrolling

The user reported both brief disappearances and position jumps. In native Firefox wheel-scroll checks, the Home scenery triggered **zero image downloads and zero forest-canvas redraws** while scrolling. Native scroll timelines were supported, so this Firefox instance was not using the JavaScript parallax fallback. There is no scroll-reveal observer in the site.

The light navbar previously switched from 0px to 4px backdrop blur on the first scroll pixel and animated the filter for 300ms. That is a confirmed scroll-triggered visual change. Other transient blank frames were not reliably captured. Rendering pressure is a plausible contributor given the measured backdrop costs; it is not a proven diagnosis for every reported disappearance. Firefox can scroll previously painted content independently while rendering catches up, as described in [Mozilla's APZ documentation](https://firefox-source-docs.mozilla.org/gfx/AsyncPanZoom.html).

Applied a focused CSS change:

- Keep navbar blur constant during scrolling: 4px light, 8px dark; fade only its background tint.
- Remove individual blur from technology/project badges, social icons and ordinary buttons.
- Remove nested/utility blur from case-study code blocks, badge groups and screenshot figures.
- Retain the main panels' 12px frost, tinted surfaces, shadows, landscape artwork and existing sun/cloud animation.

Verification covered six Firefox configurations: Home light/dark at 1920px, Projects and the case study light at 1440px, Home light at 390px/DPR2, and CV dark at 1440px. Native wheel scrolling confirmed constant navbar filters, no small/utility blur, no horizontal overflow and no scenery redraws. Light scenery remained ready with sun/cloud animations active. Desktop/mobile screenshots were inspected, and print-media checks confirmed the CV still prints without backdrop filters. [Verification data](performance-2026-11-12/scroll-fix-verification.json).

These checks verify the implementation and remove confirmed filter changes; physical trackpad behavior and every transient rendering artifact still require visual confirmation in the affected window. The earlier CPU percentages describe the baseline A/B experiments, not a new benchmark of this combined follow-up change.

## Applied recommendations: panel blur and bounded stars

The requested improvements are now applied in `portfolio-v1_1`:

- Badges, social icons, ordinary buttons, game-choice buttons, code blocks and nested case-study containers have no backdrop blur.
- Main panel blur is **6px**, reduced from 12px. Existing tints and borders remain. Light panels and their hover/focus states each use one restrained shadow.
- Stars use document-coordinate rows around the viewport, with half a viewport of overscan on each side and a **600-element maximum**. Offscreen rows are recycled in batches; returning to a shorter page trims the pool. Visible rows retain their positions during scrolling.
- Star changes start at most once every **200ms**, replacing two starts every 45ms, with **at most six active changes**, including brightness fades. Numeric coordinates are cached; pulses no longer parse thousands of inline styles. Relocations stay inside their owned rows.
- Light mode clears the star pool. Hidden tabs and reduced-motion mode stop twinkle timers; returning to dark/visible mode restores the appropriate bounded field. Legacy full-document session storage is discarded; seeded rows recreate the pattern without serializing or restoring thousands of stars.

Native Firefox checks observed **387 stars on Home**, **411 at the case-study top**, **550 while scrolling through the case study**, then **387 on returning Home**. The stress check reached the six-animation limit without exceeding it. A hidden tab had zero star pulse timers, resuming restored exactly one, and light mode had zero stars/timers. Mobile/large-screen resizing preserved coverage without exceeding the pool cap; no JavaScript errors were reported. [Firefox verification](performance-2026-11-12/star-pool-verification.json).

A separate Chromium functional check passed reduced-motion, long-page recycling, normal-motion resumption, theme cleanup, computed blur/shadow styles in both themes, and CV printing. Reduced motion kept the stars static and immediately canceled active fades. [Reduced-motion/style verification](performance-2026-11-12/reduced-motion-verification.json).

A 3840 × 2160 case-study check exercised capped spacing: the pool stayed at 447–597 stars with roughly 300 visible. Resizing that view to 390 × 844 reduced the pool to 88, then light mode cleared it. [Wide/mobile cap verification](performance-2026-11-12/star-wide-cap-verification.json).

These follow-up figures describe resource limits and functional behavior. The baseline CPU-reduction percentages above have not been re-measured for this final combined implementation.
