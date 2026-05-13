const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── Settings ──
const GRID = 20;       // number of cells
const CELL = canvas.width / GRID;  // pixel size of each cell
let speed = 150;       // ms per tick (lower = faster)

// ── State ──
let snake, direction, nextDirection, food, score, best, gameLoop, paused, alive;

// ── Init ──
function init() {
  snake = [
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 },
  ];
  direction     = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score  = 0;
  paused = false;
  alive  = true;
  speed  = 150;

  best = localStorage.getItem('snakeBest') || 0;
  document.getElementById('score').textContent = 0;
  document.getElementById('best').textContent  = best;

  hideMessage();
  spawnFood();

  clearInterval(gameLoop);
  gameLoop = setInterval(tick, speed);
}

// ── Main tick ──
function tick() {
  if (paused || !alive) return;

  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // Wall collision
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    return endGame();
  }

  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  // Ate food?
  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById('score').textContent = score;

    if (score > best) {
      best = score;
      localStorage.setItem('snakeBest', best);
      document.getElementById('best').textContent = best;
    }

    // Speed up every 5 points
    if (score % 5 === 0 && speed > 60) {
      speed -= 10;
      clearInterval(gameLoop);
      gameLoop = setInterval(tick, speed);
    }

    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

// ── Spawn food ──
function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

// ── Draw ──
function draw() {
  // Background
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid dots (subtle)
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 0; x < GRID; x++) {
    for (let y = 0; y < GRID; y++) {
      ctx.fillRect(x * CELL + CELL/2 - 1, y * CELL + CELL/2 - 1, 2, 2);
    }
  }

  // Food
  const fx = food.x * CELL;
  const fy = food.y * CELL;
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#e94560';
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(fx + CELL/2, fy + CELL/2, CELL/2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snake body
  snake.forEach((seg, i) => {
    const x = seg.x * CELL;
    const y = seg.y * CELL;
    const isHead = i === 0;

    ctx.shadowBlur = isHead ? 20 : 8;
    ctx.shadowColor = '#4ecca3';

    // Gradient from head to tail
    const alpha = 1 - (i / snake.length) * 0.5;
    ctx.fillStyle = isHead
      ? '#4ecca3'
      : `rgba(78, 204, 163, ${alpha})`;

    // Rounded segments
    roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, isHead ? 6 : 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes on head
    if (isHead) {
      ctx.fillStyle = '#1a1a2e';
      const eyeSize = 3;
      const ex1 = x + CELL * 0.3;
      const ex2 = x + CELL * 0.7;
      const ey  = y + CELL * 0.35;
      ctx.beginPath(); ctx.arc(ex1, ey, eyeSize, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex2, ey, eyeSize, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Paused overlay
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4ecca3';
    ctx.font = 'bold 32px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  }
}

// ── Rounded rectangle helper ──
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Game Over ──
function endGame() {
  alive = false;
  clearInterval(gameLoop);

  document.getElementById('messageText').textContent = '💀 GAME OVER';
  document.getElementById('finalScore').textContent  = `You scored ${score} point${score !== 1 ? 's' : ''}!`;
  showMessage();
}

function showMessage() { document.getElementById('message').classList.remove('hidden'); }
function hideMessage() { document.getElementById('message').classList.add('hidden'); }

// ── Keyboard ──
window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W':
      if (direction.y !== 1)  nextDirection = { x: 0, y: -1 }; break;
    case 'ArrowDown':  case 's': case 'S':
      if (direction.y !== -1) nextDirection = { x: 0, y:  1 }; break;
    case 'ArrowLeft':  case 'a': case 'A':
      if (direction.x !== 1)  nextDirection = { x: -1, y: 0 }; break;
    case 'ArrowRight': case 'd': case 'D':
      if (direction.x !== -1) nextDirection = { x:  1, y: 0 }; break;
    case ' ':
      if (!alive) return;
      paused = !paused;
      if (!paused) draw();
      e.preventDefault();
      break;
  }
});

// ── Restart button ──
document.getElementById('restartBtn').addEventListener('click', init);

// ── Start! ──
init();