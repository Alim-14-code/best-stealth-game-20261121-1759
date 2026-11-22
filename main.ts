// Entry program for Gilded Shadows (best-stealth-game-20261121-1759).
// Copies game/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with buildDossier from the
// kit's vendor/makefun-game.ts. Runs twice in the grader and must
// write the same bytes both times, so the copy walks directories in
// sorted order and the dossier is built only from file contents.
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

// Copy a directory tree, entries in code-unit order, files byte for byte.
async function copyTree(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to);
    } else if (entry.isFile()) {
      await writeFile(to, await readFile(from));
    }
  }
}

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await copyTree(join(repoRoot, "game"), join(outDir, "game"));
  await copyTree(join(repoRoot, "screenshots"), join(outDir, "screenshots"));
  const dossier = buildDossier(outDir, CAPS);
  await writeFile(join(outDir, "dossier.json"), dossier);
}

await main();
