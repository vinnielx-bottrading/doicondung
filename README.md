# WORM LIFE

**Vinh Làm Game** · HTML5 browser game · Phaser 3 + TypeScript + Vite

A tiny earthworm explores a giant garden, stage by stage. The full game design is in
[`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — that document is the source of truth.

## Status — v0.1, Milestone 1 (Playable Core) ✅

| Milestone | State |
|---|---|
| 1. Playable core — scaffold, scene flow, worm movement, terrain, camera, keyboard, resize | **Done** |
| 2. Exploration — organic-matter pickups, discovery, objective progress, stage clear, growth animation, Stage 2 unlock | Next |
| 3. Living world — hazard, rain event, energy/moisture rules, ambience | Planned |
| 4. Save, polish & release — touch QA, audio, credits, Vercel deploy | Planned |

Already in place ahead of schedule: title screen with journey map (locked/current/completed),
pause menu (resume / restart / main menu), touch controls, versioned LocalStorage save with
validation, HUD shell (objective card, energy/moisture bars, depth, life stage).

Known limitations: energy/moisture bars are display-only until Milestone 3; objective
progress stays at 0/3 until pickups land in Milestone 2; all art is generated placeholder art.

## Run locally

Requires a current Node.js LTS and npm.

```bash
npm install
npm run dev        # dev server, prints a local URL (also reachable on your LAN for phone testing)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Add `?touch=1` to the URL to force touch controls on desktop (`?touch=0` to hide them).

## Controls

| Input | Action |
|---|---|
| A / D or ← / → | Crawl (hold to keep crawling through bends and shafts) |
| ↑ / ↓ or W / S | Pick a branch at a fork or tunnel mouth |
| Space / E | Take the route shown in the prompt |
| Esc | Pause / resume |
| R | Restart stage (dev) |

Mobile: ◀ ▶ hold buttons, context button (bottom right) takes the prompted route, pause top right.

## How movement works

The worm does not use a physics engine. Each level defines a **path network** (`paths` in the level
JSON): the surface line and authored tunnels. The head crawls along a path by arc length; the body
segments are laid along the head's trail, with a peristalsis ripple. Paths meet at **transitions**
(tunnel mouths, forks, links); at a transition the worm picks the exit that best matches the
player's input. Turning around swaps head and tail with a short squeeze, and the camera follows the
body midpoint, so it never jumps. Result: the worm cannot fall through the ground or get stuck.

To add a tunnel: add a polyline to `paths`, then a `transitions` entry at each point where it meets
another path (the point must lie on both paths — a console warning flags anything > 4 px off).

## Project structure

```text
src/
  main.ts                    Phaser game config, scene list
  config/game-config.ts      Tuning: zoom, colours, tunnel radius, growth table, save key
  data/
    stage-01.json            Stage 1 level data (paths, transitions, decor, later food/hazards)
    stages.ts                Six-stage journey metadata
    types.ts                 Level data schema
  entities/Worm.ts           Player: path movement, junction choice, turn, body chain, drawing
  systems/
    TunnelSystem.ts          Path network: arc-length paths, junctions, exit options
    TerrainSystem.ts         Bakes sky, parallax layers, soil cutaway, tunnels, grass, foreground
    SaveSystem.ts            Versioned LocalStorage save with validation/fallback
    InputState.ts            Shared intent from keyboard + touch
  scenes/
    BootScene.ts             Asset loading (none yet) → Menu
    MenuScene.ts             Title, Start/Continue, journey map
    GardenScene.ts           Gameplay, camera, keyboard, autosave
    UIScene.ts               HUD, context prompt, touch controls, pause menu
  ui/                        Button, TouchControls
public/assets/               Production sprites/audio/fonts go here
docs/GAME_DESIGN.md          Full design document
```

Planned modules from the design doc (`ExplorationSystem`, `SurvivalSystem`, `Creature`) are added
in the milestone that needs them.

## Deploy (GitHub + Vercel)

1. Push this folder to a GitHub repo named `worm-life`.
2. In Vercel: **Add New → Project → Import** the repo. Settings are auto-detected and also pinned in
   `vercel.json`: framework Vite, build `npm run build`, output `dist`.
3. Every push to `main` redeploys. No environment variables or backend needed.

`vite.config.ts` uses `base: './'`, so the build also works from a sub-path (e.g. GitHub Pages).

## Assets

All v0.1 visuals are drawn in code. Record every imported asset in [`ASSET_CREDITS.md`](ASSET_CREDITS.md).
