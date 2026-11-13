/* Fade in the navbar's solid background and divider once scrolling starts. */
(() => {
  const navbar = document.querySelector(".top-navbar");
  if (!navbar) return;
  const navigation = navbar.querySelector("nav");
  const links = [...navigation.querySelectorAll("a")];

  function updateNavbar() {
    navbar.classList.toggle("scrolled", window.scrollY > 0);
  }

  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });

  function measureNavbar() {
    // Row gap retains the single-row spacing when paired columns are wider.
    const gap = Number.parseFloat(getComputedStyle(navigation).rowGap) || 0;
    const requiredWidth = links.reduce((total, link) => {
      const style = getComputedStyle(link);
      const text = link.querySelector("span").getBoundingClientRect().width;
      const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
      const border = Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth);
      return total + Math.max(Number.parseFloat(style.minWidth) || 0, text + padding + border);
    }, gap * (links.length - 1));
    // Keep the last two links together whenever the complete row cannot fit.
    navigation.classList.toggle("nav-paired-rows",
      window.matchMedia("(max-width: 900px)").matches
        && requiredWidth > navigation.getBoundingClientRect().width);
    const height = Math.ceil(navbar.getBoundingClientRect().height);
    const value = `${height}px`;
    if (document.documentElement.style.getPropertyValue("--navbar-height") !== value) {
      document.documentElement.style.setProperty("--navbar-height", value);
    }
  }

  let measureFrame = 0;
  function scheduleMeasurement() {
    if (measureFrame) return;
    measureFrame = window.requestAnimationFrame(() => {
      measureFrame = 0;
      measureNavbar();
    });
  }

  measureNavbar();
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(scheduleMeasurement);
    observer.observe(navbar);
    for (const link of links) observer.observe(link.querySelector("span"));
  }
  window.addEventListener("resize", scheduleMeasurement, { passive: true });

  window.addEventListener("pageshow", () => { measureNavbar(); updateNavbar(); });
  document.addEventListener("portfolio-page-change", updateNavbar);
})();
