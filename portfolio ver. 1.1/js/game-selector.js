/* Handles the game cards even when their page is loaded by the navigation script. */
(() => {
  let buttonAnimation;

  function stopButtonAnimation() {
    if (buttonAnimation) buttonAnimation.cancel();
    buttonAnimation = null;
  }

  // Check the current page on each click instead of keeping references to old cards.
  document.addEventListener("click", event => {
    const gameAction = document.getElementById("game-action");
    if (!gameAction) return;
    const choice = event.target.closest(".game-choice");
    const gameChoices = document.querySelectorAll(".game-choice");
    const gamePlayButton = gameAction.querySelector(".game-play-button");
    stopButtonAnimation();

    // Clicking away from the cards clears the selection.
    if (!choice) {
      for (const card of gameChoices) card.setAttribute("aria-pressed", "false");
      gameAction.classList.remove("is-visible");
      delete gameAction.dataset.game;
      gamePlayButton.removeAttribute("aria-label");
      return;
    }

    for (const card of gameChoices) card.setAttribute("aria-pressed", String(card === choice));
    gameAction.dataset.game = choice.value;
    gamePlayButton.setAttribute("aria-label", `${choice.value} is coming soon`);
    gameAction.classList.add("is-visible");

    // Starts the fade from below again whenever a game is clicked.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      buttonAnimation = gameAction.querySelector(".game-button-entry").animate(
        [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 350, easing: "ease-out" }
      );
    }
  });

  document.addEventListener("portfolio-page-change", stopButtonAnimation);
})();
