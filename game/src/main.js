// Game loop and state machine for Gilded Shadows.
// States: title -> playing -> levelClear -> (next level) -> win,
// or playing -> caught -> (retry the level). The HUD eye meter shows
// the highest guard suspicion; the overlay shows title / caught / win.
// A ?scene= query param stages one frozen frame for screenshots:
// cover, alarm, sneak, win, or title — the game itself plays normally
// without it.
import { LEVELS, parseLevel, TILE, COLS, ROWS } from "./levels.js";
import { makePlayer, updatePlayer } from "./player.js";
import { makeGuard, updateGuard, guardCaughtPlayer, maxSuspicion } from "./guard.js";
import { drawWorld } from "./render.js";
import { audio } from "./audio.js";
import { makeInput } from "./input.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const hudLevel = document.getElementById("hudLevel");
const hudRelics = document.getElementById("hudRelics");
const hudTimer = document.getElementById("hudTimer");
const eyeBar = document.getElementById("eyeBar");

const game = {
  levelIndex: 0,
  grid: null,
  player: null,
  guards: [],
  loot: [],
  exit: null,
  exitOpen: false,
  relicsGot: 0,
  state: "title", // title | playing | caught | levelClear | win
  elapsed: 0,
  levelTime: 0,
  stepAcc: 0,
  frozen: false,
};

const keys = makeInput();
let lastTs = 0;

function loadLevel(index) {
  const level = LEVELS[index];
  const parsed = parseLevel(level);
  game.levelIndex = index;
  game.grid = parsed.grid;
  game.player = makePlayer(parsed.playerStart);
  game.guards = level.guards.map(makeGuard);
  game.loot = parsed.loot;
  game.exit = parsed.exit;
  game.exitOpen = false;
  game.relicsGot = 0;
  game.levelTime = 0;
  game.state = "playing";
  hudLevel.textContent = `${level.name} — ${level.relics.length} relics`;
  hideOverlay();
  updateHud();
}

function updateHud() {
  const level = LEVELS[game.levelIndex];
  hudRelics.innerHTML = `&#9670; ${game.relicsGot} / ${level.relics.length}`;
  const total = Math.floor(game.elapsed);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  hudTimer.textContent = `${mm}:${ss}`;
  const sus = maxSuspicion(game.guards);
  eyeBar.style.width = `${sus}%`;
  eyeBar.style.background = sus >= 100 ? "#ff463c" : sus >= 60 ? "#ffa53c" : "#f2c14e";
}

function showOverlay(html, buttonLabel, onButton) {
  overlay.innerHTML = html + (buttonLabel ? `<button id="ovBtn">${buttonLabel}</button>` : "");
  overlay.classList.remove("hidden");
  if (buttonLabel) {
    document.getElementById("ovBtn").addEventListener("click", () => {
      audio.unlock();
      onButton();
    });
  }
}

function hideOverlay() {
  overlay.classList.add("hidden");
  overlay.innerHTML = "";
}

function showTitle() {
  game.state = "title";
  showOverlay(
    `<h1>GILDED SHADOWS</h1>
     <h2>You are Wren, relic-thief of the night museum.</h2>
     <p>Three halls. Three relics each. Guards patrol with lantern cones —
     step into the light and their suspicion grows. Crates and statues block
     their sight; shadow rugs hide you; <span class="keys">Shift</span> lets
     you sneak, slow and silent.</p>
     <p>Take every relic, then slip out the green exit — unseen.</p>`,
    "BEGIN THE HEIST",
    () => {
      game.elapsed = 0;
      loadLevel(0);
    },
  );
}

function showCaught() {
  game.state = "caught";
  audio.caught();
  showOverlay(
    `<div class="big alarm">SPOTTED!</div>
     <p>A guard grabbed you in the ${LEVELS[game.levelIndex].name}. The relics
     stay where they were — the hall resets, and so do you.</p>`,
    "TRY AGAIN",
    () => loadLevel(game.levelIndex),
  );
}

function showLevelClear() {
  game.state = "levelClear";
  audio.levelClear();
  const level = LEVELS[game.levelIndex];
  const next = game.levelIndex + 1;
  showOverlay(
    `<div class="big">CLEAN GETAWAY</div>
     <p>You cleared the ${level.name} with all ${level.relics.length} relics —
     ${level.relics.join(", ")} — in ${fmtTime(game.levelTime)}.</p>`,
    next < LEVELS.length ? "NEXT HALL" : "SEE THE SCORE",
    () => {
      if (next < LEVELS.length) loadLevel(next);
      else showWin();
    },
  );
}

function showWin() {
  game.state = "win";
  audio.win();
  const rank =
    game.elapsed < 180 ? "SHADOW MASTER" : game.elapsed < 300 ? "SILENT PROFESSIONAL" : "LUCKY AMATEUR";
  showOverlay(
    `<div class="big">THE VAULT IS YOURS</div>
     <p>All nine relics — Sun Disk to Ivory Mask — lifted without a single
     alarm that stuck. Total time ${fmtTime(game.elapsed)}.</p>
     <p>Rank: <b style="color:#f2c14e">${rank}</b></p>`,
    "PLAY AGAIN",
    () => {
      game.elapsed = 0;
      loadLevel(0);
    },
  );
}

function fmtTime(t) {
  const total = Math.floor(t);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function tick(ts) {
  if (game.frozen) return;
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  if (game.state === "playing") {
    game.elapsed += dt;
    game.levelTime += dt;
    updatePlayer(game.player, keys, game.grid, dt);
    // footsteps tick while walking (not sneaking)
    if (game.player.moving && !game.player.sneaking) {
      game.stepAcc += dt;
      if (game.stepAcc > 0.34) {
        game.stepAcc = 0;
        audio.footstep(false);
      }
    }
    const events = {
      onSpotted: () => audio.alarm(),
      onCalmed: () => audio.calmed(),
    };
    for (const g of game.guards) updateGuard(g, game.player, game.grid, dt, events);
    // relic pickup
    const px = Math.floor(game.player.x);
    const py = Math.floor(game.player.y);
    for (const item of game.loot) {
      if (!item.taken && item.x === px && item.y === py) {
        item.taken = true;
        game.relicsGot++;
        audio.pickup();
        if (game.relicsGot === game.loot.length) game.exitOpen = true;
      }
    }
    // exit
    if (game.exitOpen && px === game.exit.x && py === game.exit.y) {
      showLevelClear();
    } else if (guardCaughtPlayer(game.guards, game.player)) {
      showCaught();
    }
    updateHud();
  }
  drawWorld(ctx, game);
  requestAnimationFrame(tick);
}

// --- screenshot staging: ?scene=cover|alarm|sneak|win|title -------------
// Builds one frozen, readable frame of the real game for screenshots.
function stageScene(scene) {
  const params = new URLSearchParams(window.location.search);
  const name = scene || params.get("scene");
  if (!name) return false;
  game.frozen = true;
  if (name === "title") {
    loadLevel(0);
    game.state = "title";
    showTitle();
    drawWorld(ctx, game);
    return true;
  }
  if (name === "win") {
    loadLevel(0);
    game.elapsed = 163;
    game.relicsGot = 3;
    updateHud();
    showWin();
    drawWorld(ctx, game);
    return true;
  }
  if (name === "cover") {
    loadLevel(0);
    // Wren crouched near a crate, two cones sweeping the hall.
    game.player.x = 4.5;
    game.player.y = 3.5;
    game.player.dir = Math.PI / 2;
    game.player.sneaking = true;
    game.guards[0].x = 10.5;
    game.guards[0].y = 2.5;
    game.guards[0].dir = Math.PI;
    game.guards[1].x = 12.5;
    game.guards[1].y = 9.5;
    game.guards[1].dir = -Math.PI / 2;
    game.loot[0].taken = true;
    game.relicsGot = 1;
    game.elapsed = 47;
    updateHud();
    drawWorld(ctx, game);
    return true;
  }
  if (name === "alarm") {
    loadLevel(1);
    // Caught at the edge of a cone: suspicion high, guard staring.
    game.player.x = 11.5;
    game.player.y = 5.5;
    game.player.dir = Math.PI;
    game.guards[0].x = 9.5;
    game.guards[0].y = 5.5;
    game.guards[0].dir = 0;
    game.guards[0].suspicion = 82;
    game.guards[0].state = "stare";
    game.guards[1].x = 15.5;
    game.guards[1].y = 8.5;
    game.guards[1].dir = Math.PI / 2;
    game.loot[0].taken = true;
    game.loot[1].taken = true;
    game.relicsGot = 2;
    game.elapsed = 118;
    updateHud();
    drawWorld(ctx, game);
    return true;
  }
  if (name === "sneak") {
    loadLevel(2);
    // Wren flat on a shadow rug as a cone sweeps past.
    game.player.x = 7.5;
    game.player.y = 5.5;
    game.player.dir = 0;
    game.player.sneaking = true;
    game.guards[0].x = 11.5;
    game.guards[0].y = 5.5;
    game.guards[0].dir = Math.PI;
    game.guards[0].suspicion = 24;
    game.guards[2].x = 9.5;
    game.guards[2].y = 10.5;
    game.guards[2].dir = -Math.PI / 2;
    game.loot[0].taken = true;
    game.relicsGot = 1;
    game.elapsed = 201;
    updateHud();
    drawWorld(ctx, game);
    return true;
  }
  return false;
}

// Any key or click unlocks audio and dismisses the title on Enter/Space.
window.addEventListener("keydown", (e) => {
  audio.unlock();
  if ((e.code === "Enter" || e.code === "Space") && game.state === "title") {
    game.elapsed = 0;
    loadLevel(0);
  }
});
document.getElementById("stage").addEventListener("click", () => audio.unlock());

loadLevel(0);
game.state = "title";
if (!stageScene()) {
  showTitle();
  drawWorld(ctx, game);
  requestAnimationFrame((ts) => {
    lastTs = ts;
    requestAnimationFrame(tick);
  });
}

export { TILE, COLS, ROWS };
