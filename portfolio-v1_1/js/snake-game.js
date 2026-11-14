import { createGame, stepGame, turnSnake, tickDuration, GRID_SIZE, POINTS_PER_CHERRY } from "./snake-engine.js";

const storageKey = "portfolio-snake-scores-v1";
const maximumLongAxis = 80;
const sprite = new Image();
sprite.src = new URL("../images/cherry-sprite.svg", import.meta.url).href;
const spriteReady = sprite.decode().catch(() => {});
let activeGame = null;

function readScores() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(entry => entry && Number.isInteger(entry.cherries)
      && entry.cherries >= 0 && entry.cherries <= GRID_SIZE * maximumLongAxis - 3
      && entry.score === entry.cherries * POINTS_PER_CHERRY)
      .sort((a, b) => b.score - a.score).slice(0, 5);
  } catch {
    return [];
  }
}

class SnakeGame {
  constructor(trigger) {
    this.trigger = trigger;
    this.game = createGame();
    this.scores = readScores();
    this.timer = 0;
    this.recorded = false;
    this.closed = false;
    this.listeners = new AbortController();
    this.dialog = document.createElement("dialog");
    this.dialog.className = "snake-dialog";
    this.dialog.dataset.state = "ready";
    this.dialog.setAttribute("aria-labelledby", "snake-title");
    this.dialog.innerHTML = `
      <header class="snake-topbar">
        <h2 id="snake-title">Snake</h2>
        <div class="snake-actions">
          <button class="button" type="button" data-pause disabled>Pause</button>
          <button class="button snake-exit" type="button" data-exit>Exit game <span aria-hidden="true">×</span></button>
        </div>
      </header>
      <div class="snake-play-area">
        <div class="snake-board">
          <dl class="snake-stats" aria-label="Game score">
            <div><dt>Score</dt><dd data-score>0</dd></div>
            <div><dt>Best</dt><dd data-best>0</dd></div>
          </dl>
          <canvas width="400" height="400" tabindex="0" role="img" aria-label="Snake board. Move with arrow keys or W A S D. Eat cherries and avoid the walls and your tail.">Snake needs a browser with canvas support.</canvas>
        </div>
        <div class="snake-state">
          <div class="snake-state-content">
            <img src="${sprite.src}" width="42" height="42" alt="" class="snake-state-cherry">
            <h3 data-state-title>Ready to play?</h3>
            <p data-state-description>Collect cherries. Grow your snake.<br>Keep clear of the border and your tail.</p>
            <button class="button snake-start" type="button" data-start autofocus>Start game</button>
            <details class="snake-scoreboard">
              <summary>Your top five</summary>
              <p class="snake-score-note">Each cherry earns ${POINTS_PER_CHERRY} points. Your top five stay in this browser.</p>
              <table>
                <caption class="visually-hidden">Your five highest Snake scores</caption>
                <thead><tr><th scope="col">#</th><th scope="col">Score</th><th scope="col">Cherries</th></tr></thead>
                <tbody data-scores></tbody>
              </table>
              <p class="snake-score-note" data-empty>No scores yet. Make your first run count.</p>
            </details>
          </div>
        </div>
      </div>
      <footer class="snake-game-controls">
        <p><span class="snake-help-keyboard">Arrows / WASD <span aria-hidden="true">·</span> Space to pause</span><span class="snake-help-touch">Swipe or use arrows</span></p>
        <div class="snake-touch-controls" role="group" aria-label="Snake direction controls">
          <button type="button" data-direction="up" aria-label="Move up" disabled>↑</button>
          <button type="button" data-direction="left" aria-label="Move left" disabled>←</button>
          <button type="button" data-direction="down" aria-label="Move down" disabled>↓</button>
          <button type="button" data-direction="right" aria-label="Move right" disabled>→</button>
        </div>
      </footer>
      <p class="visually-hidden" role="status" aria-live="polite" data-announcement></p>`;
    this.canvas = this.dialog.querySelector("canvas");
    this.context = this.canvas.getContext("2d");
    this.board = this.dialog.querySelector(".snake-board");
    this.arena = this.dialog.querySelector(".snake-play-area");
    this.statePanel = this.dialog.querySelector(".snake-state");
    this.pauseButton = this.dialog.querySelector("[data-pause]");
  }

  listen(target, event, callback, options = {}) {
    target.addEventListener(event, callback, { ...options, signal: this.listeners.signal });
  }

  open() {
    this.scrollPosition = { x: window.scrollX, y: window.scrollY };
    document.body.append(this.dialog);
    document.documentElement.classList.add("snake-open");
    this.dialog.showModal();
    this.listen(this.dialog, "cancel", event => { event.preventDefault(); this.close(); });
    this.listen(this.dialog, "close", () => this.close());
    this.listen(this.dialog.querySelector("[data-exit]"), "click", () => this.close());
    this.listen(this.dialog.querySelector("[data-start]"), "click", () => this.start());
    this.listen(this.pauseButton, "click", () => this.togglePause());
    this.listen(this.dialog, "keydown", event => this.onKey(event));
    for (const button of this.dialog.querySelectorAll("[data-direction]")) {
      this.listen(button, "pointerdown", event => {
        event.preventDefault();
        turnSnake(this.game, button.dataset.direction);
      });
      this.listen(button, "click", event => {
        if (event.detail === 0) turnSnake(this.game, button.dataset.direction);
      });
    }
    let swipe = null;
    this.listen(this.board, "pointerdown", event => {
      if (this.game.status !== "running" || event.target.closest("button")) return;
      swipe = { x: event.clientX, y: event.clientY, id: event.pointerId };
      this.board.setPointerCapture(event.pointerId);
    });
    this.listen(this.board, "pointerup", event => {
      if (!swipe || swipe.id !== event.pointerId) return;
      const x = event.clientX - swipe.x;
      const y = event.clientY - swipe.y;
      swipe = null;
      if (Math.max(Math.abs(x), Math.abs(y)) < 12) return;
      turnSnake(this.game, Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : (y > 0 ? "down" : "up"));
    });
    this.listen(this.board, "pointercancel", () => { swipe = null; });
    this.listen(document, "visibilitychange", () => { if (document.hidden) this.pause(); });
    this.listen(window, "blur", () => this.pause());
    this.listen(window, "pagehide", () => this.close());
    this.listen(document, "portfolio-page-change", () => this.close());
    this.listen(document, "portfolio-theme-change", () => this.draw());
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.arena);
    this.listen(document, "portfolio-viewport-change", () => this.resize());
    this.renderScores();
    this.updateStats();
    this.resize();
  }

  announce(text) {
    this.dialog.querySelector("[data-announcement]").textContent = text;
  }

  start() {
    if (this.game.status !== "paused") {
      this.createRound();
      this.recorded = false;
    }
    this.game.status = "running";
    this.dialog.dataset.state = "running";
    this.statePanel.hidden = true;
    this.pauseButton.disabled = false;
    this.pauseButton.textContent = "Pause";
    for (const button of this.dialog.querySelectorAll("[data-direction]")) button.disabled = false;
    this.updateStats();
    this.resize();
    this.canvas.focus({ preventScroll: true });
    this.announce("Game started. Use arrow keys or WASD to collect cherries.");
    this.scheduleTick();
  }

  scheduleTick() {
    window.clearTimeout(this.timer);
    if (this.game.status !== "running" || this.closed) return;
    this.timer = window.setTimeout(() => {
      if (document.hidden) { this.pause(); return; }
      const event = stepGame(this.game);
      if (event === "cherry") {
        this.updateStats();
        this.announce(`Cherry collected. Score: ${this.game.score}.`);
      }
      this.draw();
      if (this.game.status === "over" || this.game.status === "won") {
        this.saveScore();
        this.showState(this.game.status);
      } else this.scheduleTick();
    }, tickDuration(this.game));
  }

  pause() {
    if (this.game.status !== "running") return;
    window.clearTimeout(this.timer);
    this.game.status = "paused";
    this.game.turns = [];
    this.showState("paused");
  }

  togglePause() {
    if (this.game.status === "paused") this.start();
    else this.pause();
  }

  showState(state) {
    this.dialog.dataset.state = state;
    const title = state === "paused" ? "Take a breather" : state === "won" ? "A perfect harvest!" : "Game over";
    const description = state === "paused" ? "Your snake is waiting. Resume when you’re ready."
      : `${this.game.score} points · ${this.game.cherries} ${this.game.cherries === 1 ? "cherry" : "cherries"} collected.`;
    this.dialog.querySelector("[data-state-title]").textContent = title;
    this.dialog.querySelector("[data-state-description]").textContent = description;
    const start = this.dialog.querySelector("[data-start]");
    start.textContent = state === "paused" ? "Resume game" : "Play again";
    this.pauseButton.disabled = state !== "paused";
    this.pauseButton.textContent = state === "paused" ? "Resume" : "Pause";
    for (const button of this.dialog.querySelectorAll("[data-direction]")) button.disabled = true;
    this.statePanel.hidden = false;
    this.announce(`${title}. ${description}`);
    start.focus({ preventScroll: true });
  }

  onKey(event) {
    const direction = { ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left", w: "up", d: "right", s: "down", a: "left" }[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (direction) {
      event.preventDefault();
      turnSnake(this.game, direction);
    } else if (event.key.toLowerCase() === "p" || (event.code === "Space" && !event.target.closest("button, summary"))) {
      event.preventDefault();
      if (!event.repeat) this.togglePause();
    }
  }

  updateStats() {
    this.dialog.querySelector("[data-score]").textContent = this.game.score;
    this.dialog.querySelector("[data-best]").textContent = Math.max(this.game.score, this.scores[0]?.score || 0);
  }

  saveScore() {
    if (this.recorded || this.game.status === "ready") return;
    this.recorded = true;
    this.scores.push({ score: this.game.score, cherries: this.game.cherries });
    this.scores.sort((a, b) => b.score - a.score);
    this.scores = this.scores.slice(0, 5);
    try {
      localStorage.setItem(storageKey, JSON.stringify(this.scores));
    } catch {
      this.dialog.querySelector(".snake-score-note").textContent = "Your top five this session.";
    }
    this.renderScores();
    this.updateStats();
  }

  renderScores() {
    const body = this.dialog.querySelector("[data-scores]");
    body.replaceChildren();
    for (const [index, score] of this.scores.entries()) {
      const row = document.createElement("tr");
      for (const value of [index + 1, score.score, score.cherries]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    }
    this.dialog.querySelector("[data-empty]").hidden = this.scores.length > 0;
  }

  availableArea() {
    const top = Number.parseFloat(getComputedStyle(this.arena).paddingTop) || 0;
    return { width: this.arena.clientWidth, height: this.arena.clientHeight - top };
  }

  createRound() {
    const { width, height } = this.availableArea();
    const ratio = width / Math.max(1, height);
    const columns = ratio > 1 ? Math.min(maximumLongAxis, Math.floor(GRID_SIZE * ratio)) : GRID_SIZE;
    const rows = ratio < 1 ? Math.min(maximumLongAxis, Math.floor(GRID_SIZE / ratio)) : GRID_SIZE;
    this.game = createGame(Math.random, { columns, rows });
  }

  resize() {
    if (this.closed) return;
    const { width, height } = this.availableArea();
    if (width <= 2 || height <= 2) return;
    if (this.game.status === "ready") this.createRound();
    const { columns, rows } = this.game;
    // A running round keeps its grid and progress. Fit it with square cells
    // when a toolbar changes height or the device rotates.
    const cell = Math.min((width - 2) / columns, (height - 2) / rows);
    const boardWidth = columns * cell;
    const boardHeight = rows * cell;
    this.board.style.width = `${boardWidth + 2}px`;
    this.board.style.height = `${boardHeight + 2}px`;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const pixelsWide = Math.max(1, Math.round(boardWidth * density));
    const pixelsHigh = Math.max(1, Math.round(boardHeight * density));
    if (this.canvas.width !== pixelsWide || this.canvas.height !== pixelsHigh) {
      this.canvas.width = pixelsWide;
      this.canvas.height = pixelsHigh;
    }
    this.canvas.dataset.columns = columns;
    this.canvas.dataset.rows = rows;
    this.draw();
  }

  draw() {
    const context = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cell = Math.min(width / this.game.columns, height / this.game.rows);
    const style = getComputedStyle(this.dialog);
    const color = name => style.getPropertyValue(`--snake-${name}`).trim();
    // The landscape is the board's backdrop; only grid, snake and fruit paint.
    context.clearRect(0, 0, width, height);
    context.strokeStyle = color("grid");
    context.lineWidth = Math.max(1, cell / 25);
    context.beginPath();
    for (let index = 1; index < this.game.columns; index++) {
      context.moveTo(index * cell, 0); context.lineTo(index * cell, height);
    }
    for (let index = 1; index < this.game.rows; index++) {
      context.moveTo(0, index * cell); context.lineTo(width, index * cell);
    }
    context.stroke();
    context.strokeStyle = color("outline");
    context.lineWidth = Math.max(1, cell * 0.035);
    for (const [index, segment] of this.game.snake.entries()) {
      context.fillStyle = color(index === 0 ? "head" : "body");
      context.fillRect(segment.x * cell + 1, segment.y * cell + 1, cell - 2, cell - 2);
      context.strokeRect(segment.x * cell + 1, segment.y * cell + 1, cell - 2, cell - 2);
    }
    const head = this.game.snake[0];
    const eyes = { right: [[0.73, 0.3], [0.73, 0.7]], left: [[0.27, 0.3], [0.27, 0.7]], up: [[0.3, 0.27], [0.7, 0.27]], down: [[0.3, 0.73], [0.7, 0.73]] }[this.game.direction];
    context.fillStyle = color("eye");
    for (const [x, y] of eyes) context.fillRect((head.x + x) * cell - cell * 0.065, (head.y + y) * cell - cell * 0.065, cell * 0.13, cell * 0.13);
    if (this.game.cherry) {
      const x = this.game.cherry.x * cell;
      const y = this.game.cherry.y * cell;
      if (sprite.complete && sprite.naturalWidth) context.drawImage(sprite, x + cell * 0.04, y + cell * 0.04, cell * 0.92, cell * 0.92);
      else {
        context.fillStyle = "#cf3e52";
        context.beginPath();context.arc(x + cell * 0.4, y + cell * 0.65, cell * 0.23, 0, Math.PI * 2);context.arc(x + cell * 0.68, y + cell * 0.6, cell * 0.23, 0, Math.PI * 2);context.fill();
      }
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    window.clearTimeout(this.timer);
    if (this.game.status === "over" || this.game.status === "won" || this.game.cherries > 0) this.saveScore();
    this.listeners.abort();
    this.resizeObserver?.disconnect();
    this.dialog.close();
    this.dialog.remove();
    document.documentElement.classList.remove("snake-open");
    if (this.trigger.isConnected) {
      window.scrollTo(this.scrollPosition.x, this.scrollPosition.y);
      this.trigger.focus({ preventScroll: true });
    }
    activeGame = null;
  }
}

export async function openSnakeGame(trigger) {
  if (activeGame) return;
  await spriteReady;
  if (!trigger.isConnected || trigger.disabled || trigger.closest("#game-action")?.dataset.game !== "Snake" || activeGame) return;
  activeGame = new SnakeGame(trigger);
  activeGame.open();
}
