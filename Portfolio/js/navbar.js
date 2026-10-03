/* Changes the navbar style after the page has been scrolled. */
const navbar = document.querySelector(".top-navbar");

if (navbar) {
  function updateNavbar() {
    navbar.classList.toggle("scrolled", window.scrollY > 0);
  }

  // Check the position when the page opens and whenever it moves.
  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });

  // Check again if the browser returns to a saved scroll position.
  window.addEventListener("pageshow", updateNavbar);
}
