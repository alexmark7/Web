/* Lunar night sky, watercolor scenery and scroll-animation fallbacks. */
(() => {
  "use strict";

  const background = document.querySelector(".background");
  if (!background) return;

  const clouds = document.createElement("div");
  clouds.className = "watercolor-clouds";
  clouds.setAttribute("aria-hidden", "true");
  const distantClouds = document.createElement("div");
  distantClouds.className = "watercolor-clouds watercolor-clouds--behind";
  distantClouds.setAttribute("aria-hidden", "true");
  // Each cloud has its own painted silhouette, placement and drift speed.
  for (let index = 1; index <= 8; index++) {
    const cloud = document.createElement("span");
    cloud.className = `watercolor-cloud watercolor-cloud--${String(index).padStart(2, "0")}`;
    // The broad middle cloud passes behind the sun; the others pass in front.
    (index === 5 ? distantClouds : clouds).append(cloud);
  }
  background.append(distantClouds, clouds);

  const ink = document.createElement("div");
  ink.className = "watercolor-ink";
  ink.setAttribute("aria-hidden", "true");
  const tree = document.createElement("div");
  tree.className = "watercolor-cherry-tree";
  tree.setAttribute("aria-hidden", "true");
  // Keep the moon and other scenery available if this optional painter fails to load.
  const river = window.createPortfolioRiverScene?.(background) || document.createElement("canvas");
  river.className = "watercolor-river";
  river.setAttribute("aria-hidden", "true");
  const sunMist = document.createElement("div");
  sunMist.className = "sun-mist";
  sunMist.setAttribute("aria-hidden", "true");
  const birds = document.createDocumentFragment();
  for (const position of ["", "top-right", "middle-left"]) {
    const flock = document.createElement("div");
    flock.className = `distant-birds${position ? ` distant-birds--${position}` : ""}`;
    flock.setAttribute("aria-hidden", "true");
    birds.append(flock);
  }
  background.append(birds, ink, river, sunMist, tree);

  const moon = document.createElement("div");
  moon.className = "night-moon";
  moon.setAttribute("aria-hidden", "true");
  moon.innerHTML = `<svg viewBox="0 0 100 100" focusable="false">
    <defs>
      <clipPath id="moon-disc"><circle cx="50" cy="50" r="47"/></clipPath>
      <clipPath id="moon-illuminated"><path class="moon-phase"/></clipPath>
      <g id="moon-surface" clip-path="url(#moon-disc)">
        <circle cx="50" cy="50" r="47" fill="#c9c9c1"/>
        <!-- NASA SVS lunar imagery; source and credit: images/moon-surface.md. -->
        <svg x="3" y="3" width="94" height="94" viewBox="19 19 692 692">
          <image width="730" height="730"/>
        </svg>
      </g>
    </defs>
    <circle cx="50" cy="50" r="47" fill="#030508"/>
    <use href="#moon-surface" opacity=".09"/>
    <g clip-path="url(#moon-illuminated)">
      <use href="#moon-surface"/>
    </g>
  </svg>`;
  background.append(moon);

  // Light-only visits do not download the hidden moon texture. Theme switching
  // decodes it before the dark crossfade, then this SVG reuses the cached image.
  function updateMoonSurface() {
    const image = moon.querySelector("image");
    if (document.documentElement.dataset.theme === "dark" && !image.hasAttribute("href")) {
      image.setAttribute("href", "images/moon-surface.jpg");
    }
  }

  updateMoonSurface();
  document.addEventListener("portfolio-theme-change", updateMoonSurface);

  // Illumination formulas adapted from SunCalc 1.9.0 (BSD-2-Clause).
  // Copyright (c) 2014 Vladimir Agafonkin. See vendor/suncalc-LICENSE.txt.
  // https://github.com/mourner/suncalc/tree/v1.9.0
  function moonIllumination(date) {
    const rad = Math.PI / 180;
    const days = date.valueOf() / 86400000 - 10957.5; // Days since J2000, UTC.
    const tilt = rad * 23.4397;
    const coordinates = (longitude, latitude) => ({
      ra: Math.atan2(Math.sin(longitude) * Math.cos(tilt)
        - Math.tan(latitude) * Math.sin(tilt), Math.cos(longitude)),
      dec: Math.asin(Math.sin(latitude) * Math.cos(tilt)
        + Math.cos(latitude) * Math.sin(tilt) * Math.sin(longitude)),
    });
    const solarAnomaly = rad * (357.5291 + 0.98560028 * days);
    const solarLongitude = solarAnomaly + rad * (1.9148 * Math.sin(solarAnomaly)
      + 0.02 * Math.sin(2 * solarAnomaly) + 0.0003 * Math.sin(3 * solarAnomaly)
      + 102.9372) + Math.PI;
    const sun = coordinates(solarLongitude, 0);
    const lunarAnomaly = rad * (134.963 + 13.064993 * days);
    const lunarLongitude = rad * (218.316 + 13.176396 * days)
      + rad * 6.289 * Math.sin(lunarAnomaly);
    const lunarLatitude = rad * 5.128 * Math.sin(rad * (93.272 + 13.229350 * days));
    const lunar = coordinates(lunarLongitude, lunarLatitude);
    const lunarDistance = 385001 - 20905 * Math.cos(lunarAnomaly);
    const separation = Math.acos(Math.max(-1, Math.min(1,
      Math.sin(sun.dec) * Math.sin(lunar.dec)
      + Math.cos(sun.dec) * Math.cos(lunar.dec) * Math.cos(sun.ra - lunar.ra))));
    const incidence = Math.atan2(149598000 * Math.sin(separation),
      lunarDistance - 149598000 * Math.cos(separation));
    const angle = Math.atan2(Math.cos(sun.dec) * Math.sin(sun.ra - lunar.ra),
      Math.sin(sun.dec) * Math.cos(lunar.dec)
      - Math.cos(sun.dec) * Math.sin(lunar.dec) * Math.cos(sun.ra - lunar.ra));
    return {
      fraction: (1 + Math.cos(incidence)) / 2,
      phase: 0.5 + 0.5 * incidence * (angle < 0 ? -1 : 1) / Math.PI,
    };
  }

  function updateMoonPhase() {
    const { fraction, phase } = moonIllumination(new Date());
    const waxing = phase < 0.5;
    const outerSweep = waxing ? 1 : 0;
    const terminatorSweep = fraction < 0.5 ? 1 - outerSweep : outerSweep;
    const terminatorRadius = Math.abs(1 - 2 * fraction) * 47;
    // The lit limb and elliptical terminator give a continuous phase, not eight icons.
    moon.querySelector(".moon-phase").setAttribute("d",
      `M50 3A47 47 0 0 ${outerSweep} 50 97A${terminatorRadius} 47 0 0 ${terminatorSweep} 50 3Z`);
    const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
      "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    moon.dataset.phase = names[Math.round(phase * 8) % 8];
    moon.dataset.illumination = fraction.toFixed(4);
    moon.style.setProperty("--moon-glow", (0.08 + fraction * 0.22).toFixed(3));
  }

  updateMoonPhase();
  // Recheck hourly and after a suspended tab resumes; no service/API is needed.
  window.setInterval(() => { if (!document.hidden) updateMoonPhase(); }, 3600000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) updateMoonPhase(); });
  window.addEventListener("pageshow", updateMoonPhase);

  const nativeScroll = CSS.supports("animation-timeline", "scroll()")
    && CSS.supports("animation-range", "0px 100px");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let scrollRange = 0;
  let mountainDistance = 0;
  let moonExitDistance = 0;
  let treeTravel = 0;
  let inkHeight = 0;
  let inkWidth = 0;

  function placeInk(height) {
    if (Math.abs(height - inkHeight) < 1 && inkWidth === window.innerWidth) return;
    inkHeight = height;
    inkWidth = window.innerWidth;
    // A repeatable random pattern keeps the marks still while the page is open.
    let seed = 2026;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const count = Math.min(52, Math.max(26, Math.round(inkWidth * height / 32000)));
    const marks = document.createDocumentFragment();
    for (let index = 0; index < count; index++) {
      const mark = document.createElement("span");
      const wash = index % 6 === 0;
      const stroke = index % 6 > 1;
      mark.className = `ink-mark ${wash ? "ink-wash" : stroke ? "ink-stroke" : "ink-splotch"}`;
      if (!wash && !stroke && Math.floor(index / 6) % 2 === 1) {
        mark.classList.add("ink-splotch--02");
      }
      if (index === 1) mark.classList.add("ink-splotch--top-left");
      mark.style.top = `${((index + 0.2 + random() * 0.6) / count) * height}px`;
      mark.style.setProperty("--ink-left", `${((index % 5 + 0.15 + random() * 0.7) / 5) * 100}%`);
      mark.style.setProperty("--ink-size", `${wash ? 280 + random() * 400 : stroke ? 240 + random() * 340 : 60 + random() * 100}px`);
      mark.style.setProperty("--ink-rotation", `${stroke ? random() * 70 - 35 : random() * 240 - 120}deg`);
      mark.style.setProperty("--ink-flip", index % 2 ? "-1" : "1");
      mark.style.setProperty("--ink-opacity", ((wash ? 0.035 : stroke ? 0.03 : 0.09) + random() * (wash ? 0.025 : stroke ? 0.035 : 0.08)).toFixed(3));
      marks.append(mark);
    }
    ink.replaceChildren(marks);
  }

  function updateSun() {
    frame = 0;
    if (nativeScroll) return;
    const scroll = Math.max(0, window.scrollY);
    if (document.documentElement.dataset.theme !== "light") {
      const moonRise = reducedMotion.matches ? 0 : Math.min(scroll * 0.12, moonExitDistance);
      moon.style.setProperty("--moon-rise", `${moonRise}px`);
      return;
    }
    const progress = scrollRange > 0
      ? Math.min(1, scroll / scrollRange) : 0;
    const mountainRise = reducedMotion.matches ? 0 : progress * mountainDistance;
    // Sun, mist, mountains and river stay together; horizontal sway remains CSS-driven.
    background.style.setProperty("--mountain-rise", `${mountainRise}px`);
    const remaining = 1 - progress;
    // Match the CSS curve: the same early rise, with less stalling near the footer.
    const treeOffset = reducedMotion.matches ? 0
      : treeTravel * remaining * (remaining + 0.3 * progress ** 2);
    tree.style.setProperty("--tree-offset", `${treeOffset}px`);
  }

  function scheduleSun() {
    if (!frame) frame = window.requestAnimationFrame(updateSun);
  }

  function measureSun() {
    // Read layout only when the page size changes, rather than during scrolling.
    scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    mountainDistance = window.innerHeight * 0.04;
    // Start fully below the viewport, then rise faster early in the scroll and
    // settle gently into the foreground as the visitor approaches the footer.
    const treeSize = Number.parseFloat(getComputedStyle(tree).width) || 0;
    treeTravel = treeSize * 0.8 + 8;
    tree.style.setProperty("--tree-travel", `${treeTravel}px`);
    const navbar = document.querySelector(".top-navbar");
    background.style.setProperty("--cloud-clearance", `${(navbar?.getBoundingClientRect().height || 76) + 16}px`);
    if (!nativeScroll && document.documentElement.dataset.theme !== "light") {
      const moonStyle = getComputedStyle(moon);
      moonExitDistance = Number.parseFloat(moonStyle.top) + Number.parseFloat(moonStyle.width) + 24;
    }
    placeInk(window.innerHeight);
    if (!nativeScroll) scheduleSun();
  }

  if (!nativeScroll) window.addEventListener("scroll", scheduleSun, { passive: true });
  window.addEventListener("resize", measureSun, { passive: true });
  window.addEventListener("load", measureSun);
  window.addEventListener("pageshow", measureSun);
  document.addEventListener("portfolio-page-change", measureSun);
  document.addEventListener("portfolio-theme-change", measureSun);
  reducedMotion.addEventListener("change", measureSun);
  // Recalculate after images load or page navigation changes the document height.
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(measureSun);
    observer.observe(document.body);
    const navbar = document.querySelector(".top-navbar");
    if (navbar) observer.observe(navbar);
  }
  measureSun();
})();

/* A bounded star field follows the viewport in document coordinates. */
(() => {
  "use strict";

  const display = document.getElementById("ascii-stars");
  if (!display) return;

  const SETTINGS = {
    characters: [".", ":", "*", "+"],
    pixelsPerStar: 7500,
    maximumStars: 600,
    pulseMilliseconds: 200,
    maximumActiveChanges: 6,
    minimumRepeatMilliseconds: 2000,
    minimumSize: 10,
    maximumSize: 13,
    minimumOpacity: 0.42,
    maximumOpacity: 0.95,
    brightnessChange: 0.35,
    moveChance: 0.25,
    fadeMilliseconds: 580,
    hiddenMilliseconds: 100,
    transitionMilliseconds: 550,
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const stars = new Map();
  const details = new WeakMap();
  const activeChanges = new Set();
  let pulseTimer = 0;
  let scrollFrame = 0;
  let spacing = 0;
  let areaWidth = 0;
  let areaHeight = 0;
  let viewportHeight = 0;
  let margin = 0;
  let windowStart = 0;
  let windowEnd = 0;
  let previousChange = null;

  // Old versions saved an entire document's stars. Regenerate the same seeded
  // pattern instead of restoring or serializing thousands of decorative nodes.
  try { window.sessionStorage.removeItem("portfolio-star-background"); } catch {}

  function randomBetween(minimum, maximum, random = Math.random) {
    return minimum + random() * (maximum - minimum);
  }

  // Each row has its own seed, so revisiting an area restores its pattern
  // without generating all the rows between the page top and the viewport.
  function startingRandom(index) {
    let number = Math.imul(index + 1, 0x9e3779b1) ^ 2026;
    number = Math.imul(number ^ (number >>> 16), 0x85ebca6b);
    number = Math.imul(number ^ (number >>> 13), 0xc2b2ae35);
    number = (number ^ (number >>> 16)) >>> 0;
    return () => {
      number = (Math.imul(number, 1664525) + 1013904223) >>> 0;
      return number / 4294967296;
    };
  }

  function canAnimate() {
    return document.documentElement.dataset.theme === "dark"
      && !document.hidden && !reducedMotion.matches;
  }

  function cancelChange(star) {
    const state = details.get(star);
    for (const timer of state.timers) window.clearTimeout(timer);
    state.timers.clear();
    const wasActive = activeChanges.delete(star);
    star.classList.remove("is-changing");
    if (wasActive) {
      // Finish any CSS fade too, so a quick pause/resume cannot overlap old
      // fades with a newly scheduled set of twinkles.
      for (const animation of star.getAnimations()) animation.cancel();
    }
  }

  function clearPool() {
    for (const star of stars.values()) cancelChange(star);
    stars.clear();
    if (display.childElementCount) display.replaceChildren();
    windowStart = 0;
    windowEnd = 0;
    previousChange = null;
  }

  function changeAppearance(star, random = Math.random) {
    const state = details.get(star);
    star.textContent = SETTINGS.characters[Math.floor(random() * SETTINGS.characters.length)];
    star.style.fontSize = `${randomBetween(SETTINGS.minimumSize, SETTINGS.maximumSize, random).toFixed(1)}px`;
    state.opacity = randomBetween(SETTINGS.minimumOpacity, SETTINGS.maximumOpacity, random);
    star.style.setProperty("--star-opacity", state.opacity.toFixed(2));
  }

  function createStar(index) {
    const random = startingRandom(index);
    const star = document.createElement("span");
    const state = {
      index,
      left: randomBetween(1, 99, random),
      top: 8 + (index + random()) * spacing,
      opacity: 0,
      lastChanged: 0,
      timers: new Set(),
    };
    details.set(star, state);
    star.className = "ascii-star";
    star.style.left = `${state.left.toFixed(2)}%`;
    star.style.top = `${state.top.toFixed(1)}px`;
    changeAppearance(star, random);
    return star;
  }

  function refreshPool(force = false) {
    if (document.documentElement.dataset.theme !== "dark" || document.hidden || !spacing) return;
    const visibleTop = Math.max(8, Math.min(window.scrollY + 8, areaHeight - 8));
    const visibleBottom = Math.max(visibleTop,
      Math.min(areaHeight - 8, window.scrollY + viewportHeight - 8));
    // Recycle offscreen rows in batches, rather than changing the DOM for each
    // trackpad pixel. Half a viewport on either side keeps new rows out of sight.
    if (!force
      && (windowStart <= 8 || visibleTop >= windowStart + margin * 0.25)
      && (windowEnd >= areaHeight - 8 || visibleBottom <= windowEnd - margin * 0.25)) return;

    const start = Math.max(8, visibleTop - margin);
    const end = Math.min(areaHeight - 8, visibleBottom + margin);
    const first = Math.max(0, Math.floor((start - 8) / spacing));
    const last = Math.min(first + SETTINGS.maximumStars, Math.ceil((end - 8) / spacing));
    for (const [index, star] of stars) {
      if (index >= first && index < last) continue;
      cancelChange(star);
      star.remove();
      stars.delete(index);
    }
    const group = document.createDocumentFragment();
    for (let index = first; index < last; index++) {
      if (stars.has(index)) continue;
      const star = createStar(index);
      stars.set(index, star);
      group.append(star);
    }
    display.append(group);
    windowStart = start;
    windowEnd = end;
  }

  function schedulePool() {
    if (scrollFrame || document.hidden || document.documentElement.dataset.theme !== "dark") return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      refreshPool();
      schedulePulse();
    });
  }

  function schedulePulse() {
    if (!pulseTimer && stars.size && canAnimate()) {
      pulseTimer = window.setTimeout(flicker, SETTINGS.pulseMilliseconds);
    }
  }

  function updateStarArea() {
    if (document.documentElement.dataset.theme !== "dark") {
      pause();
      clearPool();
      return;
    }
    if (document.hidden) return;
    const width = display.clientWidth;
    const height = display.clientHeight;
    if (width <= 0 || height <= 16) return;
    viewportHeight = window.innerHeight;
    margin = viewportHeight * 0.5;
    // Density remains unchanged at ordinary sizes; the cap also bounds work
    // on large/high-resolution screens, regardless of document length.
    const nextSpacing = Math.max(SETTINGS.pixelsPerStar / width,
      (viewportHeight + 2 * margin) / (SETTINGS.maximumStars - 2));
    if (spacing !== nextSpacing) clearPool();
    spacing = nextSpacing;
    areaWidth = width;
    areaHeight = height;
    refreshPool(true);
    schedulePulse();
  }

  function after(star, delay, action) {
    const state = details.get(star);
    const timer = window.setTimeout(() => {
      state.timers.delete(timer);
      if (stars.get(state.index) === star && canAnimate()) action();
    }, delay);
    state.timers.add(timer);
  }

  function moveStar(star) {
    const state = details.get(star);
    const oldLeft = state.left;
    const minimumDistance = Math.min(areaWidth, viewportHeight) * 0.25;
    let attempts = 0;
    do {
      state.left = randomBetween(1, 99);
    } while (Math.abs((state.left - oldLeft) / 100 * areaWidth) < minimumDistance && ++attempts < 20);
    // Keep a relocated star in its owned row so recycling an offscreen row
    // can never remove a star that moved into the visible part of another row.
    state.top = 8 + (state.index + Math.random()) * spacing;
    star.style.left = `${state.left.toFixed(2)}%`;
    star.style.top = `${state.top.toFixed(1)}px`;
  }

  function changeStar(star) {
    star.classList.add("is-changing");
    after(star, SETTINGS.fadeMilliseconds, () => {
      moveStar(star);
      changeAppearance(star);
      after(star, SETTINGS.hiddenMilliseconds, () => {
        star.classList.remove("is-changing");
        after(star, SETTINGS.transitionMilliseconds, () => activeChanges.delete(star));
      });
    });
  }

  function twinkleStar(star) {
    const state = details.get(star);
    state.opacity = randomBetween(
      Math.max(SETTINGS.minimumOpacity, state.opacity - SETTINGS.brightnessChange),
      Math.min(SETTINGS.maximumOpacity, state.opacity + SETTINGS.brightnessChange));
    star.style.setProperty("--star-opacity", state.opacity.toFixed(2));
    after(star, SETTINGS.transitionMilliseconds, () => activeChanges.delete(star));
  }

  function flicker() {
    pulseTimer = 0;
    if (!canAnimate()) return;
    if (activeChanges.size < SETTINGS.maximumActiveChanges) {
      const now = Date.now();
      const firstVisible = window.scrollY;
      const lastVisible = firstVisible + viewportHeight;
      const available = [...stars.values()].filter(star => {
        const state = details.get(star);
        return state.top >= firstVisible && state.top <= lastVisible
          && !activeChanges.has(star)
          && now - state.lastChanged >= SETTINGS.minimumRepeatMilliseconds;
      });
      const spreadOut = previousChange ? available.filter(star => {
        const state = details.get(star);
        return Math.abs(state.left - previousChange.left) >= 30
          || Math.abs(state.top - previousChange.top) >= viewportHeight * 0.3;
      }) : available;
      const choices = spreadOut.length ? spreadOut : available;
      if (choices.length) {
        const star = choices[Math.floor(Math.random() * choices.length)];
        const state = details.get(star);
        state.lastChanged = now;
        previousChange = { left: state.left, top: state.top };
        activeChanges.add(star);
        if (Math.random() < SETTINGS.moveChance) changeStar(star);
        else twinkleStar(star);
      }
    }
    schedulePulse();
  }

  function pause() {
    window.clearTimeout(pulseTimer);
    window.cancelAnimationFrame(scrollFrame);
    pulseTimer = 0;
    scrollFrame = 0;
    for (const star of activeChanges) cancelChange(star);
  }

  window.addEventListener("scroll", schedulePool, { passive: true });
  window.addEventListener("resize", updateStarArea, { passive: true });
  window.addEventListener("load", updateStarArea);
  window.addEventListener("pageshow", updateStarArea);
  window.addEventListener("pagehide", pause);
  document.addEventListener("portfolio-page-change", updateStarArea);
  document.addEventListener("portfolio-theme-change", () => {
    pause();
    updateStarArea();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else updateStarArea();
  });
  reducedMotion.addEventListener("change", () => {
    pause();
    updateStarArea();
  });
  if ("ResizeObserver" in window) new ResizeObserver(updateStarArea).observe(display);
  updateStarArea();
})();
