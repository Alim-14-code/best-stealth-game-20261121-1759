// Guard patrol, suspicion and chase for Gilded Shadows.
// A guard walks its waypoints, looks around with a vision cone, and
// grows suspicious when the thief is inside the cone and in sight.
// Suspicion 60+ : the guard stops and stares ("?"). Suspicion 100 :
// full alarm — the guard chases, and touching the thief ends the run.
// Break line of sight and the alarm cools; the guard goes back to patrol.
import { canSee } from "./vision.js";
import { isShadow } from "./levels.js";

export const CONE_RANGE = 5.2; // tiles
export const CONE_HALF_ANGLE = 0.61; // radians (~35 degrees)
export const CHASE_SPEED = 3.0; // tiles per second
export const SUSPICIOUS_AT = 60;
export const ALARM_AT = 100;
const SPOT_RATE = 55; // suspicion per second, point blank
const CALM_RATE = 26; // suspicion lost per second unseen
const ALARM_COOL_TIME = 4.0; // seconds unseen before the alarm drops
const STARE_TIME = 1.1; // seconds a suspicious guard stands and looks

export function makeGuard(def) {
  const [sx, sy] = def.spawn;
  return {
    x: sx + 0.5,
    y: sy + 0.5,
    dir: 0,
    waypoints: def.waypoints.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 })),
    wpIndex: 1 % def.waypoints.length,
    speed: def.speed,
    state: "patrol", // patrol | stare | chase | return
    suspicion: 0,
    alarmTimer: 0,
    stareTimer: 0,
    homeX: sx + 0.5,
    homeY: sy + 0.5,
  };
}

// One guard's tick. player: {x, y, sneaking, moving}; grid: level grid.
// events: optional { onSpotted, onCalmed } callbacks for sound cues.
export function updateGuard(guard, player, grid, dt, events) {
  const seen = canSee(grid, guard, player.x, player.y, CONE_RANGE, CONE_HALF_ANGLE);
  const pt = { x: Math.floor(player.x), y: Math.floor(player.y) };
  const hidden = isShadow(grid, pt.x, pt.y);
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);

  if (seen) {
    // Closer and louder is worse; shadow rugs and sneaking slow the rise.
    let rate = SPOT_RATE * (1.35 - Math.min(1, dist / CONE_RANGE));
    if (hidden) rate *= 0.4;
    if (player.sneaking) rate *= 0.5;
    guard.suspicion = Math.min(ALARM_AT, guard.suspicion + rate * dt);
    guard.alarmTimer = 0;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - CALM_RATE * dt);
    if (guard.state === "chase") {
      guard.alarmTimer += dt;
      if (guard.alarmTimer >= ALARM_COOL_TIME) {
        guard.state = "return";
        guard.alarmTimer = 0;
        if (events && events.onCalmed) events.onCalmed();
      }
    }
  }

  const wasState = guard.state;
  if (guard.suspicion >= ALARM_AT && guard.state !== "chase") {
    guard.state = "chase";
    if (events && events.onSpotted) events.onSpotted();
  } else if (guard.state === "patrol" && guard.suspicion >= SUSPICIOUS_AT) {
    guard.state = "stare";
    guard.stareTimer = STARE_TIME;
  }

  if (guard.state === "chase") {
    stepToward(guard, player.x, player.y, CHASE_SPEED * dt);
    guard.dir = Math.atan2(player.y - guard.y, player.x - guard.x);
  } else if (guard.state === "stare") {
    guard.dir = Math.atan2(player.y - guard.y, player.x - guard.x);
    guard.stareTimer -= dt;
    if (guard.stareTimer <= 0) {
      guard.state = guard.suspicion >= SUSPICIOUS_AT ? "stare" : "patrol";
      guard.stareTimer = STARE_TIME;
      if (guard.suspicion < SUSPICIOUS_AT) guard.state = "patrol";
    }
  } else if (guard.state === "return") {
    const arrived = stepToward(guard, guard.homeX, guard.homeY, guard.speed * dt);
    guard.dir = Math.atan2(guard.homeY - guard.y, guard.homeX - guard.x);
    if (arrived) {
      guard.state = "patrol";
      guard.wpIndex = nearestWaypoint(guard);
    }
  } else {
    // patrol: walk to the next waypoint, then turn and scan briefly
    const wp = guard.waypoints[guard.wpIndex];
    const arrived = stepToward(guard, wp.x, wp.y, guard.speed * dt);
    if (arrived) {
      guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
    }
    guard.dir = Math.atan2(wp.y - guard.y, wp.x - guard.x);
  }
  return wasState !== guard.state ? guard.state : null;
}

// Move toward a point by at most `step` tiles; true when arrived.
function stepToward(guard, tx, ty, step) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d <= Math.max(step, 0.03)) {
    guard.x = tx;
    guard.y = ty;
    return true;
  }
  guard.x += (dx / d) * step;
  guard.y += (dy / d) * step;
  return false;
}

function nearestWaypoint(guard) {
  let best = 0;
  let bestD = Infinity;
  guard.waypoints.forEach((wp, i) => {
    const d = Math.hypot(wp.x - guard.x, wp.y - guard.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

// True when any chasing guard is close enough to grab the thief.
export function guardCaughtPlayer(guards, player) {
  return guards.some(
    (g) => g.state === "chase" && Math.hypot(g.x - player.x, g.y - player.y) < 0.55,
  );
}

// The highest suspicion across all guards (0-100) for the HUD eye meter.
export function maxSuspicion(guards) {
  return guards.reduce((m, g) => Math.max(m, g.suspicion), 0);
}
