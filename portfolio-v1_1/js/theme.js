/* Theme switch */
(() => {
  "use strict";

  const page = document.documentElement;
  const storageKey = "portfolio-theme";
  const systemTheme = window.matchMedia("(prefers-color-scheme: light)");
  let savedTheme = null;
  let transitionTimer = 0;
  let activeTransition = null;
  let requestedTheme = null;
  let requestNumber = 0;
  const imageFolder = new URL("../images/", document.currentScript.src);
  const sceneryLoads = new Map();
  const sceneryImages = new Map();
  let moonLoad = null;
  const sceneryScriptsReady = document.readyState === "complete" ? Promise.resolve()
    : new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  const paintings = [
    "watercolor-sun", "watercolor-mountains-defined-ridge", "watercolor-river",
    "watercolor-river-details", "watercolor-river-forest-autumn", "watercolor-cherry-tree-solid",
    "watercolor-ink-splatter", "watercolor-ink-splatter-02", "watercolor-ink-stroke", "watercolor-cloud",
    "watercolor-cloud-02", "watercolor-cloud-03", "watercolor-cloud-04",
    "watercolor-cloud-05", "watercolor-cloud-06", "watercolor-cloud-07",
  ];

  function prepareDarkScenery() {
    if (!moonLoad) {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = "high";
      moonLoad = new Promise(resolve => {
        const source = new URL("moon-surface.jpg", imageFolder).href;
        if (image.decode) {
          image.src = source;
          image.decode().then(resolve, resolve);
        } else {
          image.onload = image.onerror = resolve;
          image.src = source;
        }
      });
    }
    return moonLoad;
  }

  function prepareLightScenery(priority = "low") {
    const density = window.devicePixelRatio > 1 ? "@2x" : "";
    const files = paintings.map(name => `optimized/${name}${density}.webp`);
    files.push("distant-birds.svg");
    // A later button press can raise the priority of an idle preload.
    for (const file of files) {
      if (sceneryImages.has(file) && priority === "high") {
        sceneryImages.get(file).fetchPriority = priority;
      }
    }
    if (!sceneryLoads.has(density)) {
      const loading = files.map(file => {
        const image = new Image();
        sceneryImages.set(file, image);
        image.decoding = "async";
        image.fetchPriority = priority;
        image.src = new URL(file, imageFolder).href;
        if (image.decode) return image.decode();
        return image.complete ? Promise.resolve() : new Promise(resolve => {
          image.onload = image.onerror = resolve;
        });
      });
      // One missing decorative image must not prevent switching themes.
      sceneryLoads.set(density, Promise.allSettled(loading));
    }
    return sceneryLoads.get(density).then(async () => {
      // Deferred scenery scripts must exist before the initial light reveal.
      await sceneryScriptsReady;
      try {
        await document.querySelector(".watercolor-river")?.prepareScenery?.();
      } catch {
        // Missing decorative artwork must not prevent switching themes.
      }
      page.dataset.sceneryReady = "true";
      updateButton();
    });
  }

  function isTheme(value) {
    return value === "light" || value === "dark";
  }

  function preferredTheme() {
    return systemTheme.matches ? "light" : "dark";
  }

  function updateButton() {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;

    const nextTheme = page.dataset.theme === "light" ? "dark" : "light";
    const waiting = requestedTheme === "light" && page.dataset.theme !== "light"
      && !page.hasAttribute("data-scenery-ready");
    const label = waiting ? "Loading light mode; click to cancel" : `Switch to ${nextTheme} mode`;

    button.setAttribute("aria-label", label);
    button.setAttribute("aria-busy", String(waiting));
    button.title = label;
  }

  async function applyTheme(theme) {
    const changed = page.dataset.theme !== theme;
    const number = ++requestNumber;
    requestedTheme = theme;
    window.clearTimeout(transitionTimer);
    if (activeTransition) activeTransition.skipTransition();
    activeTransition = null;
    page.classList.remove("theme-changing", "theme-snapshot");
    updateButton();

    const update = () => {
      if (number !== requestNumber) return;
      const actuallyChanged = page.dataset.theme !== theme;
      page.dataset.theme = theme;
      updateButton();
      if (actuallyChanged) document.dispatchEvent(new Event("portfolio-theme-change"));
    };

    if (!changed || document.readyState === "loading") {
      update();
      if (theme === "light") prepareLightScenery("high");
      else prepareDarkScenery();
      return;
    }

    // Keep the current theme visible until the next snapshot has all its artwork.
    if (theme === "light") await prepareLightScenery("high");
    else await prepareDarkScenery();
    if (number !== requestNumber) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      update();
      return;
    }

    page.classList.add("theme-changing");

    if (typeof document.startViewTransition === "function") {
      page.classList.add("theme-snapshot");
      const transition = document.startViewTransition(update);
      activeTransition = transition;
      // A quick second toggle can cancel the first snapshot.
      transition.ready.catch(() => {});
      const finish = () => {
        if (activeTransition !== transition) return;
        activeTransition = null;
        page.classList.remove("theme-changing", "theme-snapshot");
      };
      transition.finished.then(finish, finish);
    } else {
      update();
      transitionTimer = window.setTimeout(() => {
        page.classList.remove("theme-changing");
      }, 260);
    }
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (isTheme(stored)) savedTheme = stored;
  } catch {
    // Storage may be blocked by the browser.
  }

  // Set the theme early to avoid a flash of the wrong colours.
  applyTheme(savedTheme || preferredTheme());

  document.addEventListener("DOMContentLoaded", () => {
    // Warm the light scene after the page's essential resources get a head start.
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => prepareLightScenery(), { timeout: 1500 });
    } else window.setTimeout(() => prepareLightScenery(), 500);

    const button = document.querySelector(".theme-toggle");
    if (!button) return;

    button.addEventListener("click", () => {
      // A quick second click may arrive before the first crossfade updates the page.
      const nextTheme = (requestedTheme || page.dataset.theme) === "light" ? "dark" : "light";

      savedTheme = nextTheme;
      applyTheme(nextTheme);

      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Storage may be blocked by the browser.
      }
    });

    updateButton();
    button.hidden = false;
  });

  // Use the system setting unless a theme was chosen.
  systemTheme.addEventListener("change", () => {
    if (!savedTheme) applyTheme(preferredTheme());
  });

  window.addEventListener("storage", event => {
    if (event.key !== storageKey && event.key !== null) return;
    try {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }

    savedTheme = isTheme(event.newValue) ? event.newValue : null;
    applyTheme(savedTheme || preferredTheme());
  });
})();
