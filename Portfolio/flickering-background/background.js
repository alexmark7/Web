/* Standalone flickering ASCII star background. */
(() => {
  "use strict";

  const display = document.getElementById("ascii-stars");
  if (!display) return;

  // Change these values to customise the star field.
  const SETTINGS = {
    characters: [".", "·", ":", "*", "+"],
    pulseMilliseconds: 180,
    changeFraction: 0.06,
    moveFraction: 0.45,
    pixelsPerStar: 5200,
    minimumStars: 40,
    maximumStars: 300,
    minimumSize: 8,
    maximumSize: 13,
    minimumOpacity: 0.25,
    maximumOpacity: 0.85,
    fadeMilliseconds: 90,
    resizeDelay: 150,
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let stars = [];
  let pulseTimer = 0;
  let resizeTimer = 0;
  const changeTimers = new Set();

  function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  function randomCharacter() {
    const index = Math.floor(Math.random() * SETTINGS.characters.length);
    return SETTINGS.characters[index];
  }

  // Leaves a small edge gap so symbols are not cut in half.
  function moveStar(star) {
    star.style.left = `${randomBetween(1, 99).toFixed(2)}%`;
    star.style.top = `${randomBetween(1, 99).toFixed(2)}%`;
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
    star.classList.add("is-changing");
    const timer = window.setTimeout(() => {
      changeTimers.delete(timer);
      if (Math.random() < SETTINGS.moveFraction) moveStar(star);
      changeAppearance(star);
      star.classList.remove("is-changing");
    }, SETTINGS.fadeMilliseconds);
    changeTimers.add(timer);
  }

  function schedulePulse() {
    window.clearTimeout(pulseTimer);
    if (document.hidden || reducedMotion.matches) return;
    pulseTimer = window.setTimeout(flicker, SETTINGS.pulseMilliseconds);
  }

  function flicker() {
    const availableStars = stars.filter((star) => !star.classList.contains("is-changing"));
    const amount = Math.max(1, Math.ceil(stars.length * SETTINGS.changeFraction));

    for (let index = 0; index < amount && availableStars.length; index++) {
      const randomIndex = Math.floor(Math.random() * availableStars.length);
      const [star] = availableStars.splice(randomIndex, 1);
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
