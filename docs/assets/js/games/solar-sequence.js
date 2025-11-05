const STORAGE_KEY = 'solar-sequence-best';
const HIGHLIGHT_MS = 520;
const STEP_GAP_MS = 680;

export function initSequence() {
  const pads = Array.from(document.querySelectorAll('[data-pad]'));
  const startButton = document.getElementById('sequence-start');
  const levelLabel = document.getElementById('sequence-level');
  const bestLabel = document.getElementById('sequence-best');
  const message = document.getElementById('sequence-message');

  if (!pads.length || !startButton || !levelLabel || !bestLabel || !message) {
    return;
  }

  const storedBest = localStorage.getItem(STORAGE_KEY);

  const state = {
    sequence: [],
    step: 0,
    acceptingInput: false,
    playingBack: false,
    best: storedBest ? Number(storedBest) : 0,
  };

  function updateLabels() {
    const level = state.sequence.length;
    levelLabel.textContent = level ? `Level: ${level}` : 'Level: —';
    bestLabel.textContent = state.best ? `Best: Level ${state.best}` : 'Best: —';
  }

  function flashPad(index) {
    const pad = pads[index];
    if (!pad) {
      return;
    }
    pad.dataset.active = 'true';
    setTimeout(() => {
      pad.dataset.active = 'false';
    }, HIGHLIGHT_MS - 120);
  }

  function enableStart(text) {
    startButton.disabled = false;
    startButton.textContent = text;
  }

  function disableStart(text) {
    startButton.disabled = true;
    startButton.textContent = text;
  }

  function playbackSequence() {
    state.playingBack = true;
    state.acceptingInput = false;
    let index = 0;
    message.textContent = 'Watch the sequence closely…';

    const playNext = () => {
      if (index >= state.sequence.length) {
        state.playingBack = false;
        state.acceptingInput = true;
        state.step = 0;
        message.textContent = 'Your turn! Repeat the sequence.';
        return;
      }

      flashPad(state.sequence[index]);
      index += 1;
      setTimeout(playNext, STEP_GAP_MS);
    };

    playNext();
  }

  function extendSequence() {
    const next = Math.floor(Math.random() * pads.length);
    state.sequence.push(next);
    updateLabels();
    setTimeout(() => {
      playbackSequence();
    }, 420);
  }

  function handleSuccess() {
    const level = state.sequence.length;
    if (level > state.best) {
      state.best = level;
      localStorage.setItem(STORAGE_KEY, String(level));
    }
    updateLabels();
    state.acceptingInput = false;
    message.textContent = 'Nice memory! Get ready for the next pattern…';
    setTimeout(() => {
      extendSequence();
    }, 900);
  }

  function handleFailure() {
    const level = state.sequence.length;
    message.textContent = level > 1
      ? `Signal lost at level ${level}. Tap start to try again!`
      : 'Signal lost immediately. Tap start to try again!';
    enableStart('Play again');
    state.sequence = [];
    state.acceptingInput = false;
    state.playingBack = false;
    state.step = 0;
    updateLabels();
  }

  function onPadTap(event) {
    if (!state.acceptingInput || state.playingBack) {
      return;
    }
    const index = Number(event.currentTarget.dataset.pad);
    if (Number.isNaN(index)) {
      return;
    }

    flashPad(index);

    const expected = state.sequence[state.step];
    if (index !== expected) {
      handleFailure();
      return;
    }

    state.step += 1;

    if (state.step >= state.sequence.length) {
      handleSuccess();
    }
  }

  pads.forEach(pad => {
    pad.addEventListener('pointerdown', event => {
      if (event.isPrimary === false) {
        return;
      }
      onPadTap(event);
    });
    pad.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onPadTap({ currentTarget: pad });
      }
    });
  });

  startButton.addEventListener('click', () => {
    state.sequence = [];
    state.step = 0;
    state.acceptingInput = false;
    disableStart('Playing…');
    message.textContent = 'Initializing pattern…';
    extendSequence();
  });

  enableStart('Start memory test');
  updateLabels();
}
