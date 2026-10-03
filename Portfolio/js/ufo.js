/* Sends one ASCII flying saucer across the screen every so often. */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ufo = document.createElement("div");
  ufo.className = "ascii-ufo";
  ufo.setAttribute("aria-hidden", "true");
  const ufoDome = document.createElement("span");
  const ufoLights = document.createElement("span");

  // Each moving character gets its own span so it can fade back at a different time.
  const changingCharacters = [];
  function addCharacters(part, count, gap) {
    const characters = [];
    for (let index = 0; index < count; index++) {
      const character = document.createElement("span");
      character.className = "ufo-changing";
      part.append(character);
      characters.push(character);
      changingCharacters.push(character);
      if (index < count - 1) part.append(document.createTextNode(gap));
    }
    return characters;
  }

  const domeCharacters = addCharacters(ufoDome, 2, "");
  const lightCharacters = addCharacters(ufoLights, 5, "  ");
  ufo.append(
    document.createTextNode("          .----.\n       .-'  "),
    ufoDome,
    document.createTextNode("  '-.\n   ___/____________\\___\n  /  "),
    ufoLights,
    document.createTextNode("     \\\n <______________________>\n      \\____________/"),
  );
  document.body.append(ufo);

  // Change these if the UFO should appear more often or fly faster.
  const minimumWait = 20000;
  const maximumWait = 35000;
  const pixelsPerSecond = 75;
  let nextFlightTimer = 0;
  let animationFrame = 0;
  let lastDrawing = "";
  let mode = "waiting";
  let currentX = 0;
  let currentY = 0;
  let currentTilt = 0;
  let pointerId = null;
  let grabOffsetX = 0;
  let grabOffsetY = 0;
  let lastPointerTime = 0;
  let velocityX = 0;
  let velocityY = 0;
  let flightDirectionX = 1;
  let flightDirectionY = 0;
  let colourTimers = [];
  let returningCharacters = 0;
  let behindCopy = null;
  let behindCharacters = [];
  let layerTimer = 0;

  function limit(value, maximum) {
    return Math.max(-maximum, Math.min(maximum, value));
  }

  function placeUfo() {
    const drawings = behindCopy ? [ufo, behindCopy] : [ufo];
    drawings.forEach((drawing) => {
      drawing.style.left = `${currentX}px`;
      drawing.style.top = `${currentY}px`;
      drawing.style.transform = `translate(-50%, -50%) rotate(${currentTilt}deg)`;
    });
  }

  // A light moves around the rim while the shape of the saucer stays still.
  function drawUfo(now) {
    const lightPosition = Math.floor(now / 450) % 5;
    const dome = Math.floor(now / 1800) % 2 === 0 ? "oo" : "o.";
    const drawing = `${lightPosition}-${dome}`;
    if (drawing === lastDrawing) return;
    lastDrawing = drawing;

    domeCharacters.forEach((character, index) => {
      character.textContent = dome[index];
    });
    lightCharacters.forEach((character, index) => {
      character.textContent = index === lightPosition ? "*" : "o";
    });
    if (behindCopy) {
      changingCharacters.forEach((character, index) => {
        behindCharacters[index].textContent = character.textContent;
      });
    }
  }

  drawUfo(0);

  function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  function clearColourTimers() {
    colourTimers.forEach((timer) => window.clearTimeout(timer));
    colourTimers = [];
  }

  function stopBehindFade() {
    window.clearTimeout(layerTimer);
    layerTimer = 0;
    if (behindCopy) behindCopy.remove();
    behindCopy = null;
    behindCharacters = [];
    ufo.style.transition = "";
  }

  // Fade between two copies so the UFO can move behind the page without a jump.
  function fadeBehindPage() {
    if (mode !== "settling" || behindCopy) return;
    const visibleOpacity = ufo.style.opacity || "0.85";
    const copy = ufo.cloneNode(true);
    copy.classList.remove("is-active", "is-in-front", "is-grabbed");
    copy.style.pointerEvents = "none";
    copy.style.opacity = "0";
    copy.style.transition = "opacity 500ms ease";
    document.body.append(copy);
    behindCopy = copy;
    behindCharacters = Array.from(copy.querySelectorAll(".ufo-changing"));
    ufo.style.transition = "opacity 500ms ease";

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (behindCopy !== copy || mode !== "settling") return;
        ufo.style.opacity = "0";
        copy.style.opacity = visibleOpacity;
        layerTimer = window.setTimeout(() => {
          if (behindCopy !== copy) return;
          ufo.classList.remove("is-in-front");
          ufo.style.transition = "";
          ufo.style.opacity = visibleOpacity;
          copy.remove();
          behindCopy = null;
          behindCharacters = [];
          layerTimer = 0;
        }, 550);
      });
    });
  }

  function resetColours() {
    clearColourTimers();
    stopBehindFade();
    returningCharacters = 0;
    ufo.classList.remove("is-grabbed", "is-in-front");
    changingCharacters.forEach((character) => character.classList.remove("is-red"));
  }

  function fadeColours() {
    returningCharacters = changingCharacters.length;
    ufo.classList.remove("is-grabbed");
    changingCharacters.forEach((character) => {
      const timer = window.setTimeout(() => {
        character.classList.remove("is-red");
      }, randomBetween(600, 2000));
      colourTimers.push(timer);
    });
  }

  // Wait until every character has finished fading before moving behind the page.
  changingCharacters.forEach((character) => {
    character.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "color" || mode !== "settling"
        || character.classList.contains("is-red") || returningCharacters === 0) return;
      returningCharacters -= 1;
      if (returningCharacters === 0) fadeBehindPage();
    });
  });

  function planFlight() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const sideways = Math.random() < 0.5;
    const fromStart = Math.random() < 0.5;
    const length = sideways ? width : height;
    const otherSide = sideways ? height : width;
    const middle = randomBetween(0.4, 0.6) * otherSide;
    const swing = randomBetween(0.17, 0.28) * otherSide * (Math.random() < 0.5 ? -1 : 1);

    function point(along, across) {
      const position = fromStart ? along : length - along;
      return sideways ? { x: position, y: across } : { x: across, y: position };
    }

    // The third turn goes backwards before the UFO carries on and leaves.
    const points = [
      point(-100, middle),
      point(length * randomBetween(0.2, 0.3), middle + swing),
      point(length * randomBetween(0.64, 0.76), middle - swing),
      point(length * randomBetween(0.32, 0.44), middle + swing * 0.55),
      point(length * randomBetween(0.76, 0.87), middle - swing * 0.7),
      point(length + 100, middle),
    ];
    let distance = 0;
    for (let index = 1; index < points.length; index++) {
      distance += Math.hypot(points[index].x - points[index - 1].x,
        points[index].y - points[index - 1].y);
    }

    return { points, duration: Math.min(30000, Math.max(20000, distance / pixelsPerSecond * 1000)) };
  }

  // Joins the points with a soft curve instead of sharp corners.
  function pointOnFlight(flight, progress) {
    const points = flight.points;
    const place = Math.min(progress * (points.length - 1), points.length - 1);
    const part = Math.min(Math.floor(place), points.length - 2);
    const amount = place - part;
    const before = points[Math.max(0, part - 1)];
    const start = points[part];
    const end = points[part + 1];
    const after = points[Math.min(points.length - 1, part + 2)];

    function curve(a, b, c, d) {
      return 0.5 * (2 * b + (-a + c) * amount
        + (2 * a - 5 * b + 4 * c - d) * amount * amount
        + (-a + 3 * b - 3 * c + d) * amount * amount * amount);
    }

    return {
      x: curve(before.x, start.x, end.x, after.x),
      y: curve(before.y, start.y, end.y, after.y),
    };
  }

  function scheduleFlight() {
    window.clearTimeout(nextFlightTimer);
    if (mode !== "waiting" || document.hidden || reducedMotion.matches) return;
    nextFlightTimer = window.setTimeout(startFlight, randomBetween(minimumWait, maximumWait));
  }

  function finishAppearance() {
    mode = "waiting";
    animationFrame = 0;
    resetColours();
    ufo.style.opacity = "0";
    ufo.classList.remove("is-active");
    scheduleFlight();
  }

  function startFlight() {
    if (mode !== "waiting" || document.hidden || reducedMotion.matches) return;
    nextFlightTimer = 0;
    mode = "flying";
    ufo.classList.add("is-active");
    const flight = planFlight();
    let firstFrame;
    let previousFrame;
    currentTilt = 0;

    function moveUfo(now) {
      if (mode !== "flying") return;
      if (firstFrame === undefined) firstFrame = now;
      const progress = Math.min(1, (now - firstFrame) / flight.duration);
      const remaining = 1 - progress;

      // Look a little ahead to see which way the UFO is moving now.
      const position = pointOnFlight(flight, progress);
      const before = pointOnFlight(flight, Math.max(0, progress - 0.012));
      const after = pointOnFlight(flight, Math.min(1, progress + 0.012));
      const xDirection = after.x - before.x;
      const yDirection = after.y - before.y;
      const movement = Math.hypot(xDirection, yDirection);
      if (movement > 0.001) {
        flightDirectionX = xDirection / movement;
        flightDirectionY = yDirection / movement;
      }
      const horizontal = Math.abs(xDirection);
      const vertical = Math.abs(yDirection);
      // Stay level during mostly vertical flight, and bank on sideways turns.
      let bank = 0;
      if (horizontal > vertical) {
        bank = (horizontal - vertical) / (horizontal + vertical);
      }
      const targetTilt = limit(Math.atan2(yDirection, horizontal) * 180 / Math.PI * bank, 10);
      // Ease towards the new tilt so a turn does not snap the saucer around.
      if (previousFrame === undefined) currentTilt = targetTilt;
      else {
        const timePassed = Math.min(50, now - previousFrame);
        currentTilt += (targetTilt - currentTilt) * (1 - Math.exp(-timePassed / 300));
      }
      previousFrame = now;
      drawUfo(now);

      currentX = position.x;
      currentY = position.y;
      placeUfo();
      ufo.style.opacity = Math.min(0.85, progress * 5, remaining * 5).toFixed(2);

      if (progress < 1) animationFrame = window.requestAnimationFrame(moveUfo);
      else finishAppearance();
    }

    animationFrame = window.requestAnimationFrame(moveUfo);
  }

  document.addEventListener("pointerdown", (event) => {
    if (mode !== "flying" && mode !== "settling") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    // The UFO is behind the page, so check where it is before starting a drag.
    const bounds = ufo.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    // Links, buttons, text, and boxes in front of it keep their normal behaviour.
    if (event.target.closest(".top-navbar, .footer, .blurred-box, a, button, input, textarea, select, label, p, h1, h2, h3, img, figure, pre")) return;

    event.preventDefault();
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    mode = "dragging";
    stopBehindFade();
    clearColourTimers();
    returningCharacters = 0;
    ufo.classList.add("is-in-front", "is-grabbed");
    changingCharacters.forEach((character) => character.classList.add("is-red"));
    pointerId = event.pointerId;
    ufo.setPointerCapture(pointerId);

    // Keep the place where the cursor grabbed the UFO under the cursor.
    grabOffsetX = event.clientX - currentX;
    grabOffsetY = event.clientY - currentY;
    lastPointerTime = event.timeStamp;
    velocityX = 0;
    velocityY = 0;
    ufo.style.opacity = "0.85";
  });

  ufo.addEventListener("pointermove", (event) => {
    if (mode !== "dragging" || event.pointerId !== pointerId) return;
    event.preventDefault();
    const timePassed = Math.max(8, Math.min(50, event.timeStamp - lastPointerTime));
    const nextX = event.clientX - grabOffsetX;
    const nextY = event.clientY - grabOffsetY;
    const mouseSpeedX = (nextX - currentX) / timePassed * 1000;
    const mouseSpeedY = (nextY - currentY) / timePassed * 1000;
    velocityX = limit(velocityX * 0.55 + mouseSpeedX * 0.45, 900);
    velocityY = limit(velocityY * 0.55 + mouseSpeedY * 0.45, 900);
    currentX = nextX;
    currentY = nextY;
    const targetTilt = limit(velocityX * 0.03 + velocityY * 0.012, 28);
    currentTilt += (targetTilt - currentTilt) * 0.25;
    placeUfo();
    drawUfo(event.timeStamp);
    lastPointerTime = event.timeStamp;
  });

  function releaseUfo(event) {
    if (mode !== "dragging" || event.pointerId !== pointerId) return;
    event.preventDefault();
    const releasedPointer = pointerId;
    pointerId = null;
    mode = "settling";
    fadeColours();
    if (ufo.hasPointerCapture(releasedPointer)) ufo.releasePointerCapture(releasedPointer);

    // A pause before release takes the force out of the throw.
    const pause = Math.max(0, event.timeStamp - lastPointerTime);
    const remainingForce = Math.exp(-pause / 120);
    velocityX *= remainingForce;
    velocityY *= remainingForce;
    let spin = limit(velocityX * 0.1 + velocityY * 0.05, 160);
    const releaseSpeed = Math.hypot(velocityX, velocityY);
    // The throw moves the UFO briefly, then it returns to its flight direction.
    const cruiseX = flightDirectionX * pixelsPerSecond;
    const cruiseY = flightDirectionY * pixelsPerSecond;
    if (releaseSpeed < 70) {
      velocityX = cruiseX;
      velocityY = cruiseY;
    }
    let previousFrame;

    function swing(now) {
      if (mode !== "settling") return;
      if (previousFrame === undefined) previousFrame = now;
      const seconds = Math.min(0.05, (now - previousFrame) / 1000);
      previousFrame = now;

      currentX += velocityX * seconds;
      currentY += velocityY * seconds;
      // Slow a fast throw to a steady glide, but never stop before an edge.
      const slowdown = 1 - Math.exp(-2.4 * seconds);
      velocityX += (cruiseX - velocityX) * slowdown;
      velocityY += (cruiseY - velocityY) * slowdown;
      spin += (-20 * currentTilt - 4 * spin) * seconds;
      currentTilt += spin * seconds;
      placeUfo();
      drawUfo(now);

      const offscreen = currentX < -120 || currentX > window.innerWidth + 120
        || currentY < -120 || currentY > window.innerHeight + 120;
      if (!offscreen) animationFrame = window.requestAnimationFrame(swing);
      else finishAppearance();
    }

    animationFrame = window.requestAnimationFrame(swing);
  }

  ufo.addEventListener("pointerup", releaseUfo);
  ufo.addEventListener("pointercancel", releaseUfo);
  ufo.addEventListener("lostpointercapture", releaseUfo);

  function stopFlight() {
    window.clearTimeout(nextFlightTimer);
    window.cancelAnimationFrame(animationFrame);
    nextFlightTimer = 0;
    animationFrame = 0;
    mode = "waiting";
    if (pointerId !== null && ufo.hasPointerCapture(pointerId)) {
      ufo.releasePointerCapture(pointerId);
    }
    pointerId = null;
    resetColours();
    ufo.style.opacity = "0";
    ufo.classList.remove("is-active");
  }

  document.addEventListener("visibilitychange", () => {
    stopFlight();
    scheduleFlight();
  });
  reducedMotion.addEventListener("change", () => {
    stopFlight();
    scheduleFlight();
  });
  window.addEventListener("resize", () => {
    stopFlight();
    scheduleFlight();
  }, { passive: true });
  window.addEventListener("pagehide", stopFlight);
  window.addEventListener("pageshow", scheduleFlight);

  scheduleFlight();
})();
