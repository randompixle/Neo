const STORAGE_KEY = 'solar-reaction-best';

export function initReaction() {
  const screen = document.getElementById('reaction-screen');
  const message = document.getElementById('reaction-message');
  const lastLabel = document.getElementById('reaction-last');
  const bestLabel = document.getElementById('reaction-best');
  const reset = document.getElementById('reaction-reset');

  if (!screen || !message || !lastLabel || !bestLabel || !reset) {
    return;
  }

  const state = {
    status: 'idle',
    timeoutId: 0,
    startTime: 0,
    last: null,
    best: Number(localStorage.getItem(STORAGE_KEY) || '0') || null,
  };

  function updateLabels() {
    lastLabel.textContent = `Last: ${state.last != null ? `${state.last}ms` : '—'}`;
    bestLabel.textContent = `Best: ${state.best != null ? `${state.best}ms` : '—'}`;
  }

  function resetState() {
    clearTimeout(state.timeoutId);
    state.timeoutId = 0;
    state.status = 'idle';
    state.startTime = 0;
    screen.dataset.state = '';
    screen.textContent = 'Tap to arm';
    message.textContent = 'Arm the panel, wait for the pulse, then tap as fast as possible.';
  }

  function arm() {
    resetState();
    state.status = 'armed';
    screen.dataset.state = 'armed';
    screen.textContent = 'Wait for the pulse…';
    message.textContent = 'Hold steady. Tapping too early will cancel the run.';
    const delay = 1200 + Math.random() * 2200;
    state.timeoutId = window.setTimeout(() => {
      state.status = 'ready';
      state.startTime = performance.now();
      screen.dataset.state = 'ready';
      screen.textContent = 'GO!';
      message.textContent = 'Tap now!';
    }, delay);
  }

  function recordReaction() {
    const delta = Math.floor(performance.now() - state.startTime);
    state.last = delta;
    if (state.best == null || delta < state.best) {
      state.best = delta;
      localStorage.setItem(STORAGE_KEY, String(state.best));
    }
    updateLabels();
    message.textContent = `Nice! ${delta}ms reaction.`;
    screen.textContent = 'Tap to arm';
    screen.dataset.state = '';
    state.status = 'idle';
  }

  function handleTap() {
    if (state.status === 'idle') {
      arm();
      return;
    }
    if (state.status === 'armed') {
      clearTimeout(state.timeoutId);
      state.timeoutId = 0;
      state.status = 'idle';
      screen.dataset.state = '';
      screen.textContent = 'Too soon!';
      message.textContent = 'Whoops—wait for the pulse to go green next time.';
      return;
    }
    if (state.status === 'ready') {
      recordReaction();
    }
  }

  screen.addEventListener('pointerdown', event => {
    if (event.isPrimary === false) {
      return;
    }
    handleTap();
  });

  reset.addEventListener('click', () => {
    state.best = null;
    state.last = null;
    localStorage.removeItem(STORAGE_KEY);
    updateLabels();
    resetState();
  });

  updateLabels();
  resetState();
}
