/* One static painting for the river, villages and woodland foreground. */
(() => {
  "use strict";

  const imageDirectory = new URL("../images/optimized/", document.currentScript.src);
  const decodedImages = new Map();
  const clamp = (minimum, value, maximum) => Math.max(minimum, Math.min(value, maximum));
  const mix = (start, end, amount) => start + (end - start) * amount;

  function loadPainting(name, density) {
    const url = new URL(`${name}${density > 1 ? "@2x" : ""}.webp`, imageDirectory).href;
    if (!decodedImages.has(url)) {
      decodedImages.set(url, (async () => {
        const image = new Image();
        image.decoding = "async";
        image.src = url;
        try {
          await image.decode();
          return image;
        } catch {
          // A missing decoration must not prevent the rest of the page opening.
          return null;
        }
      })());
    }
    return decodedImages.get(url);
  }

  function makeLayer(width, height, density) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(width * density));
    canvas.height = Math.max(1, Math.ceil(height * density));
    const context = canvas.getContext("2d");
    context.setTransform(density, 0, 0, density, 0, 0);
    context.imageSmoothingQuality = "high";
    return { canvas, context };
  }

  function sceneryDensity(width) {
    const cores = navigator.hardwareConcurrency || 0;
    const memory = navigator.deviceMemory || 0;
    // These optional hints select a conservative cap, never a guessed FPS.
    // Small screens need fewer backing pixels for the same watercolor detail.
    const limited = (cores > 0 && cores <= 4) || (memory > 0 && memory <= 4);
    const veryLimited = (cores > 0 && cores <= 2) || (memory > 0 && memory <= 2);
    const compact = width <= 1024 || window.portfolioViewport.mobile;
    const cap = veryLimited ? 1 : compact || limited ? 1.5 : 2;
    return clamp(1, window.devicePixelRatio || 1, cap);
  }

  function measureScene(background) {
    const width = Math.max(1, document.documentElement.clientWidth);
    const height = Math.max(1, window.portfolioViewport.height);
    // Native app bars can expose more space than the initial large viewport.
    // Paint below it in advance without moving or rescaling the visible scene.
    const coverageHeight = window.portfolioViewport.mobile
      ? Math.max(height, window.screen.height) : height;
    const scenery = getComputedStyle(background);
    const mobileBlend = clamp(0, Number.parseFloat(scenery.getPropertyValue("--scenery-mobile")) || 0, 1);
    const shortBlend = clamp(0, Number.parseFloat(scenery.getPropertyValue("--scenery-short")) || 0, 1);
    const layoutWidth = window.innerWidth || width;
    const mountain = getComputedStyle(background, "::before");
    const normalWidth = mix(clamp(640, layoutWidth * 0.88, 1200), 760, mobileBlend);
    const mountainWidth = Number.parseFloat(mountain.width)
      || mix(normalWidth, Math.min(layoutWidth * 0.88, height), shortBlend);
    const measuredLeft = Number.parseFloat(mountain.left);
    const mountainLeft = Number.isFinite(measuredLeft)
      ? measuredLeft : mix(mix(layoutWidth * -0.08, -150, mobileBlend), layoutWidth * -0.08, shortBlend);
    const designWidth = clamp(800, width * 1.12, 2200);
    const riverHeight = mountainWidth * 0.15;
    const drop = mix(clamp(38, width * 0.04, 64), 12, shortBlend);
    const bottom = height * mix(0.08, -0.04, shortBlend)
      - drop + designWidth / 12 - riverHeight / 2;
    const top = height - bottom - riverHeight;
    // Match the shared CSS sources even when the canvas uses a lower cap.
    // Keep these variants in the geometry key for monitor/zoom changes too.
    const inkDensity = window.devicePixelRatio > 1 ? 2 : 1;
    const cloudDensity = window.matchMedia("(max-width: 600px) and (max-resolution: 2dppx)").matches
      ? 1 : inkDensity;
    return {
      width,
      height,
      top,
      sceneHeight: Math.max(1, coverageHeight + height * 0.04 + 2 - top),
      mountainWidth,
      mountainLeft,
      mobileBlend,
      riverLeft: width * mix(0.12, 0.10, mobileBlend),
      riverWidth: Math.max(designWidth, width * 0.88 + 32),
      riverHeight,
      density: sceneryDensity(width),
      inkDensity,
      cloudDensity,
    };
  }

  function drawWater(context, image, geometry) {
    if (!image) return;
    const { riverLeft: left, riverWidth: width, riverHeight: height, density } = geometry;
    const layer = makeLayer(width, height, density);
    layer.context.drawImage(image, 0, 0, width, height);
    layer.context.globalCompositeOperation = "destination-in";
    const blend = layer.context.createLinearGradient(0, 0, width, 0);
    blend.addColorStop(0, "rgba(0,0,0,0)");
    blend.addColorStop(0.08, "rgba(0,0,0,0.35)");
    blend.addColorStop(0.24, "#000");
    blend.addColorStop(1, "#000");
    layer.context.fillStyle = blend;
    layer.context.fillRect(0, 0, width, height);
    context.drawImage(layer.canvas, left, 0, width, height);
  }

  function drawPigment(context, paintings, geometry) {
    const { riverLeft: left, riverWidth: width, riverHeight: height } = geometry;
    for (const [index, x, y, size, rotation] of [
      [0, 22, 40, 9, -12], [1, 32, 80, 12, 8], [2, 49, 34, 7, 28],
      [3, 64, 43, 12, -7], [4, 72, 76, 6, -34], [5, 85, 67, 11, 11],
    ]) {
      const stroke = index % 2 === 1;
      const image = paintings[stroke ? "stroke" : "splatter"];
      if (!image) continue;
      const paintWidth = width * size / 100;
      const paintHeight = stroke ? paintWidth / 3 : paintWidth;
      context.save();
      context.translate(left + width * x / 100, height * y / 100);
      context.rotate(rotation * Math.PI / 180);
      context.globalAlpha = stroke ? 0.11 : 0.075;
      context.filter = "brightness(0) invert(48%) sepia(17%) saturate(1133%) hue-rotate(160deg) blur(0.6px)";
      context.drawImage(image, -paintWidth / 2, -paintHeight / 2, paintWidth, paintHeight);
      context.restore();
    }
  }

  function drawBankDetails(context, image, geometry) {
    if (!image) return;
    const { width, mountainWidth, riverLeft, riverWidth, riverHeight } = geometry;
    // Three house cells followed by three individual watercolor trees.
    const cellWidth = image.naturalWidth / 6;
    const drawCell = (index, left, top, size, anchor, opacity) => {
      context.save();
      context.globalAlpha = opacity;
      context.drawImage(image, index * cellWidth, 0, cellWidth, cellWidth,
        riverLeft + riverWidth * left / 100 - size / 2,
        riverHeight * top / 100 - size * anchor, size, size);
      context.restore();
    };
    const houseSize = clamp(18, width * 0.021, 32);
    for (const [index, left, top] of [[0, 36.4, 47.65], [1, 47.9, 55.39], [2, 71.8, 57.32]]) {
      drawCell(index, left, top, houseSize, 0.76, 0.86);
    }
    const treeSize = clamp(16, mountainWidth * 0.022, 27);
    // Irregular, stable positions follow dry ground around the river's bends
    // and central island. Each coordinate anchors the visible trunk's foot.
    for (const [index, left, top, size] of [
      [0, 16.1, 56.5, 0.88], [1, 18.3, 45, 0.96],
      [0, 25.2, 45, 0.84], [2, 28.6, 47, 0.92],
      [0, 30.7, 45, 1], [1, 38.2, 54, 0.86],
      [0, 40.1, 48.5, 0.94], [2, 46.9, 46.7, 0.9],
      [0, 49.6, 44.8, 0.96], [1, 56.8, 42.5, 0.9],
      [0, 62.7, 44.5, 0.84], [1, 64.3, 45.8, 0.82],
      [0, 72.8, 59.5, 0.9], [0, 77.6, 56.5, 0.86],
      [1, 79.2, 60, 0.98], [2, 86.7, 54, 0.9],
      [0, 92.4, 51.2, 0.94], [1, 94.2, 51.8, 0.98],
      [1, 43.5, 58, 0.92], [0, 48.5, 56, 1],
      [2, 52.7, 55, 0.86],
    ]) {
      drawCell(index + 3, left, top, treeSize * size, 0.82, 0.88);
    }
  }

  function makeGrove(image, paintWidth, density) {
    const width = paintWidth * 0.7;
    const height = paintWidth / 3;
    const layer = makeLayer(width, height, density);
    // Every tile uses the low right canopy. The taller left slope belongs to
    // a different landscape and would put trees partway up this mountain.
    layer.context.drawImage(image, image.naturalWidth * 0.3, 0,
      image.naturalWidth * 0.7, image.naturalHeight, 0, 0, width, height);
    layer.context.globalCompositeOperation = "destination-in";
    const edges = layer.context.createLinearGradient(0, 0, width, 0);
    edges.addColorStop(0, "rgba(0,0,0,0)");
    edges.addColorStop(0.09, "#000");
    edges.addColorStop(0.85, "#000");
    edges.addColorStop(1, "rgba(0,0,0,0)");
    layer.context.fillStyle = edges;
    layer.context.fillRect(0, 0, width, height);
    return { ...layer, width, height };
  }

  function drawForestMist(context, image, geometry) {
    if (!image) return;
    const { width, height, top, mountainWidth, riverHeight, mobileBlend } = geometry;
    const mist = makeLayer(image.naturalWidth, image.naturalHeight, 1);
    mist.context.drawImage(image, 0, 0);
    mist.context.globalCompositeOperation = "source-in";
    mist.context.fillStyle = "#f8faf4";
    mist.context.fillRect(0, 0, mist.canvas.width, mist.canvas.height);

    // Fade the whole footprint, including the cloud's flatter underside. A
    // rounded taper avoids a visible rectangle or a straight end in the trees.
    mist.context.globalCompositeOperation = "destination-in";
    mist.context.save();
    mist.context.translate(mist.canvas.width / 2, mist.canvas.height / 2);
    mist.context.scale(mist.canvas.width / 2, mist.canvas.height / 2);
    const feather = mist.context.createRadialGradient(0, 0, 0, 0, 0, 1);
    feather.addColorStop(0, "#000");
    feather.addColorStop(0.25, "#000");
    feather.addColorStop(0.70, "rgba(0,0,0,0.5)");
    feather.addColorStop(1, "rgba(0,0,0,0)");
    mist.context.fillStyle = feather;
    mist.context.fillRect(-1, -1, 2, 2);
    mist.context.restore();

    const bankY = riverHeight * 0.60;
    // Overscan extends the forest below the screen, not the mist composition.
    const depth = height * 1.04 + 2 - top - bankY;
    const paintWidth = Math.min(width * 0.78, mountainWidth * 0.90);
    const paintHeight = Math.min(paintWidth * 0.12, Math.max(18, depth * 0.40));
    // The same wisps slide and soften between layouts; none abruptly appear
    // or change position when the viewport crosses the old phone breakpoint.
    const wisps = [
      [mix(0.04, -0.12, mobileBlend), mix(0.06, 0.10, mobileBlend),
        mix(0.92, 1, mobileBlend), mix(1.10, 1.15, mobileBlend),
        mix(0.17, 0.16, mobileBlend), false, mix(-1.2, -1.1, mobileBlend)],
      [mix(0.59, 0.42, mobileBlend), mix(0.29, 0.50, mobileBlend),
        mix(0.88, 0.84, mobileBlend), mix(1.05, 1, mobileBlend),
        mix(0.15, 0.12, mobileBlend), true, mix(1.7, 1.5, mobileBlend)],
      [0.18, 0.65, 0.70, 1, 0.10 * (1 - mobileBlend), true, -1.8],
    ];

    // Tint existing tree pixels rather than making the woodland transparent.
    // The finished mist is part of the same static painting as the river.
    context.save();
    context.globalCompositeOperation = "source-atop";
    for (const [x, y, scaleX, scaleY, opacity, reverse, angle] of wisps) {
      if (!opacity) continue;
      const w = paintWidth * scaleX;
      const h = paintHeight * scaleY;
      context.save();
      context.globalAlpha = opacity;
      context.translate(width * x + w / 2, bankY + depth * y + h / 2);
      context.rotate(angle * Math.PI / 180);
      context.scale(reverse ? -1 : 1, 1);
      context.drawImage(mist.canvas, -w / 2, -h / 2, w, h);
      context.restore();
    }
    context.restore();
  }

  function drawForest(context, image, mist, geometry) {
    if (!image) return;
    const { width, height, top, sceneHeight, riverHeight, mountainWidth, mountainLeft, density } = geometry;
    const woodland = makeLayer(width, sceneHeight, density);
    const drops = [0, 0.018, 0.008, 0.027, 0.014, 0.023, 0.01];
    const groves = new Map();
    const drawRow = (paintWidth, y, rowIndex, opacity) => {
      if (!groves.has(paintWidth)) groves.set(paintWidth, makeGrove(image, paintWidth, density));
      const grove = groves.get(paintWidth);
      // Overlap beyond both edge fades so the paper backing cannot expose a
      // pale vertical join between neighboring groves.
      const step = paintWidth * 0.48;
      const offset = -step * (rowIndex % 2 ? 0.43 : 0.12);
      woodland.context.save();
      woodland.context.globalAlpha = opacity;
      for (let index = -1; offset + index * step < width; index++) {
        const x = offset + index * step;
        const drop = drops[((index + rowIndex) % drops.length + drops.length) % drops.length];
        const reverse = ((index + rowIndex) % 3 + 3) % 3 === 0;
        woodland.context.save();
        woodland.context.translate(x + (reverse ? grove.width : 0), y + paintWidth * drop);
        woodland.context.scale(reverse ? -1 : 1, 1);
        woodland.context.drawImage(grove.canvas, 0, 0, grove.width, grove.height);
        woodland.context.restore();
      }
      woodland.context.restore();
    };
    // A low rear canopy bridges the pale gaps between the winding bank and
    // the larger groves. The shared contour still keeps it off the mountain.
    const bankWidth = mountainWidth * 0.34;
    drawRow(bankWidth, riverHeight * 0.54 - bankWidth * 0.14, 3, 0.60);
    const farWidth = mountainWidth * 0.40;
    drawRow(farWidth, riverHeight * 0.63 - farWidth * 0.14, 0, 0.64);
    const nearWidth = mountainWidth * 0.48;
    const firstRow = riverHeight * 0.76 - nearWidth * 0.14;
    const verticalStep = nearWidth * 0.075;
    for (let y = firstRow, row = 1; y < sceneHeight; y += verticalStep, row++) {
      drawRow(nearWidth, y, row, 0.94);
    }

    // Back painted tree interiors with the paper tone, keeping their original
    // watercolor colour while preventing scenery from showing through them.
    // Sparse outer pigment still fades gently; true gaps remain transparent.
    const pixels = woodland.context.getImageData(0, 0, woodland.canvas.width, woodland.canvas.height);
    const paper = [250, 248, 243];
    for (let index = 0; index < pixels.data.length; index += 4) {
      const alpha = pixels.data[index + 3] / 255;
      if (!alpha) continue;
      const backedAlpha = Math.min(1, alpha / 0.30);
      const pigment = alpha / backedAlpha;
      for (let channel = 0; channel < 3; channel++) {
        pixels.data[index + channel] = pixels.data[index + channel] * pigment
          + paper[channel] * (1 - pigment);
      }
      pixels.data[index + 3] = Math.round(backedAlpha * 255);
    }
    woodland.context.putImageData(pixels, 0, 0);

    drawForestMist(woodland.context, mist, geometry);

    // The top contour meets the mountain's foot, then follows the near bank.
    // Downward rows retain their size and fill the whole foreground, including
    // the extra area revealed by the shared mountain/river scroll movement.
    const mask = makeLayer(width, sceneHeight, density);
    const footX = Math.min(width * 0.78, Math.max(width * 0.20, mountainWidth * 0.64 + mountainLeft));
    const bankY = riverHeight * 0.60;
    const leftBaseY = Math.max(bankY, height - top - 30);
    mask.context.fillStyle = "#000";
    mask.context.filter = "blur(5px)";
    mask.context.beginPath();
    mask.context.moveTo(-12, leftBaseY);
    mask.context.bezierCurveTo(footX * 0.20, leftBaseY,
      footX * 0.62, bankY, footX, bankY);
    mask.context.lineTo(width + 12, bankY);
    mask.context.lineTo(width + 12, sceneHeight + 12);
    mask.context.lineTo(-12, sceneHeight + 12);
    mask.context.closePath();
    mask.context.fill();
    woodland.context.save();
    woodland.context.globalCompositeOperation = "destination-in";
    woodland.context.drawImage(mask.canvas, 0, 0, width, sceneHeight);
    woodland.context.restore();
    context.drawImage(woodland.canvas, 0, 0, width, sceneHeight);
  }

  window.createPortfolioRiverScene = (background) => {
    const canvas = document.createElement("canvas");
    canvas.className = "watercolor-river";
    canvas.setAttribute("aria-hidden", "true");
    let generation = 0;
    let pendingKey = "";
    let paintedKey = "";
    let pending = Promise.resolve();
    let resizeTimer = 0;

    canvas.prepareScenery = () => {
      const geometry = measureScene(background);
      const key = JSON.stringify(geometry);
      if (key === paintedKey) {
        // A resize can return to the already-painted size while a different
        // size is still decoding. Keep that older request from replacing it.
        if (pendingKey && pendingKey !== key) {
          generation++;
          pendingKey = "";
          pending = Promise.resolve();
        }
        return Promise.resolve();
      }
      if (key === pendingKey) return pending;
      const request = ++generation;
      pendingKey = key;
      pending = (async () => {
        const [water, forest, details, stroke, splatter, mist] = await Promise.all([
          loadPainting("watercolor-river", geometry.density),
          loadPainting("watercolor-river-forest-autumn", geometry.density),
          loadPainting("watercolor-river-details", geometry.density),
          loadPainting("watercolor-ink-stroke", geometry.inkDensity),
          loadPainting("watercolor-ink-splatter", geometry.inkDensity),
          loadPainting("watercolor-cloud-06", geometry.cloudDensity),
        ]);
        if (request !== generation) return pending;
        const painting = makeLayer(geometry.width, geometry.sceneHeight, geometry.density);
        drawWater(painting.context, water, geometry);
        drawPigment(painting.context, { stroke, splatter }, geometry);
        drawBankDetails(painting.context, details, geometry);
        drawForest(painting.context, forest, mist, geometry);
        if (request !== generation) return pending;
        canvas.width = painting.canvas.width;
        canvas.height = painting.canvas.height;
        canvas.style.top = `${geometry.top}px`;
        canvas.style.width = `${geometry.width}px`;
        canvas.style.height = `${geometry.sceneHeight}px`;
        canvas.getContext("2d").drawImage(painting.canvas, 0, 0);
        canvas.dataset.sceneReady = "true";
        canvas.dataset.painted = "true";
        paintedKey = key;
      })().finally(() => {
        if (request === generation) pendingKey = "";
      });
      return pending;
    };

    const refreshVisibleScene = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = 0;
      if (document.documentElement.dataset.theme === "light") canvas.prepareScenery().catch(() => {});
    };
    // Keep the existing painting during a resize gesture. The expensive forest
    // composite only needs the final size; explicit theme preparation stays immediate.
    document.addEventListener("portfolio-viewport-change", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(refreshVisibleScene, 120);
    });
    document.addEventListener("portfolio-theme-change", refreshVisibleScene);
    window.addEventListener("pagehide", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = 0;
    });
    window.addEventListener("pageshow", refreshVisibleScene);
    return canvas;
  };
})();
