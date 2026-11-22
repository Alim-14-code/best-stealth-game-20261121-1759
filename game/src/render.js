// Canvas rendering for Gilded Shadows: the top-down museum at night.
// Draws the floor, walls, crates, statues and shadow rugs, the guards
// with their vision cones, the thief, the relics and the exit door —
// plus a vignette so the lit floor reads as safe and the dark as danger.
import { TILE, COLS, ROWS } from "./levels.js";
import { CONE_RANGE, CONE_HALF_ANGLE } from "./guard.js";

// Deterministic per-tile shade so the floor varies without random calls.
function tileHash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  return ((h >>> 0) % 100) / 100;
}

function coneColor(state) {
  if (state === "chase") return "255, 70, 60";
  if (state === "stare") return "255, 165, 60";
  return "242, 210, 90";
}

export function drawWorld(ctx, game) {
  const { grid, guards, player, loot, exit, exitOpen } = game;
  ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);
  drawFloor(ctx, grid);
  drawExit(ctx, exit, exitOpen);
  drawLoot(ctx, loot);
  drawCones(ctx, guards);
  drawPlayer(ctx, player);
  drawGuards(ctx, guards);
  drawVignette(ctx);
}

function drawFloor(ctx, grid) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      const v = tileHash(x, y);
      if (t === "wall") {
        ctx.fillStyle = "#2b2738";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#3d3650";
        ctx.fillRect(px, py, TILE, 6);
        ctx.fillStyle = "#221e2c";
        ctx.fillRect(px, py + TILE - 4, TILE, 4);
      } else if (t === "crate") {
        ctx.fillStyle = "#241d16";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#5a4023";
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = "#7a5a33";
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 4);
        ctx.lineTo(px + TILE - 4, py + TILE - 4);
        ctx.moveTo(px + TILE - 4, py + 4);
        ctx.lineTo(px + 4, py + TILE - 4);
        ctx.stroke();
      } else if (t === "statue") {
        ctx.fillStyle = "#1a1626";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#8a6d2f";
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c9a24a";
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f2d98a";
        ctx.beginPath();
        ctx.arc(px + TILE / 2 - 2, py + TILE / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // floor: dark parquet, two alternating tones
        const base = (x + y) % 2 === 0 ? 26 + v * 6 : 21 + v * 6;
        ctx.fillStyle = `rgb(${base + 6}, ${base}, ${base + 14})`;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        if (t === "shadow") {
          // shadow rug: a deep indigo pool that hides the thief
          ctx.fillStyle = "rgba(58, 64, 140, 0.55)";
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.strokeStyle = "rgba(120, 130, 220, 0.35)";
          ctx.strokeRect(px + 5.5, py + 5.5, TILE - 11, TILE - 11);
        }
      }
    }
  }
}

function drawExit(ctx, exit, open) {
  const cx = (exit.x + 0.5) * TILE;
  const cy = (exit.y + 0.5) * TILE;
  ctx.save();
  if (open) {
    ctx.shadowColor = "#39d353";
    ctx.shadowBlur = 22;
    ctx.fillStyle = "#39d353";
  } else {
    ctx.fillStyle = "#5a2e2e";
  }
  ctx.fillRect(cx - 16, cy - 20, 32, 40);
  ctx.restore();
  ctx.fillStyle = open ? "#0d2b12" : "#2b1212";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(open ? "EXIT" : "LOCK", cx, cy + 1);
  ctx.font = "11px sans-serif";
  ctx.fillStyle = open ? "#39d353" : "#c98a8a";
  ctx.fillText(open ? "GO!" : "NEED 3 RELICS", cx, cy + 30);
}

function drawLoot(ctx, loot) {
  for (const item of loot) {
    if (item.taken) continue;
    const cx = (item.x + 0.5) * TILE;
    const cy = (item.y + 0.5) * TILE;
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 280 + item.x);
    ctx.save();
    ctx.shadowColor = "#f2c14e";
    ctx.shadowBlur = 16 * pulse;
    ctx.fillStyle = "#f2c14e";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx, cy + 12);
    ctx.lineTo(cx - 9, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 4, cy);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx - 4, cy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCones(ctx, guards) {
  for (const g of guards) {
    const cx = g.x * TILE;
    const cy = g.y * TILE;
    const range = CONE_RANGE * TILE;
    const rgb = coneColor(g.state);
    const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, range);
    grad.addColorStop(0, `rgba(${rgb}, 0.34)`);
    grad.addColorStop(0.7, `rgba(${rgb}, 0.16)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, range, g.dir - CONE_HALF_ANGLE, g.dir + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
    // cone edge lines, so the boundary reads at a glance
    ctx.strokeStyle = `rgba(${rgb}, 0.5)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(g.dir - CONE_HALF_ANGLE) * range, cy + Math.sin(g.dir - CONE_HALF_ANGLE) * range);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(g.dir + CONE_HALF_ANGLE) * range, cy + Math.sin(g.dir + CONE_HALF_ANGLE) * range);
    ctx.stroke();
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    const cx = g.x * TILE;
    const cy = g.y * TILE;
    // body: navy uniform with a brass helmet dot
    ctx.fillStyle = "#232c4e";
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4a5a8a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#c9a24a";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    // facing tick
    ctx.strokeStyle = "#dfe6ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(g.dir) * 18, cy + Math.sin(g.dir) * 18);
    ctx.stroke();
    // suspicion mark
    if (g.state === "stare" || (g.suspicion >= 60 && g.state !== "chase")) {
      drawMark(ctx, cx, cy - 26, "?", "#ffa53c");
    } else if (g.state === "chase") {
      drawMark(ctx, cx, cy - 26, "!", "#ff463c");
    }
  }
}

function drawMark(ctx, x, y, ch, color) {
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(ch, x, y);
}

function drawPlayer(ctx, player) {
  const cx = player.x * TILE;
  const cy = player.y * TILE;
  ctx.save();
  if (player.sneaking) ctx.globalAlpha = 0.75;
  // cloak: dark teal circle with a lighter hood
  ctx.fillStyle = "#0f3d3a";
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2dd4bf";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#5eead4";
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  // facing tick
  ctx.strokeStyle = "#d1fae5";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(player.dir) * 16, cy + Math.sin(player.dir) * 16);
  ctx.stroke();
  ctx.restore();
}

function drawVignette(ctx) {
  const w = COLS * TILE;
  const h = ROWS * TILE;
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.72);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
