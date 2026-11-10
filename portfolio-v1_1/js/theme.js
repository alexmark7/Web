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
    const label = `Switch to ${nextTheme} mode`;

    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function applyTheme(theme) {
    const changed = page.dataset.theme !== theme;
    requestedTheme = theme;
    window.clearTimeout(transitionTimer);
    if (activeTransition) activeTransition.skipTransition();
    activeTransition = null;

    const update = () => {
      if (requestedTheme !== theme) return;
      const actuallyChanged = page.dataset.theme !== theme;
      page.dataset.theme = theme;
      updateButton();
      if (actuallyChanged) document.dispatchEvent(new Event("portfolio-theme-change"));
    };

    if (!changed || document.readyState === "loading"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      page.classList.remove("theme-changing", "theme-snapshot");
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
      }, 200);
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
