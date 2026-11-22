# Gilded Shadows — a stealth game

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Alim-14-code/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Alim-14-code/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

Entry for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759) ($50, top 10 share the pot).

You are **Wren**, relic-thief of the night museum. Three halls, three relics
each, guards patrolling with lantern vision cones. Step into the light and
their suspicion grows — a "?" means they are staring, a "!" means the alarm
is up and they are coming for you. Crates and statues block their sight,
shadow rugs hide you, and **Shift** lets you sneak, slow and silent. Take
every relic, then slip out the green exit — unseen.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). No network, no build step, no assets to download.

- **WASD / Arrows** — move
- **Shift** — sneak (half speed, half suspicion, silent footsteps)
- **Enter / click** — start, retry, next hall

## Layout

- `main.ts` — entry program: copies `game/` + `screenshots/` to the output
  dir and writes `dossier.json` with `buildDossier`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `game/index.html` — page shell + HUD
- `game/src/main.js` — game loop, states, screenshot staging (`?scene=`)
- `game/src/levels.js` — the three halls: tile maps, patrols, relic names
- `game/src/vision.js` — line of sight + vision-cone test
- `game/src/player.js` — movement, wall sliding, sneak
- `game/src/guard.js` — patrol, suspicion, stare, chase, cooldown
- `game/src/render.js` — canvas drawing: floor, cones, guards, thief, loot
- `game/src/audio.js` — synthesized Web Audio cues (no audio files)
- `game/src/input.js` — keyboard state
- `screenshots/` — 4 real renders of the game's own code

## Verify locally

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`out/` then holds `game/`, `screenshots/` and `dossier.json`, byte-identical
across runs.

<sub>Entered on [make.fun](https://make.fun/?ref=e6d1qmmj&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
