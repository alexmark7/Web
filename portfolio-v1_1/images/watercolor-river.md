# Broad watercolor river with miniature village details

- [watercolor-river.webp](watercolor-river.webp): 2172 × 724, transparent WebP, quality 0.9. Broad, sinuous blue water and soft natural banks.
- [watercolor-river-hamlets.webp](watercolor-river-hamlets.webp): 768 × 256, three distinct transparent square vignettes. Each is displayed at only 18–32px, independently of the river's width, so the houses and trees remain tiny relative to the mountains.
- Both paintings were created with the built-in imagegen tool, then encoded as WebP with transparency preserved.
- The village vignettes are anchored on the dry far bank and central island, clear of the water.
- Six faint blue-tinted brush strokes and pigment blooms reuse the existing ink artwork around the banks, helping the river blend into the paper.
- The river starts at 12vw (10vw on mobile), spans 112vw, and is clamped to 800–2200px wide. Its complete transparent painting is foreshortened to 15% of the mountain's width, making the visible water roughly two thirds shallower on desktop. This keeps a long, distant stream in scale with the mountain instead of a broad foreground river. Houses and trees retain their natural proportions, and the blue pigment marks are correspondingly smaller.
- The source blends into the mountain over the leftmost 24%. The river, its pigment marks, tiny details, mountains, sun and mist share the same gentle 4vh scroll drift.
- The previous 38–64px lower placement is preserved, with a smaller offset on short screens. Everything in this layer is hidden in dark mode and when printing.

## River generation prompt

```text
Use case: precise-object-edit. Image 1 is the river edit target; image 2 is the WATERCOLOR STYLE reference.
Repaint image 1 as a broad, winding watercolor river and natural banks ONLY. REMOVE every house and every tree; those will be added separately at an accurately tiny scale on the webpage.
Make the WATER CHANNELS about THREE TIMES WIDER than in the reference, while keeping the overall panoramic landscape small in scale beside the reference mountains. Emphasize flowing blue water, not a miniature village illustration. A strong, irregular S-shaped main course crosses the scene left to right, with one broad sweeping bend and a tighter asymmetric bend, plus a single smaller secondary channel around one uneven sandy island. No repeating oval islands, parallel waves, identical bends or decorative repeat rhythm. Shorelines should follow terrain plausibly; no water cutting across dry bank patches.
Keep a wide 3:1 TRANSPARENT canvas, with the painting concentrated around the lower-middle band. Main meanders should stay roughly between 48% and 65% of canvas height; the wider water and banks should remain within the middle part of the image and clear of the outer top and bottom edges. Let water continue off the left and right edges.
Match image 2's actual loose Japanese watercolor style: transparent wet-on-wet cerulean and muted slate-blue washes, irregular granulation, softly bleeding edges, pale mist, delicate paper-like pigment variation only inside the painted areas. Gentle blue pools and white-paper reflections should show flowing water. Soft sage/earth ochre banks, varied and asymmetrical. No crisp ink outline, vector shape, photorealism, glossy 3D, sharp miniature-model finish or hard shoreline ribbon.
The leftmost quarter must merge into very soft gray-green foothill mist and dissolve organically into alpha, matching the existing mountains. Preserve plenty of real transparent negative space above and below; no large white fog rectangle, paper background, rectangular cutout, border or bright fringe.
No trees, buildings, rooftops, shrubs shaped like trees, people, animals, boats, bridges, sun, moon, clouds, words, logos, signature or watermark. Output a genuinely transparent watercolor river-and-banks asset only.
```

## Village details generation prompt

```text
Use case: stylized-concept. Asset type: a transparent watercolor sprite sheet for TINY distant Edo-style riverside homesteads in a Japanese-inspired portfolio landscape.
The supplied mountain painting is a STYLE reference only. Match its loose, atmospheric wet-on-wet watercolor, muted sage, slate, charcoal and earth palette, soft uneven pigment, and organically feathered transparent edges.
Create ONE wide 3:1 canvas containing THREE DIFFERENT isolated homestead vignettes, in THREE EQUAL SQUARE CELLS side by side. Each vignette is completely inside its own cell, centered with generous transparent margins. No separators, no cell borders, no connecting landscape or water.
LEFT CELL: one low dark-timber Edo-style dwelling with a broad charcoal-gray pitched gable roof, a single irregular olive leafy tree to its left, and tiny foliage dabs.
MIDDLE CELL: one narrower pale-plaster-and-wood Edo-style house seen from another angle, with a small windswept pine to its right.
RIGHT CELL: one modest weathered wooden dwelling with a lower brown-gray roof and a slim leaning riverside tree; vary the silhouette, orientation, spacing and canopy shape from the other two.
Use believable simple traditional Japanese architecture, no pagoda, temple tower, torii gate or modern building. Trees and houses rest on small dry-earth washes that dissolve into transparency; no water anywhere and no roots hanging in space. Keep all ground baselines near the same height in each cell, around 85% of cell height.
These will display at about 25–35 pixels per cell: use soft legible roof and foliage silhouettes, NO fussy windows, tile grids, harsh black outlines, sharp vector edges, miniature-model rendering or photo detail. The result should read as loose little brush marks in a distant mountain valley.
GENUINELY TRANSPARENT background, including the entire gaps between cells and every canvas corner. No white paper, black matte, opaque rectangle, text, labels, signs, numbers, logos, signatures, watermark, people, animals, sun, moon, clouds or mountains.
```
