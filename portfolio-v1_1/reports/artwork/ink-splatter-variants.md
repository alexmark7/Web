# Distinct ink splotches

Updated 2026-11-12 using the built-in image-generation tool, in generate mode with the original splatter as a style reference and transparent background enabled.

The original pointed splatter remains on the left. The next small splotch uses a separate rounded, two-lobed pigment bloom with a broken brush edge and scattered droplets. These two paintings alternate across the fixed ink layer; placement, opacity, mark count and scrolling behavior are unchanged.

- [New master](../../assets/scenery/watercolor-ink-splatter-02.webp): 512 × 512 transparent lossless WebP, downscaled from the 1254 × 1254 generated PNG.
- [Normal display export](../../images/optimized/watercolor-ink-splatter-02.webp): 256 × 256, 17,102 bytes.
- [High-density display export](../../images/optimized/watercolor-ink-splatter-02@2x.webp): 512 × 512, 51,440 bytes.

Both display exports use quality 82 and the existing scenery rebuild script. The theme loader decodes the appropriate density before revealing light mode. The additional static texture introduces no animation, blur, shadow or new DOM elements.

Visual checks passed on Home and About at 1440px, and Home at 390px with 2× density. Both paint shapes appeared correctly, the appropriate new export loaded, and no missing assets, JavaScript errors or horizontal overflow were found. JavaScript syntax, shell syntax and whitespace checks passed. No new performance benchmark was needed for this static asset change.

## Generation prompt

Create ONE new transparent watercolor ink blot asset for a Japanese watercolor portfolio website. Use the attached ink splatter ONLY as a reference for the natural gray pigment granulation, softness and handmade watercolor character. The new silhouette must be clearly DIFFERENT from the reference: a loose, low, horizontally stretched bean-shaped pigment bloom with two overlapping rounded lobes, an uneven scalloped wet edge, a dry-brush break across one side and a few separated round droplets clustered asymmetrically toward the upper right. Avoid the reference's spiky radial starburst shape and diagonal sprayed streaks. The main bloom should be about twice as wide as it is tall, with rich charcoal gray pooled at the left and lighter feathery gray to the right. Organic, accidental, delicate watercolor on imaginary paper, but all paper/background pixels must be genuinely transparent. Square canvas, centered with at least 12 percent clear margin around the full mark and droplets. No actual paper rectangle, white halo, scenery, objects, text, frame, shadow, signature or watermark. Keep enough pigment detail to remain recognizable when displayed faintly at 80–140 pixels wide.
