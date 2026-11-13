/* Grid rules are separate from drawing and input. */
export const GRID_SIZE = 20;
export const POINTS_PER_CHERRY = 10;

const directions = {
  up: { x: 0, y: -1 }, right: { x: 1, y: 0 },
  down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
};
const sameCell = (a, b) => a.x === b.x && a.y === b.y;

function placeCherry(game, random) {
  const occupied = new Set(game.snake.map(cell => cell.y * game.columns + cell.x));
  const empty = [];
  for (let y = 0; y < game.rows; y++) {
    for (let x = 0; x < game.columns; x++) {
      if (!occupied.has(y * game.columns + x)) empty.push({ x, y });
    }
  }
  return empty.length ? empty[Math.floor(random() * empty.length)] : null;
}

export function createGame(random = Math.random, { columns = GRID_SIZE, rows = GRID_SIZE } = {}) {
  const x = Math.floor(columns / 2);
  const y = Math.floor(rows / 2);
  const game = {
    columns, rows,
    snake: [{ x, y }, { x: x - 1, y }, { x: x - 2, y }],
    direction: "right", turns: [], cherry: null,
    score: 0, cherries: 0, status: "ready",
  };
  game.cherry = placeCherry(game, random);
  return game;
}

export function turnSnake(game, direction) {
  if (game.status !== "running" || !directions[direction] || game.turns.length >= 2) return false;
  const previous = game.turns.at(-1) || game.direction;
  const a = directions[previous];
  const b = directions[direction];
  if (previous === direction || (a.x + b.x === 0 && a.y + b.y === 0)) return false;
  game.turns.push(direction);
  return true;
}

export function stepGame(game, random = Math.random) {
  if (game.status !== "running") return null;
  if (game.turns.length) game.direction = game.turns.shift();
  const direction = directions[game.direction];
  const head = { x: game.snake[0].x + direction.x, y: game.snake[0].y + direction.y };
  const eating = game.cherry && sameCell(head, game.cherry);
  // On an ordinary move the tail vacates its square at the same time.
  const body = eating ? game.snake : game.snake.slice(0, -1);
  if (head.x < 0 || head.y < 0 || head.x >= game.columns || head.y >= game.rows
    || body.some(cell => sameCell(cell, head))) {
    game.status = "over";
    return "collision";
  }
  game.snake.unshift(head);
  if (!eating) {
    game.snake.pop();
    return "move";
  }
  game.cherries++;
  game.score = game.cherries * POINTS_PER_CHERRY;
  game.cherry = placeCherry(game, random);
  if (!game.cherry) game.status = "won";
  return "cherry";
}

export function tickDuration(game) {
  return Math.max(90, 150 - Math.floor(game.cherries / 5) * 10);
}
