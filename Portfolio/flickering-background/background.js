/* Standalone flickering ASCII star background. */
(() => {
  "use strict";

  const display = document.getElementById("ascii-stars");
  if (!display) return;

  // Change these values to customise the star field.
  const SETTINGS = {
    characters: [".", "·", ":", "*", "+"],
    pulseMilliseconds: 450,
    changeFraction: 0.03,
    pixelsPerStar: 5200,
    minimumStars: 40,
    maximumStars: 300,
    minimumSize: 8,
    maximumSize: 13,
    minimumOpacity: 0.25,
    maximumOpacity: 0.85,
    fadeMilliseconds: 160,
    hiddenMilliseconds: 180,
    minimumMoveDistance: 0.25,
    minimumRepeatMilliseconds: 2000,
    resizeDelay: 150,
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let stars = [];
  let pulseTimer = 0;
  let resizeTimer = 0;
  const changeTimers = new Set();
  const lastChanged = new WeakMap();

  function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  function randomCharacter() {
    const index = Math.floor(Math.random() * SETTINGS.characters.length);
    return SETTINGS.characters[index];
  }

  // Leaves a small edge gap and keeps a moved star away from its old position.
  function moveStar(star) {
    const oldLeft = Number.parseFloat(star.style.left);
    const oldTop = Number.parseFloat(star.style.top);
    const minimumDistance = Math.min(window.innerWidth, window.innerHeight)
      * SETTINGS.minimumMoveDistance;
    let left;
    let top;
    let attempts = 0;

    do {
      left = randomBetween(1, 99);
      top = randomBetween(1, 99);
      attempts++;
    } while (
      Number.isFinite(oldLeft)
      && Math.hypot(
        ((left - oldLeft) / 100) * window.innerWidth,
        ((top - oldTop) / 100) * window.innerHeight,
      ) < minimumDistance
      && attempts < 20
    );

    star.style.left = `${left.toFixed(2)}%`;
    star.style.top = `${top.toFixed(2)}%`;
  }

  function changeAppearance(star) {
    star.textContent = randomCharacter();
    star.style.fontSize = `${randomBetween(SETTINGS.minimumSize, SETTINGS.maximumSize).toFixed(1)}px`;
    star.style.setProperty(
      "--star-opacity",
      randomBetween(SETTINGS.minimumOpacity, SETTINGS.maximumOpacity).toFixed(2),
    );
  }

  function createStar() {
    const star = document.createElement("span");
    star.className = "ascii-star";
    moveStar(star);
    changeAppearance(star);
    return star;
  }

  function getStarCount() {
    const screenArea = window.innerWidth * window.innerHeight;
    const count = Math.round(screenArea / SETTINGS.pixelsPerStar);
    return Math.max(SETTINGS.minimumStars, Math.min(SETTINGS.maximumStars, count));
  }

  function clearChangeTimers() {
    for (const timer of changeTimers) window.clearTimeout(timer);
    changeTimers.clear();
    for (const star of stars) star.classList.remove("is-changing");
  }

  function rebuildStars() {
    clearChangeTimers();
    const group = document.createDocumentFragment();
    stars = [];

    for (let index = 0; index < getStarCount(); index++) {
      const star = createStar();
      stars.push(star);
      group.append(star);
    }

    display.replaceChildren(group);
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

  function schedulePulse() {
    window.clearTimeout(pulseTimer);
    if (document.hidden || reducedMotion.matches) return;
    pulseTimer = window.setTimeout(flicker, SETTINGS.pulseMilliseconds);
  }

  function flicker() {
    const now = Date.now();
    const availableStars = stars.filter((star) => {
      const timeSinceChange = now - (lastChanged.get(star) || 0);
      return !star.classList.contains("is-changing")
        && timeSinceChange >= SETTINGS.minimumRepeatMilliseconds;
    });
    const amount = Math.max(1, Math.ceil(stars.length * SETTINGS.changeFraction));

    for (let index = 0; index < amount && availableStars.length; index++) {
      const randomIndex = Math.floor(Math.random() * availableStars.length);
      const [star] = availableStars.splice(randomIndex, 1);
      lastChanged.set(star, now);
      changeStar(star);
    }

    schedulePulse();
  }

  function pause() {
    window.clearTimeout(pulseTimer);
    pulseTimer = 0;
    clearChangeTimers();
  }

  // Waits until resizing stops before making a new set of stars.
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      rebuildStars();
      schedulePulse();
    }, SETTINGS.resizeDelay);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else schedulePulse();
  });

  reducedMotion.addEventListener("change", () => {
    pause();
    schedulePulse();
  });

  rebuildStars();
  schedulePulse();
})();
