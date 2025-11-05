const STORAGE_KEY = 'solar-flappy-highscore';

export function initFlappy() {
  const canvas = document.getElementById('flappy-canvas');
  const startButton = document.getElementById('flappy-start');
  const status = document.getElementById('flappy-status');
  const scoreDisplay = document.getElementById('flappy-score');

  if (!canvas || !startButton || !status || !scoreDisplay) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const state = {
    width: 320,
    height: 480,
    pipes: [],
    bird: null,
    score: 0,
    highScore: Number(localStorage.getItem(STORAGE_KEY) || '0'),
    running: false,
    animationId: null,
    lastTime: 0,
    spawnTimer: 0,
    stars: [],
    physics: {
      gravity: 1800,
      flap: -520,
      speed: 200,
      gap: 140,
      pipeWidth: 60,
      floor: 22,
      spawnInterval: 1400,
    },
  };

  function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${state.score} · Best: ${state.highScore}`;
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function createBird() {
    return {
      x: state.width * 0.25,
      y: state.height * 0.5,
      radius: Math.max(12, state.height * 0.04),
      velocity: 0,
    };
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    const available = parent ? parent.clientWidth : window.innerWidth;
    const displayWidth = Math.max(280, Math.min(480, Math.round(available || 360)));
    const displayHeight = Math.round(displayWidth * 1.5);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.width = displayWidth;
    state.height = displayHeight;

    const heightScale = displayHeight / 520;
    const widthScale = displayWidth / 360;

    state.physics.gravity = 1900 * heightScale;
    state.physics.flap = -620 * heightScale;
    state.physics.speed = 220 * widthScale;
    state.physics.gap = Math.max(120, displayHeight * 0.3);
    state.physics.pipeWidth = Math.max(48, Math.min(74, displayWidth * 0.18));
    state.physics.floor = Math.max(18, displayHeight * 0.045);
    state.physics.spawnInterval = 1250 + Math.max(0, (displayWidth - 320) * 0.8);

    state.stars = Array.from({ length: 18 }, () => ({
      x: Math.random() * displayWidth,
      y: Math.random() * displayHeight,
      r: Math.random() * 1.8 + 0.6,
      alpha: 0.15 + Math.random() * 0.35,
    }));
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, '#111a34');
    gradient.addColorStop(1, '#050a16');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    state.stars.forEach(star => {
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#0d1329';
    const floorY = state.height - state.physics.floor;
    ctx.fillRect(0, floorY, state.width, state.physics.floor);
    ctx.fillStyle = 'rgba(179,136,255,0.28)';
    ctx.fillRect(0, floorY - 2, state.width, 2);
  }

  function drawPipes() {
    ctx.fillStyle = '#2bd67b';
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;

    state.pipes.forEach(pipe => {
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.top);

      const bottomY = pipe.top + pipe.gap;
      ctx.fillRect(pipe.x, bottomY, pipe.width, state.height - bottomY - state.physics.floor);
      ctx.strokeRect(pipe.x, bottomY, pipe.width, state.height - bottomY - state.physics.floor);
    });
  }

  function drawBird() {
    if (!state.bird) {
      return;
    }
    ctx.save();
    ctx.translate(state.bird.x, state.bird.y);
    const angle = Math.max(-0.6, Math.min(0.6, state.bird.velocity / 800));
    ctx.rotate(angle);

    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(0, 0, state.bird.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f7786b';
    ctx.beginPath();
    ctx.arc(-state.bird.radius * 0.4, 0, state.bird.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b1020';
    ctx.beginPath();
    ctx.arc(state.bird.radius * 0.35, -state.bird.radius * 0.25, state.bird.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawOverlay() {
    ctx.save();
    ctx.font = '600 24px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(230,236,255,0.95)';
    ctx.fillText(String(state.score), state.width / 2, 40);

    if (!state.running) {
      ctx.font = '500 18px "Inter", "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(230,236,255,0.7)';
      ctx.fillText('Tap to start flying', state.width / 2, state.height / 2);
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawPipes();
    drawBird();
    drawOverlay();
  }

  function spawnPipe() {
    const gap = state.physics.gap;
    const margin = Math.max(30, state.height * 0.12);
    const floorY = state.height - state.physics.floor;
    const maxTop = floorY - gap - margin;
    const minTop = margin;
    const top = Math.random() * (maxTop - minTop) + minTop;

    state.pipes.push({
      x: state.width + state.physics.pipeWidth,
      top,
      gap,
      width: state.physics.pipeWidth,
      passed: false,
    });
  }

  function applyIdle(message) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
    state.running = false;
    state.score = 0;
    state.spawnTimer = 0;
    state.lastTime = 0;
    state.pipes = [];
    state.bird = createBird();
    updateScoreDisplay();
    startButton.textContent = 'Start flight';
    setStatus(message || 'Tap start or anywhere on the sky to begin. Works great on mobile!');
    draw();
  }

  function endGame(reason) {
    if (!state.running) {
      return;
    }
    state.running = false;
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
    state.lastTime = 0;
    state.spawnTimer = 0;

    let message = reason || 'Mission complete.';
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.highScore));
      message += ` New record: ${state.highScore}!`;
    } else {
      message += ` Score: ${state.score}.`;
    }

    updateScoreDisplay();
    setStatus(message);
    startButton.textContent = 'Try again';
    draw();
  }

  function step(timestamp) {
    if (!state.running) {
      return;
    }

    if (!state.lastTime) {
      state.lastTime = timestamp;
    }
    const delta = Math.min(32, timestamp - state.lastTime);
    state.lastTime = timestamp;
    const seconds = delta / 1000;

    state.spawnTimer += delta;
    if (state.spawnTimer >= state.physics.spawnInterval) {
      state.spawnTimer = 0;
      spawnPipe();
    }

    state.bird.velocity += state.physics.gravity * seconds;
    state.bird.y += state.bird.velocity * seconds;

    const shift = state.physics.speed * seconds;
    state.pipes.forEach(pipe => {
      pipe.x -= shift;
    });
    state.pipes = state.pipes.filter(pipe => pipe.x + pipe.width > -30);

    const floorY = state.height - state.physics.floor;
    if (state.bird.y + state.bird.radius >= floorY) {
      state.bird.y = floorY - state.bird.radius;
      endGame('Mission failed.');
      return;
    }
    if (state.bird.y - state.bird.radius <= 0) {
      state.bird.y = state.bird.radius;
      state.bird.velocity = 0;
    }

    for (const pipe of state.pipes) {
      const withinPipe = pipe.x < state.bird.x + state.bird.radius && pipe.x + pipe.width > state.bird.x - state.bird.radius;
      if (withinPipe) {
        const gapTop = pipe.top;
        const gapBottom = pipe.top + pipe.gap;
        if (state.bird.y - state.bird.radius <= gapTop || state.bird.y + state.bird.radius >= gapBottom) {
          endGame('Mission failed.');
          return;
        }
      }

      if (!pipe.passed && pipe.x + pipe.width < state.bird.x - state.bird.radius) {
        pipe.passed = true;
        state.score += 1;
        updateScoreDisplay();
      }
    }

    draw();
    state.animationId = requestAnimationFrame(step);
  }

  function startGame() {
    state.running = true;
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
    state.score = 0;
    state.spawnTimer = state.physics.spawnInterval * 0.4;
    state.lastTime = 0;
    state.pipes = [];
    state.bird = createBird();
    state.bird.velocity = 0;
    updateScoreDisplay();
    setStatus('Flight engaged! Tap to stay in the air.');
    startButton.textContent = 'Restart flight';
    draw();
    state.animationId = requestAnimationFrame(step);
  }

  function flap() {
    if (!state.running) {
      startGame();
      return;
    }
    state.bird.velocity = state.physics.flap;
  }

  startButton.addEventListener('click', startGame);
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    flap();
  });

  window.addEventListener('keydown', event => {
    if (event.key === ' ' || event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      flap();
    }
  });

  window.addEventListener('resize', () => {
    const wasRunning = state.running;
    resizeCanvas();
    if (wasRunning) {
      applyIdle('Screen resized — tap start to launch again.');
    } else {
      state.bird = createBird();
      draw();
    }
  });

  resizeCanvas();
  applyIdle();
}
