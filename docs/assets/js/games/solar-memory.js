const SYMBOLS = ['☀️','🌙','⭐','🛰️','🪐','🌠','⚡','🚀'];
const STORAGE_KEY = 'solar-memory-best';

export function initMemory() {
  const grid = document.getElementById('memory-grid');
  const movesLabel = document.getElementById('memory-moves');
  const timeLabel = document.getElementById('memory-time');
  const message = document.getElementById('memory-message');
  const restart = document.getElementById('memory-restart');

  if (!grid || !movesLabel || !timeLabel || !message || !restart) {
    return;
  }

  const storedBest = localStorage.getItem(STORAGE_KEY);

  const state = {
    deck: [],
    first: null,
    second: null,
    locked: false,
    moves: 0,
    startTime: 0,
    timerId: 0,
    matched: 0,
    best: storedBest ? Number(storedBest) : null,
  };

  function updateStats() {
    movesLabel.textContent = `Moves: ${state.moves}`;
    const seconds = state.startTime ? Math.floor((performance.now() - state.startTime) / 1000) : 0;
    timeLabel.textContent = `Time: ${seconds}s`;
  }

  function stopTimer() {
    if (state.timerId) {
      cancelAnimationFrame(state.timerId);
      state.timerId = 0;
    }
  }

  function tick() {
    updateStats();
    if (state.matched < state.deck.length) {
      state.timerId = requestAnimationFrame(tick);
    }
  }

  function startTimer() {
    state.startTime = performance.now();
    stopTimer();
    state.timerId = requestAnimationFrame(tick);
  }

  function shuffleDeck() {
    const pairs = SYMBOLS.flatMap(symbol => [symbol, symbol]);
    const deck = pairs
      .map((symbol, index) => ({ id: index, symbol, state: 'hidden' }))
      .sort(() => Math.random() - 0.5);
    state.deck = deck;
  }

  function resetGame() {
    state.moves = 0;
    state.matched = 0;
    state.first = null;
    state.second = null;
    state.locked = false;
    shuffleDeck();
    grid.textContent = '';
    state.deck.forEach((card, index) => {
      const button = document.createElement('button');
      button.className = 'memory-card';
      button.type = 'button';
      button.dataset.index = String(index);
      button.dataset.state = 'hidden';
      button.setAttribute('aria-label', 'Hidden card');
      button.textContent = '';
      grid.appendChild(button);
    });
    message.textContent = 'Flip two energy cells to find a match.';
    updateStats();
    stopTimer();
    state.startTime = 0;
  }

  function reveal(card, element) {
    card.state = 'revealed';
    element.dataset.state = 'revealed';
    element.textContent = card.symbol;
    element.setAttribute('aria-label', `Revealed ${card.symbol}`);
  }

  function hide(card, element) {
    card.state = 'hidden';
    element.dataset.state = 'hidden';
    element.textContent = '';
    element.setAttribute('aria-label', 'Hidden card');
  }

  function match(card, element) {
    card.state = 'matched';
    element.dataset.state = 'matched';
    element.textContent = card.symbol;
    element.setAttribute('aria-label', `Matched ${card.symbol}`);
  }

  function handleMatch() {
    if (!state.first || !state.second) {
      return;
    }
    const firstEl = grid.querySelector(`[data-index="${state.first.index}"]`);
    const secondEl = grid.querySelector(`[data-index="${state.second.index}"]`);
    if (!firstEl || !secondEl) {
      return;
    }

    state.moves += 1;
    if (state.first.card.symbol === state.second.card.symbol) {
      match(state.first.card, firstEl);
      match(state.second.card, secondEl);
      state.matched += 2;
      message.textContent = 'Great match! Keep going.';
      if (state.matched === state.deck.length) {
        stopTimer();
        const elapsed = Math.floor((performance.now() - state.startTime) / 1000);
        const previousBest = state.best;
        if (!previousBest || elapsed < previousBest) {
          state.best = elapsed;
          localStorage.setItem(STORAGE_KEY, String(state.best));
        }
        message.textContent = !previousBest || elapsed < previousBest
          ? `Completed in ${state.moves} moves and ${elapsed}s. New personal best!`
          : `Completed in ${state.moves} moves and ${elapsed}s. Personal best: ${state.best}s.`;
      }
    } else {
      state.locked = true;
      message.textContent = 'No match this time. Try again!';
      setTimeout(() => {
        hide(state.first.card, firstEl);
        hide(state.second.card, secondEl);
        state.locked = false;
      }, 600);
    }

    state.first = null;
    state.second = null;
    updateStats();
  }

  function onCardClick(event) {
    const target = event.target.closest('.memory-card');
    if (!target || state.locked) {
      return;
    }
    const index = Number(target.dataset.index);
    const card = state.deck[index];
    if (!card || card.state !== 'hidden') {
      return;
    }

    if (!state.startTime) {
      startTimer();
    }

    reveal(card, target);

    if (!state.first) {
      state.first = { index, card };
    } else if (!state.second) {
      state.second = { index, card };
      handleMatch();
    }
  }

  grid.addEventListener('click', onCardClick);
  restart.addEventListener('click', () => {
    resetGame();
  });

  resetGame();
}
