/* Fades the page content when opening another page on this site. */
const page = document.documentElement;
const fadeTime = 180; // Matches the fade-out time in style.css.
let leavingPage = false;

// Add this before the CSS loads so the content does not flash on screen first.
page.classList.add("page-transition");

// Keep the Projects underline still when opening a project or returning to the list.
const fileName = window.location.pathname.split("/").pop();
const projectPages = ["projects.html", "forms-project.html", "browser-game.html", "portfolio-website.html"];
const navPage = projectPages.includes(fileName) ? "projects" : fileName;
try {
  if (window.sessionStorage.getItem("last-nav-page") === navPage) {
    page.classList.add("same-nav-page");
  }
  window.sessionStorage.setItem("last-nav-page", navPage);
} catch {
  // The site still works if the browser does not allow session storage.
}

function showPage() {
  page.classList.remove("page-leaving");
  // Give the browser one moment to draw the hidden content before fading it in.
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => page.classList.add("page-ready"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  showPage();

  document.addEventListener("click", (event) => {
    // Leave special clicks, downloads, and links to other websites alone.
    if (event.defaultPrevented || event.button !== 0
      || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

    const destination = new URL(link.href);
    if (destination.origin !== window.location.origin || !destination.pathname.endsWith(".html")) return;

    // Links to another part of the page should still scroll normally.
    if (destination.pathname === window.location.pathname
      && destination.search === window.location.search) return;

    // Skip the wait if the visitor has turned off movement in their browser.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    if (leavingPage) return;
    leavingPage = true;

    page.classList.remove("page-ready");
    page.classList.add("page-leaving");
    window.setTimeout(() => {
      window.location.href = destination.href;
    }, fadeTime);
  });
});

// Make a saved page visible again when using the browser's Back button.
window.addEventListener("pagehide", () => page.classList.remove("page-ready"));
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    leavingPage = false;
    showPage();
  }
});
