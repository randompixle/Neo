const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function createLevel() {
  const platforms = [
    { x: -200, y: 560, width: 2500, height: 200 },
    { x: 180, y: 440, width: 200, height: 24 },
    { x: 480, y: 360, width: 220, height: 24 },
    { x: 780, y: 300, width: 180, height: 24 },
    { x: 1080, y: 340, width: 240, height: 24 },
    { x: 1140, y: 460, width: 180, height: 24 },
    { x: 1420, y: 380, width: 240, height: 24 },
    { x: 1640, y: 500, width: 300, height: 24 },
    { x: 1920, y: 420, width: 160, height: 24 },
    { x: 2100, y: 320, width: 180, height: 24 },
    { x: 2360, y: 260, width: 200, height: 24 },
  ];

  const walls = [
    { x: -320, y: -400, width: 120, height: 1400 },
    { x: 2720, y: -400, width: 120, height: 1400 },
  ];

  return {
    width: 2600,
    height: 720,
    spawn: { x: 40, y: 480 },
    exit: { x: 2400, y: 200, width: 140, height: 200 },
    boosts: [
      { x: 620, y: 330, radius: 12 },
      { x: 940, y: 270, radius: 12 },
      { x: 1320, y: 360, radius: 12 },
      { x: 1760, y: 480, radius: 12 },
      { x: 2100, y: 300, radius: 12 },
    ],
    hazards: [
      { x: 920, y: 540, width: 180, height: 22 },
      { x: 1580, y: 540, width: 240, height: 22 },
    ],
    platforms: platforms.concat(walls),
  };
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function resolveAxis(entity, amount, platforms, axis) {
  entity[axis] += amount;
  for (const platform of platforms) {
    if (!intersects(entity, platform)) continue;
    if (amount > 0) {
      entity[axis] = platform[axis] - entity[axis === 'x' ? 'width' : 'height'];
    } else if (amount < 0) {
      entity[axis] = platform[axis] + platform[axis === 'x' ? 'width' : 'height'];
    }
    return true;
  }
  return false;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function formatTime(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0.000';
  return (ms / 1000).toFixed(3);
}

export function initSolarSprint() {
  const canvas = document.getElementById('sprint-canvas');
  if (!canvas) return;

  const statusEl = document.getElementById('sprint-status');
  const timerEl = document.getElementById('sprint-timer');
  const bestEl = document.getElementById('sprint-best');
  const resetBtn = document.getElementById('sprint-reset');
  const controls = document.querySelectorAll('[data-control]');

  const ctx = canvas.getContext('2d');
  let viewWidth = canvas.clientWidth || canvas.width;
  let viewHeight = canvas.clientHeight || canvas.height;

  const level = createLevel();
  const player = {
    x: level.spawn.x,
    y: level.spawn.y,
    width: 36,
    height: 42,
    vx: 0,
    vy: 0,
    onGround: false,
    jumpReserve: 0,
  };

  const camera = { x: 0, y: 0 };
  const input = {
    left: false,
    right: false,
    jump: false,
    dash: false,
    prevJump: false,
    prevDash: false,
  };

  const config = {
    gravity: 1800,
    runAcceleration: 2200,
    maxRunSpeed: 420,
    aerialControl: 1400,
    friction: 1600,
    jumpStrength: 620,
    doubleJumpStrength: 560,
    coyoteTime: 110,
    jumpBuffer: 140,
    dashSpeed: 900,
    dashDuration: 120,
    dashCooldown: 480,
  };

  let lastTime = performance.now();
  let coyoteTimer = 0;
  let jumpBufferTimer = 0;
  let dashTimer = 0;
  let dashCooldownTimer = 0;
  let runStartedAt = 0;
  let runFinishedAt = 0;
  let collected = new Set();

  const bestKey = 'solar-sprint-best';
  let bestTime = Number(localStorage.getItem(bestKey) || '0');
  if (bestEl) {
    bestEl.textContent = bestTime ? formatTime(bestTime) : '—';
  }

  function resetRun() {
    player.x = level.spawn.x;
    player.y = level.spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.jumpReserve = 1;
    coyoteTimer = 0;
    jumpBufferTimer = 0;
    dashTimer = 0;
    dashCooldownTimer = 0;
    runStartedAt = 0;
    runFinishedAt = 0;
    collected = new Set();
    if (statusEl) {
      statusEl.textContent = 'Move, jump, or dash to begin the speed trial.';
    }
    updateTimerDisplay();
  }

  function startRunIfNeeded() {
    if (!runStartedAt) {
      runStartedAt = performance.now();
      if (statusEl) {
        statusEl.textContent = 'Fly across the facility and touch the exit beacon!';
      }
    }
  }

  function finishRun() {
    if (!runStartedAt || runFinishedAt) return;
    runFinishedAt = performance.now();
    const total = runFinishedAt - runStartedAt;
    if (statusEl) {
      statusEl.textContent = `Run complete in ${formatTime(total)} seconds! Tap reset to try again.`;
    }
    updateTimerDisplay();
    if (!bestTime || total < bestTime) {
      bestTime = total;
      localStorage.setItem(bestKey, String(bestTime));
      if (bestEl) {
        bestEl.textContent = formatTime(bestTime);
      }
    }
  }

  function handleKey(event, down) {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'a'].includes(key)) {
      input.left = down;
    } else if (['arrowright', 'd'].includes(key)) {
      input.right = down;
    } else if (['arrowup', 'w', ' '].includes(key)) {
      input.jump = down;
      if (down) {
        jumpBufferTimer = config.jumpBuffer;
      }
    } else if (['shift', 'q', 'e'].includes(key)) {
      input.dash = down;
    }
    if (down) {
      startRunIfNeeded();
    }
  }

  window.addEventListener('keydown', event => {
    if (event.repeat) return;
    handleKey(event, true);
  });

  window.addEventListener('keyup', event => {
    handleKey(event, false);
  });

  controls.forEach(control => {
    const action = control.dataset.control;
    const setState = state => {
      switch (action) {
        case 'left':
          input.left = state;
          break;
        case 'right':
          input.right = state;
          break;
        case 'jump':
          input.jump = state;
          if (state) {
            jumpBufferTimer = config.jumpBuffer;
          }
          break;
        case 'dash':
          input.dash = state;
          break;
        default:
          break;
      }
      if (state) {
        startRunIfNeeded();
      }
    };
    const press = () => setState(true);
    const release = () => setState(false);
    control.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (control.setPointerCapture) {
        control.setPointerCapture(event.pointerId);
      }
      press();
    });
    control.addEventListener('pointerup', event => {
      if (control.releasePointerCapture) {
        control.releasePointerCapture(event.pointerId);
      }
      release();
    });
    control.addEventListener('pointercancel', event => {
      if (control.releasePointerCapture) {
        control.releasePointerCapture(event.pointerId);
      }
      release();
    });
    control.addEventListener('lostpointercapture', release);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetRun();
    });
  }

  resetRun();

  function updateTimers(delta) {
    if (player.onGround) {
      coyoteTimer = config.coyoteTime;
      player.jumpReserve = 1;
    } else {
      coyoteTimer = Math.max(0, coyoteTimer - delta);
    }
    jumpBufferTimer = Math.max(0, jumpBufferTimer - delta);
    dashCooldownTimer = Math.max(0, dashCooldownTimer - delta);
    dashTimer = Math.max(0, dashTimer - delta);
  }

  function tryJump() {
    const canCoyote = coyoteTimer > 0;
    const canBuffer = jumpBufferTimer > 0;
    if (!(canBuffer || input.jump) || input.prevJump) {
      return;
    }
    if (player.onGround || canCoyote) {
      player.vy = -config.jumpStrength;
      player.onGround = false;
      coyoteTimer = 0;
      jumpBufferTimer = 0;
      return;
    }
    if (player.jumpReserve > 0) {
      player.vy = -config.doubleJumpStrength;
      player.jumpReserve -= 1;
      jumpBufferTimer = 0;
    }
  }

  function tryDash() {
    if (!input.dash || input.prevDash) return;
    if (dashCooldownTimer > 0 || dashTimer > 0) return;
    const direction = input.right && !input.left
      ? 1
      : input.left && !input.right
        ? -1
        : Math.sign(player.vx) || 1;
    player.vx = direction * config.dashSpeed;
    player.vy = clamp(player.vy, -config.jumpStrength, config.jumpStrength / 1.5);
    dashTimer = config.dashDuration;
    dashCooldownTimer = config.dashCooldown;
  }

  function applyMovement(delta) {
    const seconds = delta / 1000;
    const accel = player.onGround ? config.runAcceleration : config.aerialControl;

    if (dashTimer > 0) {
      // Preserve dash velocity and reduce quickly.
      player.vx *= 0.98;
    } else {
      if (input.left && !input.right) {
        player.vx -= accel * seconds;
      } else if (input.right && !input.left) {
        player.vx += accel * seconds;
      } else {
        const frictionEffect = config.friction * seconds;
        if (Math.abs(player.vx) <= frictionEffect) {
          player.vx = 0;
        } else {
          player.vx -= frictionEffect * Math.sign(player.vx);
        }
      }
      const maxSpeed = player.onGround ? config.maxRunSpeed : config.maxRunSpeed * 1.1;
      player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
    }

    player.vy += config.gravity * seconds;
    player.vy = Math.min(player.vy, 1200);

    const moveX = player.vx * seconds;
    const hitX = resolveAxis(player, moveX, level.platforms, 'x');
    if (hitX) {
      player.vx = 0;
    }

    const moveY = player.vy * seconds;
    const hitY = resolveAxis(player, moveY, level.platforms, 'y');
    if (hitY) {
      if (moveY > 0) {
        player.onGround = true;
      }
      player.vy = 0;
    } else {
      player.onGround = false;
    }
  }

  function updateCamera() {
    const marginX = viewWidth * 0.35;
    const marginY = viewHeight * 0.25;
    const targetX = clamp(player.x + player.width / 2 - marginX, 0, Math.max(0, level.width - viewWidth));
    const targetY = clamp(player.y + player.height / 2 - marginY, 0, Math.max(0, level.height - viewHeight));
    camera.x += (targetX - camera.x) * 0.18;
    camera.y += (targetY - camera.y) * 0.18;
  }

  function collectBoosts() {
    level.boosts.forEach((boost, index) => {
      if (collected.has(index)) return;
      const dx = (player.x + player.width / 2) - boost.x;
      const dy = (player.y + player.height / 2) - boost.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < boost.radius + Math.max(player.width, player.height) / 2) {
        collected.add(index);
        const direction = input.right && !input.left
          ? 1
          : input.left && !input.right
            ? -1
            : Math.sign(player.vx) || 1;
        const preserved = Math.max(Math.abs(player.vx), config.maxRunSpeed * 1.2);
        player.vx = direction * preserved;
        player.vy = Math.min(player.vy, 0) - 360;
        dashCooldownTimer = 0;
        dashTimer = config.dashDuration;
      }
    });
  }

  function checkHazards() {
    const body = { x: player.x, y: player.y, width: player.width, height: player.height };
    for (const hazard of level.hazards) {
      if (intersects(body, hazard)) {
        resetRun();
        return;
      }
    }
  }

  function checkGoal() {
    const body = { x: player.x, y: player.y, width: player.width, height: player.height };
    if (intersects(body, level.exit)) {
      finishRun();
    }
  }

  function updateTimerDisplay() {
    if (!timerEl) return;
    if (runStartedAt && !runFinishedAt) {
      timerEl.textContent = formatTime(performance.now() - runStartedAt);
    } else if (runFinishedAt) {
      timerEl.textContent = formatTime(runFinishedAt - runStartedAt);
    } else {
      timerEl.textContent = '0.000';
    }
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, '#040610');
    gradient.addColorStop(1, '#0d1730');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    ctx.save();
    ctx.translate(-camera.x * 0.3, -camera.y * 0.1);
    ctx.fillStyle = 'rgba(121, 160, 255, 0.1)';
    for (let i = 0; i < 12; i += 1) {
      const width = 240 + i * 60;
      const height = 40 + (i % 3) * 40;
      const x = (i * 260) % (level.width + 260) - 130;
      const y = 80 + (i % 5) * 90;
      drawRoundedRect(ctx, x, y, width, height, 12);
    }
    ctx.restore();
  }

  function drawLevel() {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Hazards
    ctx.fillStyle = 'rgba(255, 80, 100, 0.65)';
    level.hazards.forEach(h => drawRoundedRect(ctx, h.x, h.y, h.width, h.height, 10));

    // Platforms
    ctx.fillStyle = 'rgba(96, 140, 255, 0.55)';
    level.platforms.forEach(platform => {
      drawRoundedRect(ctx, platform.x, platform.y, platform.width, platform.height, 10);
    });

    // Exit beacon
    const beacon = level.exit;
    ctx.save();
    ctx.translate(beacon.x + beacon.width / 2, beacon.y + beacon.height);
    const beamGradient = ctx.createLinearGradient(0, 0, 0, -beacon.height);
    beamGradient.addColorStop(0, 'rgba(160, 220, 255, 0.1)');
    beamGradient.addColorStop(1, 'rgba(160, 220, 255, 0.55)');
    ctx.fillStyle = beamGradient;
    ctx.beginPath();
    ctx.moveTo(-beacon.width / 2, 0);
    ctx.lineTo(0, -beacon.height);
    ctx.lineTo(beacon.width / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8bdcff';
    drawRoundedRect(ctx, -beacon.width / 4, -beacon.height / 2, beacon.width / 2, beacon.height / 2, 12);
    ctx.restore();

    // Boosts
    level.boosts.forEach((boost, index) => {
      if (collected.has(index)) return;
      ctx.fillStyle = 'rgba(255, 220, 140, 0.9)';
      ctx.beginPath();
      ctx.arc(boost.x, boost.y, boost.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player
    ctx.fillStyle = dashTimer > 0 ? '#f6f0ff' : '#e6f1ff';
    drawRoundedRect(ctx, player.x, player.y, player.width, player.height, 8);
    ctx.fillStyle = '#4f7cff';
    drawRoundedRect(ctx, player.x + 6, player.y + 8, player.width - 12, player.height - 16, 6);

    ctx.restore();
  }

  function frame(now) {
    const delta = clamp(now - lastTime, 0, 32);
    lastTime = now;

    if (!runStartedAt && (input.left || input.right || input.jump || input.dash)) {
      startRunIfNeeded();
    }

    updateTimers(delta);
    tryJump();
    tryDash();
    applyMovement(delta);
    collectBoosts();
    checkHazards();
    checkGoal();
    updateTimerDisplay();
    updateCamera();

    drawBackground();
    drawLevel();

    input.prevJump = input.jump;
    input.prevDash = input.dash;

    requestAnimationFrame(frame);
  }

  function resize() {
    const scale = window.devicePixelRatio || 1;
    const maxWidth = Math.min(window.innerWidth - 32, 960);
    const desiredWidth = Math.max(320, maxWidth);
    const aspect = 16 / 9;
    const desiredHeight = desiredWidth / aspect;
    viewWidth = desiredWidth;
    viewHeight = desiredHeight;
    canvas.width = desiredWidth * scale;
    canvas.height = desiredHeight * scale;
    canvas.style.width = `${desiredWidth}px`;
    canvas.style.height = `${desiredHeight}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
}
