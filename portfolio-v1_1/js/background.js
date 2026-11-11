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
  const river = document.createElement("div");
  river.className = "watercolor-river";
  river.setAttribute("aria-hidden", "true");
  // Keep the buildings and trees tiny independently of the water's width.
  for (const [index, left, top] of [[0, 36.4, 47.65], [1, 47.9, 55.39], [2, 71.8, 57.32]]) {
    const hamlet = document.createElement("span");
    hamlet.className = `river-hamlet river-hamlet--${index + 1}`;
    hamlet.style.left = `${left}%`;
    hamlet.style.top = `${top}%`;
    river.append(hamlet);
  }
  // The ground anchors follow dry banks, with irregular gaps between groves.
  for (const [index, left, top, size] of [
    [0, 18, 43, 0.8], [1, 24, 44, 1], [2, 31, 49, 0.85],
    [1, 40, 50, 0.9], [0, 49, 43, 1], [2, 57, 42, 0.8],
    [0, 65, 53, 0.95], [1, 76, 55, 0.85], [2, 85, 51, 1],
    [1, 94, 48, 0.8], [2, 28, 75, 1], [0, 42, 77, 0.85],
    [1, 60, 73, 1], [2, 80, 77, 0.9],
  ]) {
    const grove = document.createElement("span");
    grove.className = `river-trees river-trees--${index + 1}`;
    grove.style.left = `${left}%`;
    grove.style.top = `${top}%`;
    grove.style.setProperty("--grove-size", size);
    river.append(grove);
  }
  for (const [index, left, top, width, rotation] of [
    [0, 22, 40, 9, -12], [1, 32, 80, 12, 8], [2, 49, 34, 7, 28],
    [3, 64, 43, 12, -7], [4, 72, 76, 6, -34], [5, 85, 67, 11, 11],
  ]) {
    const pigment = document.createElement("span");
    pigment.className = `river-pigment ${index % 2 ? "river-pigment--stroke" : "river-pigment--splotch"}`;
    pigment.style.left = `${left}%`;
    pigment.style.top = `${top}%`;
    pigment.style.width = `${width}%`;
    pigment.style.setProperty("--pigment-rotation", `${rotation}deg`);
    river.append(pigment);
  }
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
          <image href="images/moon-surface.jpg" width="730" height="730"/>
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
  }

  function scheduleSun() {
    if (!frame) frame = window.requestAnimationFrame(updateSun);
  }

  function measureSun() {
    // Read layout only when the page size changes, rather than during scrolling.
    scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    mountainDistance = window.innerHeight * 0.04;
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

/* ASCII star background */
(() => {
  "use strict";

  const display = document.getElementById("ascii-stars");
  if (!display) return;

  // Star size, spacing and timing.
  const SETTINGS = {
    characters: [".", ":", "*", "+"],
    pulseMilliseconds: 45,
    changesPerPulse: 2,
    pixelsPerStar: 7500,
    minimumSize: 10,
    maximumSize: 13,
    minimumOpacity: 0.42,
    maximumOpacity: 0.95,
    brightnessChange: 0.35,
    moveChance: 0.7,
    fadeMilliseconds: 580,
    hiddenMilliseconds: 100,
    minimumMoveDistance: 0.25,
    minimumRepeatMilliseconds: 2000,
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const savedBackgroundKey = "portfolio-star-background";
  let stars = [];
  let pulseTimer = 0;
  let builtWidth = 0;
  let builtHeight = 0;
  let nextStarIndex = 0;
  let spaceBetweenStars = 0;
  let placementRandom = startingRandom();
  const changeTimers = new Set();
  const lastChanged = new WeakMap();
  let previousChange = null;

  function randomBetween(minimum, maximum, random = Math.random) {
    return minimum + random() * (maximum - minimum);
  }

  // Use a seeded generator so new stars keep the same starting pattern.
  function startingRandom() {
    let number = 2026;
    return () => {
      number = (number * 1664525 + 1013904223) % 4294967296;
      return number / 4294967296;
    };
  }

  function randomCharacter(random = Math.random) {
    const index = Math.floor(random() * SETTINGS.characters.length);
    return SETTINGS.characters[index];
  }

  // Moves a star within the visible part of the page, away from its old position.
  function moveStar(star) {
    const oldLeft = Number.parseFloat(star.style.left);
    const oldTop = Number.parseFloat(star.style.top);
    const width = display.clientWidth;
    const height = display.clientHeight;
    const topEdge = Math.max(8, window.scrollY + 8);
    const bottomEdge = Math.max(topEdge, Math.min(height - 8, window.scrollY + window.innerHeight - 8));
    const minimumDistance = Math.min(window.innerWidth, window.innerHeight)
      * SETTINGS.minimumMoveDistance;
    let left;
    let top;
    let attempts = 0;

    do {
      left = randomBetween(1, 99);
      top = randomBetween(topEdge, bottomEdge);
      attempts++;
    } while (
      Number.isFinite(oldLeft)
      && Number.isFinite(oldTop)
      && Math.hypot(
        ((left - oldLeft) / 100) * width,
        top - oldTop,
      ) < minimumDistance
      && attempts < 20
    );

    star.style.left = `${left.toFixed(2)}%`;
    star.style.top = `${top.toFixed(1)}px`;
  }

  function changeAppearance(star, random = Math.random) {
    star.textContent = randomCharacter(random);
    star.style.fontSize = `${randomBetween(SETTINGS.minimumSize, SETTINGS.maximumSize, random).toFixed(1)}px`;
    star.style.setProperty(
      "--star-opacity",
      randomBetween(SETTINGS.minimumOpacity, SETTINGS.maximumOpacity, random).toFixed(2),
    );
  }

  function createStar(top, random) {
    const star = document.createElement("span");
    star.className = "ascii-star";
    star.style.left = `${randomBetween(1, 99, random).toFixed(2)}%`;
    star.style.top = `${top.toFixed(1)}px`;
    changeAppearance(star, random);
    return star;
  }

  // Saves the current stars so another page can continue with the same pattern.
  function saveStars() {
    try {
      const savedStars = stars.map((star) => ({
        left: star.style.left,
        top: star.style.top,
        character: star.textContent,
        size: star.style.fontSize,
        opacity: star.style.getPropertyValue("--star-opacity"),
        changedAt: lastChanged.get(star) || 0,
      }));
      window.sessionStorage.setItem(savedBackgroundKey, JSON.stringify({
        width: builtWidth,
        height: builtHeight,
        spaceBetweenStars,
        nextStarIndex,
        stars: savedStars,
        previousChange,
      }));
    } catch {
      // The background still works if the browser does not allow session storage.
    }
  }

  // Restores stars saved by the previous page in this browser tab.
  function restoreStars() {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(savedBackgroundKey));
      if (!saved || !Array.isArray(saved.stars) || !saved.stars.length) return false;

      const height = display.clientHeight;
      const group = document.createDocumentFragment();
      stars = [];
      display.replaceChildren();

      for (const savedStar of saved.stars) {
        const top = Number.parseFloat(savedStar.top);
        if (!Number.isFinite(top) || top < 0) continue;
        const star = document.createElement("span");
        star.className = "ascii-star";
        star.style.left = savedStar.left;
        star.style.top = savedStar.top;
        star.style.fontSize = savedStar.size;
        star.style.setProperty("--star-opacity", savedStar.opacity);
        star.textContent = SETTINGS.characters.includes(savedStar.character)
          ? savedStar.character : ".";
        if (Number.isFinite(savedStar.changedAt)) lastChanged.set(star, savedStar.changedAt);
        stars.push(star);
        group.append(star);
      }

      display.append(group);
      builtWidth = display.clientWidth;
      // Keep stars below a shorter page, ready for another longer page.
      builtHeight = Number(saved.height) || height;
      spaceBetweenStars = Number(saved.spaceBetweenStars) > 0
        ? Number(saved.spaceBetweenStars) : SETTINGS.pixelsPerStar / Math.max(Number(saved.width) || builtWidth, 1);
      nextStarIndex = Number.isInteger(saved.nextStarIndex) && saved.nextStarIndex >= 0
        ? saved.nextStarIndex : Math.max(0, Math.floor((builtHeight - 8) / spaceBetweenStars));
      placementRandom = startingRandom();
      // Move the repeatable number generator to the point used for new stars.
      for (let index = 0; index < nextStarIndex * 5; index++) placementRandom();
      previousChange = saved.previousChange || null;
      if (height > builtHeight) addStars();
      return true;
    } catch {
      return false;
    }
  }

  function clearChangeTimers() {
    for (const timer of changeTimers) window.clearTimeout(timer);
    changeTimers.clear();
    for (const star of stars) star.classList.remove("is-changing");
  }

  function addStars() {
    const height = display.clientHeight;
    const group = document.createDocumentFragment();

    // Add stars to new space without moving the stars that are already there.
    while ((nextStarIndex + 1) * spaceBetweenStars <= height - 8) {
      const top = (nextStarIndex + placementRandom()) * spaceBetweenStars;
      const star = createStar(top, placementRandom);
      stars.push(star);
      group.append(star);
      nextStarIndex++;
    }

    display.append(group);
    builtHeight = height;
  }

  function startStars() {
    stars = [];
    nextStarIndex = 0;
    previousChange = null;
    builtWidth = display.clientWidth;
    spaceBetweenStars = SETTINGS.pixelsPerStar / Math.max(builtWidth, 1);
    placementRandom = startingRandom();
    display.replaceChildren();
    addStars();
  }

  function updateStarArea() {
    const width = display.clientWidth;
    const height = display.clientHeight;

    if (width <= 0 || height <= 0) return;
    // Percentage positions already fit the new width. Do not restart the pattern.
    builtWidth = width;
    // Keep stars beyond a shorter page ready for the next longer page.
    if (height > builtHeight) addStars();
  }

  function changeStar(star) {
    // A disappearing star always returns in a different random place.
    star.classList.add("is-changing");
    const fadeTimer = window.setTimeout(() => {
      changeTimers.delete(fadeTimer);
      moveStar(star);
      changeAppearance(star);

      // Keeps the star hidden for a moment before it fades in elsewhere.
      const showTimer = window.setTimeout(() => {
        changeTimers.delete(showTimer);
        star.classList.remove("is-changing");
      }, SETTINGS.hiddenMilliseconds);
      changeTimers.add(showTimer);
    }, SETTINGS.fadeMilliseconds);
    changeTimers.add(fadeTimer);
  }

  // Changes a star's brightness while keeping it in the same place.
  function twinkleStar(star) {
    const current = Number.parseFloat(star.style.getPropertyValue("--star-opacity"));
    const minimum = Math.max(SETTINGS.minimumOpacity, current - SETTINGS.brightnessChange);
    const maximum = Math.min(SETTINGS.maximumOpacity, current + SETTINGS.brightnessChange);
    star.style.setProperty("--star-opacity", randomBetween(minimum, maximum).toFixed(2));
  }

  function schedulePulse() {
    window.clearTimeout(pulseTimer);
    pulseTimer = 0;
    if (document.documentElement.dataset.theme !== "dark"
      || document.hidden || reducedMotion.matches) return;
    pulseTimer = window.setTimeout(flicker, SETTINGS.pulseMilliseconds);
  }

  function flicker() {
    if (document.documentElement.dataset.theme !== "dark"
      || document.hidden || reducedMotion.matches) return;
    const now = Date.now();
    const firstVisible = window.scrollY;
    const lastVisible = firstVisible + window.innerHeight;
    const availableStars = stars.filter((star) => {
      const top = Number.parseFloat(star.style.top);
      const timeSinceChange = now - (lastChanged.get(star) || 0);
      return top >= firstVisible && top <= lastVisible
        && !star.classList.contains("is-changing")
        && timeSinceChange >= SETTINGS.minimumRepeatMilliseconds;
    });
    // Start two changes in different parts of the visible screen.
    for (let index = 0; index < SETTINGS.changesPerPulse && availableStars.length; index++) {
      const spreadOut = previousChange
        ? availableStars.filter((star) => {
          const left = Number.parseFloat(star.style.left);
          const top = Number.parseFloat(star.style.top);
          return Math.abs(left - previousChange.left) >= 30
            || Math.abs(top - previousChange.top) >= window.innerHeight * 0.3;
        })
        : availableStars;
      const choices = spreadOut.length ? spreadOut : availableStars;
      const star = choices[Math.floor(Math.random() * choices.length)];
      availableStars.splice(availableStars.indexOf(star), 1);
      previousChange = {
        left: Number.parseFloat(star.style.left),
        top: Number.parseFloat(star.style.top),
      };
      lastChanged.set(star, now);
      if (Math.random() < SETTINGS.moveChance) changeStar(star);
      else twinkleStar(star);
    }

    schedulePulse();
  }

  function pause() {
    window.clearTimeout(pulseTimer);
    pulseTimer = 0;
    clearChangeTimers();
  }

  // Images and other content can make the page taller after the first stars are placed.
  document.addEventListener("portfolio-page-change", updateStarArea);
  if ("ResizeObserver" in window) {
    new ResizeObserver(updateStarArea).observe(display);
  } else {
    window.addEventListener("resize", updateStarArea, { passive: true });
    window.addEventListener("load", updateStarArea);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else schedulePulse();
  });

  reducedMotion.addEventListener("change", () => {
    pause();
    schedulePulse();
  });

  document.addEventListener("portfolio-theme-change", () => {
    pause();
    schedulePulse();
  });

  window.addEventListener("pagehide", () => {
    saveStars();
    pause();
  });
  window.addEventListener("pageshow", schedulePulse);

  if (!restoreStars()) startStars();
  schedulePulse();
})();
