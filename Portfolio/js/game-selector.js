/* Shows which browser game was selected while the games are being built. */
const gameChoices = document.querySelectorAll(".game-choice");
const gameAction = document.getElementById("game-action");
const gameButtonEntry = gameAction.querySelector(".game-button-entry");
const gamePlayButton = gameAction.querySelector(".game-play-button");
let buttonAnimation;

for (const choice of gameChoices) {
  choice.addEventListener("click", () => {
    // Marks only the clicked game as selected.
    for (const otherChoice of gameChoices) {
      otherChoice.setAttribute("aria-pressed", String(otherChoice === choice));
    }

    // Changes the button colour to match the selected game and shows it.
    gameAction.dataset.game = choice.value;
    gamePlayButton.setAttribute("aria-label", `${choice.value} is coming soon`);
    gameAction.classList.add("is-visible");

    // Starts the fade from below again whenever a game is clicked.
    if (buttonAnimation) {
      buttonAnimation.cancel();
      buttonAnimation = null;
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      buttonAnimation = gameButtonEntry.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 350, easing: "ease-out" }
      );
    }
  });
}

/* Clears the selection when clicking anywhere outside the game cards. */
document.addEventListener("click", (event) => {
  if (event.target.closest(".game-choice")) {
    return;
  }

  for (const choice of gameChoices) {
    choice.setAttribute("aria-pressed", "false");
  }

  gameAction.classList.remove("is-visible");
  delete gameAction.dataset.game;
  gamePlayButton.removeAttribute("aria-label");

  if (buttonAnimation) {
    buttonAnimation.cancel();
    buttonAnimation = null;
  }
});
