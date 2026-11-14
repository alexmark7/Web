# Baked scenery filters — 14 November 2026

The sun mist and broad paper ink washes now have separate transparent display exports. These are deterministic derivatives of the existing painted images, with the former CSS filters rendered into their pixels. No artwork was regenerated.

Sources:

- `images/optimized/watercolor-cloud-06.webp` and `watercolor-cloud-06@2x.webp`: mist silhouette and pigment.
- `images/optimized/watercolor-ink-splatter.webp` and `watercolor-ink-splatter@2x.webp`: broad ink washes. The ordinary splatters continue to use their original images.

Exports use native Chromium Canvas2D filtering, followed by WebP encoding at quality 82, method 6, and lossless alpha. Mist receives `grayscale(1) brightness(1.65) blur(3px)`; ink receives `blur(2px) sepia(0.2)`. The PNG intermediates and comparison screenshots were temporary audit artifacts, rather than deployed resources.

## Geometry and density

Mist is rendered after stretching the cloud to each veil's actual proportions. Upper and lower veils have separate files so that their different aspect ratios receive the same circular blur. Desktop mist uses a reference sun size of 456 CSS pixels; the phone exports use 200 CSS pixels. Each side includes nine CSS pixels of transparent padding, avoiding clipping of the three-pixel Gaussian blur. At 2× density the content dimensions, padding and filter radius all double. Canvas filters use backing-store pixel lengths, so their blur radius must be multiplied explicitly by the output density.

Integration retains the mist's 40% opacity, centre, layer order and scroll movement. Add 18px to each original element dimension and subtract 9px from its top; the unchanged horizontal `translate(-50%)` keeps the content centred. Select the `-phone` files at widths up to 600px. Since the softness is baked into static pixels, its radius scales slightly as the artwork is resized between the reference sizes.

Ink already has ample transparent source margins and receives **no extra padding**. Keep its existing square aspect ratio and `background-size: contain`. The desktop reference wash is 512 CSS pixels wide, exported at its original 256/512-pixel bitmap densities. The phone reference is 256 CSS pixels, exported at 256/512 bitmap pixels. Their original low, variable element opacity is retained.

| Export | Dimensions | Bytes |
| --- | --- | ---: |
| `watercolor-sun-mist.webp` | 839 × 155 | 13,382 |
| `watercolor-sun-mist@2x.webp` | 1,678 × 310 | 40,982 |
| `watercolor-sun-mist-lower.webp` | 497 × 100 | 6,594 |
| `watercolor-sun-mist-lower@2x.webp` | 994 × 200 | 19,346 |
| `watercolor-sun-mist-phone.webp` | 378 × 78 | 4,630 |
| `watercolor-sun-mist-phone@2x.webp` | 756 × 156 | 12,590 |
| `watercolor-sun-mist-lower-phone.webp` | 228 × 54 | 2,296 |
| `watercolor-sun-mist-lower-phone@2x.webp` | 456 × 108 | 6,516 |
| `watercolor-ink-wash.webp` | 256 × 256 | 12,732 |
| `watercolor-ink-wash@2x.webp` | 512 × 512 | 27,730 |
| `watercolor-ink-wash-phone.webp` | 256 × 256 | 11,214 |
| `watercolor-ink-wash-phone@2x.webp` | 512 × 512 | 29,222 |

All twelve files together occupy 187,234 bytes. A visit selects one set of three: 32,708 bytes on desktop at 1×, 88,058 at 2×, 18,140 on phones at 1×, or 48,328 at 2×. These files add download bytes in exchange for removing live filtering; the original cloud and splatter images are still needed by other scenery.

## Verification

- Every encoded image's alpha channel matches its filtered PNG exactly.
- Native CSS-filter screenshots were compared with the baked images in Chromium at both densities and both reference geometries. At 40% mist opacity, the maximum channel difference was 2/255 and the mean difference stayed below 0.05/255. The ink comparisons at 6% opacity had maximum differences of 1–2/255 and means below 0.09/255.
- The upper mist's before/after comparison was visually inspected. Colour, feathered silhouette and transparent boundaries are retained.
- These checks establish appearance at the reference geometries. They do not establish a particular frame-rate improvement on slower hardware.
