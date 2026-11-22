// Level data for Gilded Shadows: tile maps, guard patrols and relic names.
// Legend: '#' wall, '.' floor, 'C' crate (blocks sight + movement),
// 'S' statue (blocks sight + movement), '~' shadow rug (floor, hides you),
// 'L' relic, 'E' exit, 'P' player start. Digits mark guard spawn tiles;
// each guard's patrol waypoints are listed separately, in tile coordinates.
export const TILE = 48;
export const COLS = 20;
export const ROWS = 13;

export const LEVELS = [
  {
    name: "The Gilded Archive",
    sub: "Level 1 — two guards, open floor",
    relics: ["Sun Disk", "Moon Idol", "Star Chalice"],
    map: [
      "####################",
      "#P....#......#....L#",
      "#.....#..C...#.....#",
      "#..C.....#.......#.#",
      "#.....#.....C......#",
      "#.#####..#....###..#",
      "#.....#..~~~#......#",
      "#..L..#..C..#..C...#",
      "#.....#.....#......#",
      "#.C..~~~..#....#...#",
      "#.....#......C..#..#",
      "#..C..#....L..#...E#",
      "####################",
    ],
    guards: [
      { spawn: [7, 1], waypoints: [[7, 1], [12, 1]], speed: 1.5 },
      { spawn: [13, 6], waypoints: [[13, 6], [18, 6]], speed: 1.5 },
    ],
  },
  {
    name: "The Lantern Gallery",
    sub: "Level 2 — three guards, tight corners",
    relics: ["Amber Lens", "Silver Quill", "Jade Scarab"],
    map: [
      "####################",
      "#P...C......#....L.#",
      "#....#..C...#...#..#",
      "#.C..#......C......#",
      "#....#..##..~~~#..##",
      "#..C....#...C......#",
      "#.###......#...##..#",
      "#..~~~C....#.......#",
      "#..L..#..C....C..#.#",
      "#.....#.....##.....#",
      "#.C......C....#..L.#",
      "#....#.....C...#..E#",
      "####################",
    ],
    guards: [
      { spawn: [6, 1], waypoints: [[6, 1], [11, 1]], speed: 1.7 },
      { spawn: [13, 3], waypoints: [[13, 3], [18, 3]], speed: 1.7 },
      { spawn: [1, 2], waypoints: [[1, 2], [1, 10]], speed: 1.8 },
    ],
  },
  {
    name: "The Vault of Echoes",
    sub: "Level 3 — four guards, no safe floor",
    relics: ["Crown of Dusk", "Echo Bell", "Ivory Mask"],
    map: [
      "####################",
      "#P..C....#...C...L.#",
      "#....#......#......#",
      "#.C..#..C.......#..#",
      "#....#.....##...#..#",
      "#..##..~~~.....C...#",
      "#......#...##......#",
      "#.C....#......#.C..#",
      "#...L..C.~~~#...#..#",
      "#..#.....C....C....#",
      "#...~#......#~~.#..#",
      "#.C.L.....#....C..E#",
      "####################",
    ],
    guards: [
      { spawn: [5, 1], waypoints: [[5, 1], [8, 1]], speed: 1.9 },
      { spawn: [13, 2], waypoints: [[13, 2], [18, 2]], speed: 1.9 },
      { spawn: [8, 10], waypoints: [[8, 10], [11, 10]], speed: 1.6 },
      { spawn: [1, 3], waypoints: [[1, 3], [1, 9]], speed: 2.0 },
    ],
  },
];

// Parse one level's map into a grid of tile kinds plus entity placements.
// Returns { grid, playerStart, exit, loot, guardSpawns } with tile coords.
export function parseLevel(level) {
  const grid = [];
  let playerStart = null;
  let exit = null;
  const loot = [];
  const guardSpawns = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    const line = level.map[y];
    for (let x = 0; x < COLS; x++) {
      const ch = line[x];
      if (ch === "#") row.push("wall");
      else if (ch === "C") row.push("crate");
      else if (ch === "S") row.push("statue");
      else if (ch === "~") row.push("shadow");
      else row.push("floor");
      if (ch === "P") playerStart = { x, y };
      else if (ch === "E") exit = { x, y };
      else if (ch === "L") loot.push({ x, y, taken: false });
    }
    grid.push(row);
  }
  return { grid, playerStart, exit, loot, guardSpawns };
}

// A tile blocks movement (walls, crates, statues).
export function blocksMove(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  const t = grid[ty][tx];
  return t === "wall" || t === "crate" || t === "statue";
}

// A tile blocks a guard's sight (walls, crates, statues).
export function blocksSight(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  const t = grid[ty][tx];
  return t === "wall" || t === "crate" || t === "statue";
}

// True when the tile is a shadow rug: detection rises much slower there.
export function isShadow(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
  return grid[ty][tx] === "shadow";
}
