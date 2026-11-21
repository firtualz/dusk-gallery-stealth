// input.js — keyboard and mouse state for the game.
// Keys are read by name so WASD and the arrow keys both work.

export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    // The most recent click, in canvas pixels, consumed by the game loop.
    click: null,
    // The most recent key pressed, consumed by the game loop (Enter, E, ...).
    pressedKey: null,
  };
}

const KEY_MAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (event) => {
    const field = KEY_MAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    input.pressedKey = event.code;
  });
  window.addEventListener('keyup', (event) => {
    const field = KEY_MAP[event.code];
    if (field) input[field] = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });
  // Keep the game from scrolling the page when it has focus.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}

export function consumeClick(input) {
  const click = input.click;
  input.click = null;
  return click;
}

export function consumePressedKey(input) {
  const key = input.pressedKey;
  input.pressedKey = null;
  return key;
}
