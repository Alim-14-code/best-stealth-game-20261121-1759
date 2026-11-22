// Vision math for Gilded Shadows: line of sight on the tile grid and
// the guard vision-cone test. All positions are in tile units (floats).
import { blocksSight } from "./levels.js";

// Walk the segment from (x0,y0) to (x1,y1) in small steps; false when a
// sight-blocking tile is crossed. Endpoints are not tested.
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 0.08));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor(x0 + dx * t);
    const ty = Math.floor(y0 + dy * t);
    if (blocksSight(grid, tx, ty)) return false;
  }
  return true;
}

// Smallest absolute angle between two headings, in [0, PI].
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// True when the target sits inside the guard's vision cone and the guard
// can actually see it (range + half-angle + line of sight).
export function canSee(grid, guard, tx, ty, range, halfAngle) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 0.45) return true; // stepped on: no hiding that close
  const bearing = Math.atan2(dy, dx);
  if (angleDiff(bearing, guard.dir) > halfAngle) return false;
  return hasLineOfSight(grid, guard.x, guard.y, tx, ty);
}
