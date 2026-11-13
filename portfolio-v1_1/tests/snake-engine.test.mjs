import test from "node:test";
import assert from "node:assert/strict";
import { createGame, stepGame, turnSnake, tickDuration } from "../js/snake-engine.js";

function runningGame() {
  const game = createGame(() => 0);
  game.status = "running";
  return game;
}

test("the snake does not move before Start or while paused", () => {
  const game = createGame();
  const initial = structuredClone(game);
  assert.equal(stepGame(game), null);
  assert.deepEqual(game, initial);
  game.status = "paused";
  assert.equal(stepGame(game), null);
  assert.equal(turnSnake(game, "up"), false);
});

test("a cherry grows the snake, adds ten points, and respawns in an empty cell", () => {
  const game = runningGame();
  game.cherry = { x: 11, y: 10 };
  assert.equal(stepGame(game, () => 0.5), "cherry");
  assert.equal(game.snake.length, 4);
  assert.equal(game.cherries, 1);
  assert.equal(game.score, 10);
  assert.ok(!game.snake.some(cell => cell.x === game.cherry.x && cell.y === game.cherry.y));
});

test("ordinary movement keeps the length and score", () => {
  const game = runningGame();
  assert.equal(stepGame(game), "move");
  assert.deepEqual(game.snake[0], { x: 11, y: 10 });
  assert.equal(game.snake.length, 3);
  assert.equal(game.score, 0);
});

test("opposite directions are rejected and quick valid turns are applied on separate ticks", () => {
  const game = runningGame();
  assert.equal(turnSnake(game, "left"), false);
  assert.equal(turnSnake(game, "up"), true);
  assert.equal(turnSnake(game, "down"), false);
  assert.equal(turnSnake(game, "left"), true);
  assert.equal(turnSnake(game, "down"), false); // At most two buffered turns.
  stepGame(game);
  assert.deepEqual(game.snake[0], { x: 10, y: 9 });
  stepGame(game);
  assert.deepEqual(game.snake[0], { x: 9, y: 9 });
});

test("wall collisions end the run without advancing the snake outside the board", () => {
  const game = runningGame();
  game.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }];
  assert.equal(stepGame(game), "collision");
  assert.equal(game.status, "over");
  assert.deepEqual(game.snake[0], { x: 19, y: 10 });
});

test("hitting the body ends the run", () => {
  const game = runningGame();
  game.direction = "down";
  game.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }];
  assert.equal(stepGame(game), "collision");
  assert.equal(game.status, "over");
});

test("moving into the square the tail is vacating is legal", () => {
  const game = runningGame();
  game.direction = "down";
  game.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }];
  assert.equal(stepGame(game), "move");
  assert.equal(game.status, "running");
  assert.deepEqual(game.snake[0], { x: 5, y: 6 });
});

test("filling the board wins without trying to spawn another cherry", () => {
  const game = runningGame();
  game.columns = 2;
  game.rows = 2;
  game.snake = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
  game.cherry = { x: 1, y: 0 };
  assert.equal(stepGame(game), "cherry");
  assert.equal(game.status, "won");
  assert.equal(game.cherry, null);
  assert.equal(game.snake.length, 4);
});

test("the pace increases in steps and has a lower bound", () => {
  const game = runningGame();
  assert.equal(tickDuration(game), 150);
  game.cherries = 5;
  assert.equal(tickDuration(game), 140);
  game.cherries = 100;
  assert.equal(tickDuration(game), 90);
});

test("wide and tall boards start with a centered snake and can spawn cherries in their far corner", () => {
  for (const dimensions of [{ columns: 30, rows: 12 }, { columns: 8, rows: 32 }]) {
    const game = createGame(() => 0.999999, dimensions);
    assert.equal(game.columns, dimensions.columns);
    assert.equal(game.rows, dimensions.rows);
    assert.deepEqual(game.snake[0], {
      x: Math.floor(dimensions.columns / 2), y: Math.floor(dimensions.rows / 2),
    });
    assert.equal(game.snake.length, 3);
    assert.ok(game.snake.every(cell => cell.x >= 0 && cell.x < game.columns
      && cell.y >= 0 && cell.y < game.rows));
    assert.deepEqual(game.cherry, { x: dimensions.columns - 1, y: dimensions.rows - 1 });
  }
});

test("rectangular walls use the column and row limits independently", () => {
  for (const dimensions of [{ columns: 30, rows: 12 }, { columns: 8, rows: 32 }]) {
    const horizontal = createGame(() => 0, dimensions);
    horizontal.status = "running";
    horizontal.snake = [{ x: horizontal.columns - 2, y: 2 },
      { x: horizontal.columns - 3, y: 2 }, { x: horizontal.columns - 4, y: 2 }];
    assert.equal(stepGame(horizontal), "move");
    assert.equal(horizontal.snake[0].x, horizontal.columns - 1);
    assert.equal(stepGame(horizontal), "collision");

    const vertical = createGame(() => 0, dimensions);
    vertical.status = "running";
    vertical.direction = "down";
    vertical.snake = [{ x: 2, y: vertical.rows - 2 },
      { x: 2, y: vertical.rows - 3 }, { x: 2, y: vertical.rows - 4 }];
    assert.equal(stepGame(vertical), "move");
    assert.equal(vertical.snake[0].y, vertical.rows - 1);
    assert.equal(stepGame(vertical), "collision");
  }
});

test("filling a rectangular board wins with no cherry left to spawn", () => {
  const game = runningGame();
  game.columns = 3;
  game.rows = 2;
  game.snake = [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 },
    { x: 1, y: 1 }, { x: 2, y: 1 }];
  game.cherry = { x: 2, y: 0 };
  assert.equal(stepGame(game), "cherry");
  assert.equal(game.status, "won");
  assert.equal(game.cherry, null);
  assert.equal(game.snake.length, game.columns * game.rows);
});
