// Player movement and stealth state for Gilded Shadows.
// The player is Wren, the relic thief: a circle on the tile grid that
// slides along walls, walks at full speed, or sneaks (Shift) at half
// speed — quieter and harder for guards to spot.
import { blocksMove, TILE } from "./levels.js";

export const WALK_SPEED = 3.4; // tiles per second
export const SNEAK_SPEED = 1.7; // tiles per second

export function makePlayer(start) {
  return {
    // centre of the start tile, in tile units
    x: start.x + 0.5,
    y: start.y + 0.5,
    dir: 0, // facing angle, radians
    moving: false,
    sneaking: false,
    radius: 0.32, // tiles
  };
}

// Move the player for dt seconds from the held keys; returns nothing.
// keys: {up, down, left, right, sneak} from input.js.
export function updatePlayer(player, keys, grid, dt) {
  let mx = 0;
  let my = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) my -= 1;
  if (keys.down) my += 1;
  player.moving = mx !== 0 || my !== 0;
  player.sneaking = !!keys.sneak && player.moving;
  if (!player.moving) return;
  const len = Math.hypot(mx, my);
  mx /= len;
  my /= len;
  player.dir = Math.atan2(my, mx);
  const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  moveAxis(player, grid, mx * speed * dt, 0);
  moveAxis(player, grid, 0, my * speed * dt);
}

// Slide along one axis, stopping at blocking tiles (circle vs grid).
function moveAxis(player, grid, dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  const r = player.radius;
  const minTx = Math.floor(nx - r);
  const maxTx = Math.floor(nx + r);
  const minTy = Math.floor(ny - r);
  const maxTy = Math.floor(ny + r);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!blocksMove(grid, tx, ty)) continue;
      // closest point of the tile to the circle centre
      const cx = Math.max(tx, Math.min(nx, tx + 1));
      const cy = Math.max(ty, Math.min(ny, ty + 1));
      const ddx = nx - cx;
      const ddy = ny - cy;
      if (ddx * ddx + ddy * ddy < r * r) return; // blocked on this axis
    }
  }
  player.x = nx;
  player.y = ny;
}

// Tile coordinates of the tile the player's centre stands on.
export function playerTile(player) {
  return { x: Math.floor(player.x), y: Math.floor(player.y) };
}

export { TILE };
