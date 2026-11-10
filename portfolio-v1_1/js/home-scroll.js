/* Reset Home on refresh, but leave links to a section alone. */
(() => {
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation?.type !== "reload" || window.location.hash) return;

  history.scrollRestoration = "manual";
  window.addEventListener("pageshow", () => {
    window.scrollTo(0, 0);
  }, { once: true });
})();
