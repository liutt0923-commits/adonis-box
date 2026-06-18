const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startBtn = document.querySelector("#startBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const restartBtn = document.querySelector("#restartBtn");

const gridSize = 24;
const tileCount = canvas.width / gridSize;
const startSnake = [
  { x: 9, y: 12 },
  { x: 8, y: 12 },
  { x: 7, y: 12 }
];
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore;
let tickId;
let running;
let paused;
let gameEnded;
let touchStart;

function loadBestScore() {
  const stored = Number(localStorage.getItem("adonis-box-best-score"));
  return Number.isFinite(stored) ? stored : 0;
}

function saveBestScore(value) {
  localStorage.setItem("adonis-box-best-score", String(value));
}

function resetGame() {
  snake = startSnake.map((part) => ({ ...part }));
  direction = directions.right;
  nextDirection = directions.right;
  score = 0;
  running = false;
  paused = false;
  gameEnded = false;
  food = createFood();
  updateScore();
  draw();
  showOverlay("Ready", "Press start");
}

function startGame() {
  if (gameEnded) {
    resetGame();
  }

  if (running && !paused) {
    return;
  }

  running = true;
  paused = false;
  hideOverlay();
  clearInterval(tickId);
  tickId = setInterval(tick, 105);
}

function pauseGame() {
  if (!running) {
    return;
  }

  paused = !paused;
  if (paused) {
    clearInterval(tickId);
    showOverlay("Paused", "Resume");
  } else {
    startGame();
  }
}

function restartGame() {
  clearInterval(tickId);
  resetGame();
  startGame();
}

function tick() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (hitsWall(head) || hitsSnake(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    if (score > bestScore) {
      bestScore = score;
      saveBestScore(bestScore);
    }
    food = createFood();
    updateScore();
  } else {
    snake.pop();
  }

  draw();
}

function createFood() {
  let candidate;
  do {
    candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some((part) => part.x === candidate.x && part.y === candidate.y));

  return candidate;
}

function hitsWall(point) {
  return point.x < 0 || point.y < 0 || point.x >= tileCount || point.y >= tileCount;
}

function hitsSnake(point) {
  return snake.some((part) => part.x === point.x && part.y === point.y);
}

function endGame() {
  clearInterval(tickId);
  running = false;
  paused = false;
  gameEnded = true;
  showOverlay("Game Over", `${score} points`);
}

function setDirection(name) {
  const requested = directions[name];
  if (!requested) {
    return;
  }

  const isReverse = requested.x + direction.x === 0 && requested.y + direction.y === 0;
  if (!isReverse) {
    nextDirection = requested;
  }
}

function draw() {
  drawField();
  drawFood();
  drawSnake();
}

function drawField() {
  ctx.fillStyle = "#20291c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(245, 241, 229, 0.055)";
  ctx.lineWidth = 1;

  for (let line = gridSize; line < canvas.width; line += gridSize) {
    ctx.beginPath();
    ctx.moveTo(line, 0);
    ctx.lineTo(line, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, line);
    ctx.lineTo(canvas.width, line);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    const pad = index === 0 ? 3 : 4;
    ctx.fillStyle = index === 0 ? "#f0f56b" : "#69d17a";
    roundRect(
      part.x * gridSize + pad,
      part.y * gridSize + pad,
      gridSize - pad * 2,
      gridSize - pad * 2,
      6
    );
  });
}

function drawFood() {
  const centerX = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;

  ctx.fillStyle = "#ff5c45";
  ctx.beginPath();
  ctx.arc(centerX, centerY, gridSize * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.beginPath();
  ctx.arc(centerX - 4, centerY - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function updateScore() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function handleKey(event) {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right"
  };

  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key]);
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    running ? pauseGame() : startGame();
  }
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}

function handleTouchEnd(event) {
  if (!touchStart) {
    return;
  }

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  const isHorizontal = Math.abs(dx) > Math.abs(dy);

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
    return;
  }

  setDirection(isHorizontal ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  touchStart = null;
}

document.addEventListener("keydown", handleKey);
canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
restartBtn.addEventListener("click", restartGame);
document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => setDirection(button.dataset.dir));
});

bestScore = loadBestScore();
resetGame();
