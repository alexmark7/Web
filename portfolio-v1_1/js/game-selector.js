/* Game selection, including after a page change. */
(() => {
  "use strict";

  const snakeModuleUrl = new URL("./snake-game.js", document.currentScript.src);
  let openingSnake = false;

  // Check the current page on each click instead of keeping references to old cards.
  document.addEventListener("click", async event => {
    const gameAction = document.getElementById("game-action");
    if (!gameAction || event.target.closest(".snake-dialog")) return;
    const choice = event.target.closest(".game-choice");
    const gameChoices = document.querySelectorAll(".game-choice");
    const gamePlayButton = gameAction.querySelector(".game-play-button");
    const status = document.getElementById("game-status");
    if (event.target.closest(".game-play-button")) {
      if (gameAction.dataset.game !== "Snake" || gamePlayButton.disabled || openingSnake) return;
      openingSnake = true;
      gamePlayButton.setAttribute("aria-busy", "true");
      try {
        const { openSnakeGame } = await import(snakeModuleUrl.href);
        // Navigation may have replaced this page while the module loaded.
        if (gamePlayButton.isConnected && gameAction.dataset.game === "Snake") await openSnakeGame(gamePlayButton);
      } catch {
        if (status?.isConnected) {
          status.classList.remove("visually-hidden");
          status.textContent = "Snake could not load. Please refresh and try again.";
        }
      } finally {
        openingSnake = false;
        gamePlayButton.removeAttribute("aria-busy");
      }
      return;
    }

    // Clicking away from the cards clears the selection.
    if (!choice) {
      if (gameAction.contains(event.target)) return;
      for (const card of gameChoices) card.setAttribute("aria-pressed", "false");
      gameAction.classList.remove("is-visible");
      delete gameAction.dataset.game;
      gamePlayButton.removeAttribute("aria-label");
      if (status) { status.textContent = ""; status.classList.add("visually-hidden"); }
      return;
    }

    for (const card of gameChoices) card.setAttribute("aria-pressed", String(card === choice));
    const playable = choice.value === "Snake";
    gameAction.dataset.game = choice.value;
    gamePlayButton.disabled = !playable;
    gamePlayButton.textContent = playable ? "Play Snake" : "Coming soon";
    gamePlayButton.setAttribute("aria-label", playable ? "Play Snake" : `Coming soon: ${choice.value}`);
    gameAction.classList.add("is-visible");
    if (status) {
      status.classList.add("visually-hidden");
      status.textContent = playable ? "Snake is ready to play." : `${choice.value} is coming soon.`;
    }
  });
})();
