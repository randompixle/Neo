const STORAGE_KEY = 'solar-slide-best';
const SIZE = 4;
const TOTAL = SIZE * SIZE;

export function initSlide() {
  const grid = document.getElementById('slide-grid');
  const movesLabel = document.getElementById('slide-moves');
  const timeLabel = document.getElementById('slide-time');
  const bestLabel = document.getElementById('slide-best');
  const shuffleButton = document.getElementById('slide-shuffle');
  const message = document.getElementById('slide-message');

  if (!grid || !movesLabel || !timeLabel || !bestLabel || !shuffleButton || !message) {
    return;
  }

  const storedBest = localStorage.getItem(STORAGE_KEY);

  const state = {
    tiles: [],
    emptyIndex: TOTAL - 1,
    moves: 0,
    startTime: 0,
    timerId: 0,
    best: storedBest ? Number(storedBest) : 0,
    solved: false,
  };

  function solvedBoard() {
    return Array.from({ length: TOTAL }, (_, index) => (index + 1) % TOTAL);
  }

  function countInversions(tiles) {
    const arr = tiles.filter(value => value !== 0);
    let inversions = 0;
    for (let i = 0; i < arr.length; i += 1) {
      for (let j = i + 1; j < arr.length; j += 1) {
        if (arr[i] > arr[j]) {
          inversions += 1;
        }
      }
    }
    return inversions;
  }

  function blankRowFromBottom(index) {
    const row = Math.floor(index / SIZE);
    return SIZE - row;
  }

  function isSolvable(tiles) {
    const inversions = countInversions(tiles);
    const rowFromBottom = blankRowFromBottom(tiles.indexOf(0));
    if (SIZE % 2 === 1) {
      return inversions % 2 === 0;
    }
    const blankOnEvenRow = rowFromBottom % 2 === 0;
    return blankOnEvenRow ? inversions % 2 === 1 : inversions % 2 === 0;
  }

  function stopTimer() {
    if (state.timerId) {
      cancelAnimationFrame(state.timerId);
      state.timerId = 0;
    }
  }

  function tick() {
    updateTime();
    if (!state.solved) {
      state.timerId = requestAnimationFrame(tick);
    }
  }

  function startTimer() {
    state.startTime = performance.now();
    stopTimer();
    state.timerId = requestAnimationFrame(tick);
  }

  function updateTime() {
    if (!state.startTime || state.solved) {
      return;
    }
    const seconds = Math.floor((performance.now() - state.startTime) / 1000);
    timeLabel.textContent = `Time: ${seconds}s`;
  }

  function updateLabels() {
    movesLabel.textContent = `Moves: ${state.moves}`;
    updateTime();
    bestLabel.textContent = state.best ? `Best: ${state.best}s` : 'Best: —';
  }

  function render() {
    grid.textContent = '';
    state.tiles.forEach((value, index) => {
      const button = document.createElement('button');
      button.className = 'slide-tile';
      button.type = 'button';
      button.dataset.index = String(index);
      if (value === 0) {
        button.dataset.empty = 'true';
        button.setAttribute('aria-label', 'Empty slot');
        button.textContent = '';
      } else {
        button.textContent = String(value);
        button.setAttribute('aria-label', `Tile ${value}`);
      }
      grid.appendChild(button);
    });
  }

  function isAdjacent(indexA, indexB) {
    const rowA = Math.floor(indexA / SIZE);
    const colA = indexA % SIZE;
    const rowB = Math.floor(indexB / SIZE);
    const colB = indexB % SIZE;
    const rowDiff = Math.abs(rowA - rowB);
    const colDiff = Math.abs(colA - colB);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  function checkSolved() {
    for (let i = 0; i < TOTAL - 1; i += 1) {
      if (state.tiles[i] !== i + 1) {
        return false;
      }
    }
    return state.tiles[TOTAL - 1] === 0;
  }

  function finishGame() {
    state.solved = true;
    stopTimer();
    const elapsed = Math.floor((performance.now() - state.startTime) / 1000);
    if (!state.best || elapsed < state.best) {
      state.best = elapsed;
      localStorage.setItem(STORAGE_KEY, String(state.best));
    }
    updateLabels();
    message.textContent = `Puzzle solved in ${state.moves} moves and ${elapsed}s!`;
  }

  function attemptMove(index) {
    if (state.solved) {
      return;
    }
    if (!isAdjacent(index, state.emptyIndex)) {
      return;
    }

    state.tiles[state.emptyIndex] = state.tiles[index];
    state.tiles[index] = 0;
    state.emptyIndex = index;
    state.moves += 1;

    if (!state.startTime) {
      startTimer();
    }

    render();
    updateLabels();

    if (checkSolved()) {
      finishGame();
    }
  }

  grid.addEventListener('click', event => {
    const target = event.target.closest('.slide-tile');
    if (!target || target.dataset.empty === 'true') {
      return;
    }
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    attemptMove(index);
  });

  grid.addEventListener('keydown', event => {
    const target = event.target.closest('.slide-tile');
    if (!target || target.dataset.empty === 'true') {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    attemptMove(index);
  }, true);

  function shuffleTiles() {
    const solved = solvedBoard();
    let tiles;
    do {
      tiles = solved
        .slice()
        .sort(() => Math.random() - 0.5);
    } while (!isSolvable(tiles) || tiles.every((value, index) => value === solved[index]));

    state.tiles = tiles;
    state.emptyIndex = state.tiles.indexOf(0);
    state.moves = 0;
    state.startTime = 0;
    state.solved = false;
    message.textContent = 'Slide tiles next to the empty slot to restore the grid.';
    stopTimer();
    render();
    updateLabels();
  }

  shuffleButton.addEventListener('click', () => {
    shuffleTiles();
  });

  state.tiles = solvedBoard();
  state.emptyIndex = TOTAL - 1;
  render();
  updateLabels();
  message.textContent = 'Tap shuffle to randomize the energy tiles and begin.';
}
