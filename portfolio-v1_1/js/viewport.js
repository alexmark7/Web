/* Keep mobile browser toolbars from resizing the painted landscape. */
(() => {
  "use strict";

  const page = document.documentElement;
  const touch = window.matchMedia("(pointer: coarse)");
  const viewport = { width: 0, height: 0, mobile: touch.matches, density: 0 };
  let sizeKey = "";
  let resolution;
  let frame = 0;

  function largeViewportHeight() {
    // A real browser's large viewport includes the area behind collapsed bars.
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none;contain:strict";
    document.body.append(probe);
    const height = probe.getBoundingClientRect().height || window.innerHeight;
    probe.remove();
    return height;
  }

  function measure() {
    frame = 0;
    const width = document.documentElement.clientWidth;
    const mobile = touch.matches;
    const density = window.devicePixelRatio || 1;
    const orientation = window.screen.orientation?.angle
      ?? window.orientation ?? (window.screen.width > window.screen.height ? 90 : 0);
    const size = [width, window.screen.width, window.screen.height, orientation].join(":");
    const sizeChanged = sizeKey !== size;
    const densityChanged = density !== viewport.density;
    // Some in-app browsers resize even lvh when their native bars move. Keep
    // the mobile height until width, orientation or the actual screen changes.
    const height = mobile && viewport.mobile && !sizeChanged
      ? viewport.height : mobile ? largeViewportHeight() : window.innerHeight;
    sizeKey = size;
    if (width === viewport.width && height === viewport.height && mobile === viewport.mobile
      && !sizeChanged && !densityChanged) return;

    Object.assign(viewport, { width, height, mobile, density });
    if (densityChanged) {
      // A monitor/zoom density change need not resize the CSS viewport.
      resolution?.removeEventListener("change", scheduleMeasure);
      resolution = window.matchMedia(`(resolution: ${density}dppx)`);
      resolution.addEventListener("change", scheduleMeasure);
    }
    page.style.setProperty("--scenery-height", `${height}px`);
    // Scenery adapts continuously instead of jumping at the phone or short-
    // landscape breakpoints. Share these weights with CSS and the river painter.
    const layoutWidth = window.innerWidth || width;
    const mobileBlend = Math.max(0, Math.min(1, (768 - layoutWidth) / 168));
    const shortHeight = Math.max(0, Math.min(1, (750 - height) / 100));
    const landscape = Math.max(0, Math.min(1, (layoutWidth / height - 1) / 0.2));
    page.style.setProperty("--scenery-mobile", mobileBlend.toFixed(6));
    page.style.setProperty("--scenery-short", (shortHeight * landscape).toFixed(6));
    page.toggleAttribute("data-stable-viewport", mobile);
    page.toggleAttribute("data-scenery-short", width > height && height <= 650);
    document.dispatchEvent(new Event("portfolio-viewport-change"));
  }

  function scheduleMeasure() {
    if (!frame) frame = window.requestAnimationFrame(measure);
  }

  window.portfolioViewport = viewport;
  measure();
  window.addEventListener("resize", scheduleMeasure, { passive: true });
  window.addEventListener("pageshow", scheduleMeasure);
  window.screen.orientation?.addEventListener("change", scheduleMeasure);
  touch.addEventListener("change", scheduleMeasure);
})();
