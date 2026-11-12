# Portfolio final review — 12 November 2026

The local `portfolio-v1_1` passed the final page, theme, navigation and animation checks after the fixes below. Content surfaces have no backdrop blur; the navbar retains its requested 4px light / 8px dark blur after scrolling, with no blur at the very top. Keep the existing restrained card shadows. Adding shadows throughout the smaller controls has a measurable cost in this Firefox comparison, without a demonstrated frame-rate benefit.

This review follows the [earlier performance audit](portfolio-performance-2026-11-12.md). That audit's measurements describe an older version with substantially more blur and star activity; they are not measurements of the final design.

## Fixes applied during this pass

- **Defer the hidden moon texture.** A fresh light-only visit no longer requests the 114,419-byte `moon-surface.jpg`. The first switch to dark waits for its decode, and initial dark visits still request it immediately. Rapid theme changes retain the existing cancellation guard.
- **Move the UFO using one transform.** Flight and dragging now write `translate3d` and rotation together instead of changing `left` and `top` on every frame. Grab, drag, release and reduced-motion cancellation were checked.
- **Reserve lazy screenshot space.** The case-study image rule no longer overrides the images' HTML width hints with `width:auto`. Existing width/height metadata now reserves the proper space before decode, while `max-width:100%` keeps them responsive. In the controlled cold desktop load/scroll check, summed unexpected layout-shift entries fell from **0.291217 to 0.000287**; the remaining tiny shift was a font swap. The two large screenshot shifts disappeared. Narrow-screen follow-ups passed in both themes. These are scripted local observations, not field CLS/Core Web Vitals scores.
- **Strengthen light social glyphs.** Apply a consistent darkening to the small light-theme social icons, keeping their colored badge backgrounds.
- **Clean up CV printing.** Both theme selectors now receive the white print palette and light color scheme. The printed footer uses the full available width when the background tree is hidden. Cards print white without filters or shadows.
- **Finish the earlier technology-list cleanup.** Removed two remaining IntelliJ IDEA badges from CV and Projects; Home had already been updated.

## Coverage and results

| Area | Checks and result |
| --- | --- |
| Pages | Home, Projects, CV, About Me, portfolio case study and Browser Games |
| Chromium layouts | All six pages in light/dark at 1440×1000 DPR1 and 390×844 DPR2: 24 configurations, 84 functional assertions passed |
| Firefox layouts | Native Firefox: all six pages in both themes at 1440×1000, plus Home/CV in both themes at 390×844 DPR2; all 19 follow-up assertions passed |
| Navigation | Opacity-only main/footer fades; persistent background/navbar; Back/Forward scroll restoration; rapid theme switches settle on the stored choice |
| Slower CPU simulation | Chromium navigation passed at 6× DevTools CPU slowdown; this is not a physical two-core laptop test |
| Motion | Light mode has no stars; tested dark pools remain below the 600 cap; reduced motion stops twinkles/UFO and skips page fades |
| Static scenery | One river/forest canvas preparation per tested document; **zero extra canvas draw calls caused by scrolling** in all 24 Chromium configurations |
| Interaction | UFO grab/drag/release; all three game preview choices by keyboard; click-away reset; skip link is first keyboard stop and focuses main |
| Loading | No failed local asset requests or page JavaScript errors in the full Chromium check; no moon texture on the fresh light visit |
| Responsive structure | No horizontal overflow in the tested configurations; one main heading per page; 12px technology labels; navbar remains fixed |
| Print | CV white palette, hidden navigation/scenery, unfiltered white cards and full-width footer in both themes |
| Source checks | JavaScript syntax, local asset links/fragments, image dimensions/alt attributes, duplicate IDs, shell syntax and whitespace checks |

Desktop and narrow-screen screenshots were inspected for card separation, headings, portrait position, navigation, scenery and footer clearance. This is a visual/functional review, not a formal accessibility certification. The in-app browser was unavailable, so checks used isolated local browser profiles; personal browser settings were not changed.

## Current shadow and navbar comparison

Native Firefox 159, WebRender, RTX 4070 SUPER, 1920×1080, DPR1. Home light mode at Current technologies. Each temporary CSS variant ran three times in varied order with warmed assets and matching sun/cloud animation times. Scroll samples used the same 3.2-second path. Every sample began and ended visible and focused.

The unit is **whole-browser CPU milliseconds per second** across Firefox subprocesses. 1,000ms/s equals one core's CPU work. These are not GPU usage or presented FPS measurements.

| Temporary variant | Idle CPU ms/s, median [range] | Scroll CPU ms/s, median [range] |
| --- | ---: | ---: |
| Current design | **246 [211–261]** | **577 [566–645]** |
| Remove all box shadows | 209 [205–215] | 572 [569–573] |
| Add small shadows to badges, buttons, social links and utility panels | 254 [234–255] | **690 [588–846]** |
| Remove navbar backdrop blur | 218 [190–380] | 545 [514–590] |

The added shadow was `0 3px 10px rgb(0 0 0 / .14)`. At the stationary test position this increased the visible shadow-bearing element count from 3 to 29. Removing all box shadows had approximately **1% lower median scrolling CPU**, with overlapping ranges. Its lower idle median is not a consistent cross-scenario saving. Adding the small shadows increased median scrolling CPU by approximately **20%**, with substantial variation and overlapping ranges; this is a warning against applying them everywhere, not a prediction for every device or shadow design.

Callback intervals had a 7ms median (about 144Hz) in every sample. Ten intervals exceeded 25ms across all 24 samples, including one 421ms outlier in the *shadows removed* scroll condition. That outlier is retained in the raw data. Callback timing cannot prove that every frame was presented smoothly, and the CPU comparison does not establish a shadow-related FPS drop. The three short repeats do not justify precise device-wide percentage forecasts.

Removing navbar blur gave a roughly 6% lower median scrolling CPU, with overlapping ranges and a noisy idle result. It remains enabled as requested. Do not add these percentages to the older audit's blur savings or treat the two audits as a controlled before/after speedup.

Following this audit, the navbar was changed at the user's request to remove blur at scroll position zero and restore it immediately on scrolling, without animating the filter. The comparisons above used a scrolled navbar and still describe that state. The technologies description was also widened and moved closer to its heading, and the Business/Creative and Development groups exchanged positions.

The tree was subsequently changed from a timed footer reveal to continuous scroll-linked parallax, with a slight leftward adjustment. Its latest tuning starts fully below the viewport and uses quadratic ease-out for a faster early rise that settles toward the footer. Reduced motion places it near the document's footer without parallax. The CPU comparison above predates that tree adjustment; no separate tree CPU percentage is claimed.

## Recommendations

1. **Keep one subtle shadow on the main light cards and restrained hover feedback.** Their existing shadow is a reasonable visual/performance tradeoff. There is no compelling scrolling gain from removing it in this run.
2. **Use tint and borders for badges, social links, code blocks and nested panels.** Avoid putting a blurred shadow on every small element. The many-shadow test added scrolling work even with only a modest 10px blur radius.
3. **Keep movement on transform/opacity.** Avoid animating shadow blur/spread, large glows, or adding multiple stacked shadows to moving artwork. Paint-heavy properties have a different cost from compositor-friendly transforms; see [Google's animation performance guidance](https://web.dev/articles/animations-guide).
4. **Keep the forest/mist composite and bounded stars.** Mist is painted into a static canvas rather than recomputed every frame. Removing the painting would change the design without addressing an idle mist loop.
5. **If the older laptop still needs a lighter setting, reduce continuous background work first.** Fewer moving clouds, a lower decorative canvas density on high-DPR screens, or an optional reduced-effects mode would be sensible next experiments. The remaining navbar blur is another candidate only if its appearance can change. Their combined savings have not been measured here.

The active optimized painting set is about 401KB at 1× and 1.21MB at 2×, before fonts/code/content images and transfer compression. Dark visits still warm the light paintings during idle time to keep the first theme switch cohesive. Loading them only on intent could save unused downloads, at the cost of a slower first switch; this behavior was preserved.

## Evidence and practical limits

- [Chromium full functional check](final-review-2026-11-12/functional-chromium.json) and [source validation](final-review-2026-11-12/static-checks.json). The full run's case-study layout-shift values record the initial finding **before** the image-sizing fix; use the follow-ups below for the corrected result.
- [Firefox functional check](final-review-2026-11-12/functional-firefox.json) and [targeted print/mobile-image/keyboard follow-ups](final-review-2026-11-12/targeted-followup.json).
- Case-study shift traces [before](final-review-2026-11-12/case-shift-before.json) and [after](final-review-2026-11-12/case-shift-after.json).
- [Current CPU comparison](final-review-2026-11-12/firefox-final.json). CPU accounting uses process user/system ticks, start-time guards and children spawned from all Firefox threads; its 10ms tick resolution and transient process exits limit precision.
- [Graphics confirmation](final-review-2026-11-12/graphics.json), [support-page excerpt](final-review-2026-11-12/graphics-followup.json) and [local light-load resource trace](final-review-2026-11-12/load-firefox-index-light.json). The first benchmark support-page probe ran before the graphics table populated; the follow-up confirms WebRender and the hardware in the same isolated launch setup. Firefox's sanitized WebGL renderer string is not the hardware identity.

Tests used the local server and a desktop GPU. Network timings do not represent GitHub Pages or a slow visitor connection, and no production Lighthouse/field Core Web Vitals score is claimed. Real laptop touchpad overscroll and compositor presentation still need judgment in that browser window. The oldest laptop's battery and thermal behavior were not measured. Historical portfolio copies were not edited. Changes are local and have not been pushed by this review.
