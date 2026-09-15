/* Standalone extraction of the portfolio's flickering star field.
 * No scroll listener, moon renderer, content files or libraries are needed. */
(() => {
  "use strict";
  const display = document.getElementById("ascii-stars");
  if (!display) return;

  // Change these values to customise the star field.
  const SETTINGS = {
    characters: [".", "·", ":", "*", "+"],
    starFraction: 0.018, // Approximately 1.8% of grid cells contain stars.
    pulseMilliseconds: 180,
    changeFraction: 0.035, // Change 3.5% of stars on each pulse.
    targetCells: 11500, // Approximate work budget, not a strict cell limit.
    resizeDelay: 120,
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const measure = document.createElement("canvas").getContext("2d");
  let columns = 0;
  let rows = 0;
  let cells = [];
  let stars = [];
  let cursor = 0;
  let needsGrid = true;
  let frameId = 0;
  let pulseTimer = 0;
  let resizeTimer = 0;

  // Identical coordinates produce identical values: stars do not jump randomly.
  function hash(x, y, seed = 0) {
    const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function rebuildGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const naturalSize = Math.max(8, Math.min(12, width * 0.007));
    const fittedSize = Math.sqrt((width * height) / (SETTINGS.targetCells * 0.6 * 0.86));
    display.style.fontSize = `${Math.max(naturalSize, fittedSize)}px`;
    const style = getComputedStyle(display);
    const fontSize = Number.parseFloat(style.fontSize);
    // Measure real font width; retain a fallback if a canvas context is unavailable.
    if (measure) measure.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
    const cellWidth = measure?.measureText("M").width || fontSize * 0.6;
    const cellHeight = Number.parseFloat(style.lineHeight) || fontSize * 0.86;
    columns = Math.max(34, Math.floor(width / cellWidth) + 1);
    rows = Math.max(26, Math.floor(height / cellHeight) + 1);
    cells = new Array(columns * rows).fill(" ");
    stars = [];
    cursor = 0;

    for (let index = 0; index < cells.length; index++) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      if (hash(column * 0.73, row * 1.37, 9) > 1 - SETTINGS.starFraction) {
        const glyph = Math.floor(hash(column, row, 12) * SETTINGS.characters.length);
        stars.push({ index, glyph });
        cells[index] = SETTINGS.characters[glyph];
      }
    }

    // Shuffle once so successive samples are spread across the screen.
    // This avoids the visible top-to-bottom update sweep of row-ordered stars.
    for (let i = stars.length - 1; i > 0; i--) {
      const j = Math.floor(hash(i, columns, 91) * (i + 1));
      [stars[i], stars[j]] = [stars[j], stars[i]];
    }
    needsGrid = false;
  }

  function flicker() {
    if (!stars.length) return;
    const changes = Math.min(stars.length, Math.max(1, Math.ceil(stars.length * SETTINGS.changeFraction)));
    for (let i = 0; i < changes; i++) {
      const star = stars[cursor++ % stars.length];
      // The original five-symbol cycle advances by two. Other ramp lengths
      // advance by one so every supplied symbol remains reachable.
      const step = SETTINGS.characters.length === 5 ? 2 : 1;
      star.glyph = (star.glyph + step) % SETTINGS.characters.length;
      cells[star.index] = SETTINGS.characters[star.glyph];
    }
  }

  function draw() {
    const lines = new Array(rows);
    for (let row = 0; row < rows; row++) {
      lines[row] = cells.slice(row * columns, (row + 1) * columns).join("");
    }
    // One assignment replaces the WHOLE frame. No rows are committed separately.
    display.textContent = lines.join("\n");
  }

  function requestFrame() {
    if (document.hidden || frameId) return;
    frameId = window.requestAnimationFrame(update);
  }

  function update() {
    frameId = 0;
    if (document.hidden) return;
    if (needsGrid) rebuildGrid();
    else if (!reducedMotion.matches) flicker();
    draw();
    // Sleep between pulses instead of performing work on every display refresh.
    if (!reducedMotion.matches) {
      window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(() => {
        pulseTimer = 0;
        requestFrame();
      }, SETTINGS.pulseMilliseconds);
    }
  }

  function pause() {
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(pulseTimer);
    frameId = 0;
    pulseTimer = 0;
  }

  function refreshGrid() {
    needsGrid = true;
    pause();
    requestFrame();
  }

  // Rebuild only after resizing settles; regular scrolling has no effect.
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshGrid, SETTINGS.resizeDelay);
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    pause();
    if (!document.hidden) requestFrame();
  });
  reducedMotion.addEventListener("change", () => {
    pause();
    requestFrame(); // Keep a static star field when reduced motion is enabled.
  });
  document.fonts?.ready.then(refreshGrid);
  requestFrame();
})();
