// Keyboard (and click-to-start) input for Gilded Shadows.
// Tracks the held keys as a plain object the game loop reads each tick:
// { up, down, left, right, sneak }. Arrow keys and WASD both work.
export function makeInput() {
  const keys = { up: false, down: false, left: false, right: false, sneak: false };
  const map = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ShiftLeft: "sneak",
    ShiftRight: "sneak",
  };
  const down = (e) => {
    const k = map[e.code];
    if (k) {
      keys[k] = true;
      e.preventDefault();
    }
    if (window.__gildedKey) window.__gildedKey(e.code);
  };
  const up = (e) => {
    const k = map[e.code];
    if (k) {
      keys[k] = false;
      e.preventDefault();
    }
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return keys;
}
