/* Loads another page's content while keeping the navbar, stars, and UFO running. */
(() => {
  "use strict";

  const page = document.documentElement;
  const folder = new URL("./", window.location.href);
  const files = ["index.html", "projects.html", "cv.html", "about-me.html",
    "portfolio-website.html", "forms-project.html", "browser-game.html"];
  const savedPages = new Map();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let shownUrl = new URL(window.location.href);
  let pageRequest;
  let pageNumber = 0;
  let changingPage = false;
  let animations = [];

  // A folder address and index.html both mean Home.
  function pagePath(url) {
    return url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
  }

  function pageKey(url) {
    return pagePath(url) + url.search;
  }

  function navigationHeading(url) {
    const file = pagePath(url).split("/").pop();
    return ["index.html", "cv.html", "about-me.html"].includes(file) ? file : "projects.html";
  }

  // Leave downloads, other websites, and files outside this portfolio alone.
  function isPortfolioPage(url) {
    return url.origin === folder.origin
      && files.some(file => pagePath(url) === folder.pathname + file);
  }

  function contentParts() {
    return [document.querySelector("main"), document.querySelector("footer")];
  }

  // Wrap button text so it can fade and move without changing the button's blur.
  function prepareButtons() {
    for (const part of contentParts()) {
      for (const button of part.querySelectorAll(".button")) {
        if (button.childElementCount) continue;
        const text = document.createElement("span");
        text.className = "button-text";
        text.append(...button.childNodes);
        button.append(text);
      }
    }
  }

  function stopFade() {
    for (const animation of animations) animation.cancel();
    animations = [];
    for (const part of contentParts()) part.inert = false;
  }

  // Stop an unfinished page change when the visitor returns to the visible page.
  function cancelPageChange() {
    ++pageNumber;
    if (pageRequest) pageRequest.abort();
    changingPage = false;
    stopFade();
    document.querySelector("main").removeAttribute("aria-busy");
  }

  // Fade and gently move words and pictures, leaving blurred boxes still.
  async function fadeText(appearing) {
    if (reducedMotion.matches || !Element.prototype.animate) return;
    const targets = [];
    for (const part of contentParts()) {
      const items = part.querySelectorAll("h1, h2, h3, h4, p, li, dt, dd, code, img, a, button, .button-text");
      for (const item of items) {
        if (item.matches(".blurred-box, .button") || item.querySelector(".blurred-box, .button")) continue;
        if (!targets.some(target => target.contains(item))) targets.push(item);
      }
    }
    const currentAnimations = targets.map(item => {
      // Nearby rows arrive together. Keep the extra wait short on long pages.
      const top = Math.max(0, item.getBoundingClientRect().top);
      const delay = appearing ? Math.min(90, Math.floor(top / 120) * 18) : 0;
      return item.animate(
        appearing
          ? [{ opacity: 0, translate: "0 12px" }, { opacity: 1, translate: "0 0" }]
          : [{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 -4px" }],
        { duration: appearing ? 360 : 240, delay, fill: "both",
          easing: appearing ? "cubic-bezier(0.22, 0.61, 0.36, 1)" : "cubic-bezier(0.4, 0, 1, 1)" }
      );
    });
    animations.push(...currentAnimations);
    await Promise.all(currentAnimations.map(animation => animation.finished.catch(() => {})));
  }

  // Keep a scroll position with each address for the Back and Forward buttons.
  function rememberScroll() {
    if (changingPage || shownUrl.href !== window.location.href) return;
    window.history.replaceState({ ...window.history.state,
      portfolioScroll: { x: window.scrollX, y: window.scrollY }
    }, "", window.location.href);
  }

  function moveToContent(url, position) {
    if (position) {
      window.scrollTo(position.x, position.y);
      return;
    }
    let target;
    try {
      target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
    } catch {
      // An unreadable heading address just starts at the top of the page.
    }
    if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
    else window.scrollTo(0, 0);
  }

  // Change the navbar links in place, without replacing the actual bar.
  function updateNavbar(nextPage, url) {
    page.classList.toggle("same-nav-page", navigationHeading(shownUrl) === navigationHeading(url));
    const currentLinks = document.querySelectorAll(".top-navbar a");
    const nextLinks = nextPage.querySelectorAll(".top-navbar a");
    currentLinks.forEach((link, index) => {
      for (const name of ["href", "aria-current"]) {
        const value = nextLinks[index].getAttribute(name);
        if (value === null) link.removeAttribute(name);
        else link.setAttribute(name, value);
      }
    });
    try {
      window.sessionStorage.setItem("last-nav-page", navigationHeading(url));
    } catch {
      // Navigation also works if the browser does not allow session storage.
    }
  }

  // Load the HTML first, so the current page stays visible during a slow request.
  async function readPage(url, signal) {
    const key = pageKey(url);
    if (!savedPages.has(key)) {
      const response = await fetch(url.href, { signal, cache: "no-cache" });
      if (!response.ok) throw new Error("The page could not be loaded.");
      savedPages.set(key, await response.text());
    }
    const nextPage = new DOMParser().parseFromString(savedPages.get(key), "text/html");
    if (!nextPage.querySelector("main") || !nextPage.querySelector("footer")
      || nextPage.querySelectorAll(".top-navbar a").length !== document.querySelectorAll(".top-navbar a").length) {
      throw new Error("The page does not have the expected portfolio layout.");
    }
    return nextPage;
  }

  // Start loading the main pictures before showing the new page.
  async function prepareImages(nextPage, url) {
    const pictures = [...nextPage.querySelectorAll('main img:not([loading="lazy"])')].map(img => {
      const picture = new Image();
      picture.src = new URL(img.getAttribute("src"), url).href;
      return picture.decode ? picture.decode().catch(() => {}) : Promise.resolve();
    });
    let timer;
    await Promise.race([Promise.all(pictures), new Promise(resolve => {
      timer = window.setTimeout(resolve, 800);
    })]);
    window.clearTimeout(timer);
  }

  async function openPage(url, addToHistory = true, position) {
    const number = ++pageNumber;
    if (pageRequest) pageRequest.abort();
    stopFade();
    pageRequest = new AbortController();
    const request = pageRequest;
    changingPage = true;
    document.querySelector("main").setAttribute("aria-busy", "true");
    const timeout = window.setTimeout(() => request.abort(), 10000);

    try {
      const nextPage = await readPage(url, request.signal);
      await prepareImages(nextPage, url);
      if (number !== pageNumber) return;
      if (request.signal.aborted) throw new Error("The page request timed out.");
      for (const part of contentParts()) part.inert = true;
      await fadeText(false);
      if (number !== pageNumber) return;

      if (addToHistory) window.history.pushState({ portfolioScroll: null }, "", url.href);
      updateNavbar(nextPage, url);
      for (const name of ["main", "footer"]) {
        document.querySelector(name).replaceWith(document.importNode(nextPage.querySelector(name), true));
      }
      document.title = nextPage.title;
      document.documentElement.lang = nextPage.documentElement.lang;
      document.querySelector('meta[name="description"]').content = nextPage.querySelector('meta[name="description"]').content;
      shownUrl = new URL(url.href);
      stopFade();
      prepareButtons();
      for (const part of contentParts()) part.inert = true;
      moveToContent(url, position);
      document.dispatchEvent(new Event("portfolio-page-change"));
      await fadeText(true);
      if (number !== pageNumber) return;
      stopFade();
      const main = document.querySelector("main");
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    } catch {
      // A failed request falls back to opening the HTML page normally.
      if (number === pageNumber) window.location.assign(url.href);
    } finally {
      window.clearTimeout(timeout);
      if (number === pageNumber) {
        changingPage = false;
        stopFade();
        document.querySelector("main").removeAttribute("aria-busy");
        rememberScroll();
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const heading = navigationHeading(shownUrl);
    try {
      page.classList.toggle("same-nav-page", window.sessionStorage.getItem("last-nav-page") === heading);
      window.sessionStorage.setItem("last-nav-page", heading);
    } catch {
      // The site still works without remembering the previous heading.
    }
    savedPages.set(pageKey(shownUrl), document.documentElement.outerHTML);
    prepareButtons();
    const canLoadPages = ["http:", "https:"].includes(window.location.protocol);
    if (canLoadPages) {
      window.history.scrollRestoration = "manual";
      rememberScroll();
    }

    document.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
        || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href);
      if (!isPortfolioPage(url)) return;

      if (pageKey(url) === pageKey(shownUrl)) {
        if (changingPage) cancelPageChange();
        if (!url.hash) {
          event.preventDefault();
          return;
        }
        if (!canLoadPages) return;
        event.preventDefault();
        rememberScroll();
        if (url.href !== window.location.href) window.history.pushState({ portfolioScroll: null }, "", url.href);
        shownUrl = url;
        moveToContent(url);
        rememberScroll();
        return;
      }
      if (!canLoadPages) return;
      event.preventDefault();
      rememberScroll();
      openPage(url);
    });

    if (!canLoadPages) return;
    window.addEventListener("scroll", rememberScroll, { passive: true });
    window.addEventListener("popstate", event => {
      const url = new URL(window.location.href);
      if (pageKey(url) === pageKey(shownUrl)) {
        cancelPageChange();
        shownUrl = url;
        moveToContent(url, event.state?.portfolioScroll);
        rememberScroll();
      } else {
        openPage(url, false, event.state?.portfolioScroll);
      }
    });
    window.addEventListener("pageshow", () => {
      window.history.scrollRestoration = "manual";
      rememberScroll();
    });
  });
})();
