/* Stops a refresh from returning Home to an old scroll position. */
const navigation = performance.getEntriesByType("navigation")[0];

if (navigation && navigation.type === "reload") {
  history.scrollRestoration = "manual";

  // Start at the top once the refreshed page is ready.
  window.addEventListener("pageshow", () => {
    window.scrollTo(0, 0);
  }, { once: true });

  // Keep normal scroll restoration when leaving Home for another page.
  window.addEventListener("pagehide", () => {
    history.scrollRestoration = "auto";
  }, { once: true });
}
