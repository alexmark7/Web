/* Gently changing ASCII stars behind each page. */
(() => {
  "use strict";

  const display = document.getElementById("ascii-stars");
  if (!display) return;

  // Change these values to customise the star field.
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

  /* Creates repeatable positions when new stars need to be added. */
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
    if (document.hidden || reducedMotion.matches) return;
    pulseTimer = window.setTimeout(flicker, SETTINGS.pulseMilliseconds);
  }

  function flicker() {
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

  // Save just before leaving, then restore the same stars on the next page.
  window.addEventListener("pagehide", saveStars);

  if (!restoreStars()) startStars();
  schedulePulse();
})();
