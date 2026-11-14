# Scenery performance improvements — 14 November 2026

Implemented the first four recommendations from the performance audit. The artwork, theme fade, and different bird/cloud scroll speeds remain in place.

## Changes

1. **Phone image sizing.** At viewport widths up to 600px and pixel densities up to 2, clouds, the sun, and the foreground tree use the existing smaller exports. Higher-density phones and larger screens retain the larger sources. CSS and the theme preloader select matching files; the viewport declaration precedes the theme script on every page.
2. **Defer the unused light scene.** An idle dark visit no longer downloads light paintings or builds the forest. Pointer/keyboard intent at the theme toggle may warm images, except on reported Save-Data/2G connections. The canvas starts only when light mode is requested. Its sources load alongside the sky, and switching waits for decoded artwork and the finished canvas. A second click can cancel a pending switch.
3. **Adaptive forest resolution.** The backing canvas is capped at 1.5× on compact/touch screens or devices reporting at most four hardware threads or 4GB RAM. Devices reporting at most two threads or 2GB use a 1× cap. Other desktops retain the previous maximum of 2×. These optional hints guide quality; they are not speed measurements. Geometry, caching and resize debouncing are preserved, and shared source images reuse the CSS downloads.
4. **Baked mist/ink filters.** Separate transparent WebP exports contain the former fixed filters. Both mist layers keep 40% opacity, placement and stacking. Phone/desktop and density variants preserve softness without live filtering. See [asset generation and comparison notes](artwork/baked-scenery-filters.md).

## Measured loading and memory changes

Cold local-browser comparisons, using the same page and device settings:

| Scenario | Before | After |
| --- | ---: | ---: |
| Phone 390×844, DPR 2: scenery image bodies | 1,271,848 bytes | 780,220 bytes |
| Same phone: forest backing canvas | 780×378 pixels | 585×284 pixels |
| Idle dark phone: light scenery image bodies | 1,271,848 bytes | 0 bytes |
| Idle dark phone: forest built | Yes | No |

The phone scenery download is **38.7% smaller**, including the baked effects. Its forest canvas uses approximately **44% fewer pixels**. At the 1× cap, a canvas uses 75% fewer pixels than 2× at the same CSS dimensions.

The baked assets add 18–48KB per phone visit and 33–88KB per desktop visit. They trade a small download increase for removing live filters; desktop scenery downloads therefore increase slightly. Static blur also scales a little between the reference export sizes. The original cloud/splatter textures remain necessary elsewhere.

## Verification and limits

- Chromium and Firefox: initial light/dark loads, expected image variants, ready forest and no live mist/ink filters.
- Chromium: slow-network/CPU first switch, cancellation and retry, viewport/density changes, no missing local resources or script errors.
- Ten focused device/cache scenarios: density caps, shared image choices, pending/painted reuse, resizing and DPR changes.
- Desktop and phone screenshots inspected. Baked exports also compared against the original native filters at both reference sizes/densities; maximum composited channel difference was 2/255.
- JavaScript syntax, CSS resource references and whitespace checks passed.

The automated Chromium browser uses software rendering. These checks establish loading, memory allocation, functionality and appearance, not a particular FPS gain on a physical older laptop or phone. No low-effects mode was added.
