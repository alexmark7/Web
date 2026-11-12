/* Fade in the navbar's solid background and divider once scrolling starts. */
(() => {
  const navbar = document.querySelector(".top-navbar");
  if (!navbar) return;

  function updateNavbar() {
    navbar.classList.toggle("scrolled", window.scrollY > 0);
  }

  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });

  window.addEventListener("pageshow", updateNavbar);
  document.addEventListener("portfolio-page-change", updateNavbar);
})();
