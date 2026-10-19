# WORM LIFE — Game Design & Development README

**Studio:** Vinh Làm Game  
**Project:** WORM LIFE  
**Document version:** 0.2  
**Status:** Pre-production / Prototype planning  
**Target platform:** HTML5 browser (desktop and mobile)  
**Target deployment:** GitHub + Vercel  
**Recommended stack:** Phaser 3 + TypeScript + Vite

> **High concept:** A tiny earthworm explores a giant garden across a sequence of stages. Every stage has a clear goal, a meaningful achievement, and a visible growth milestone that makes the worm larger and opens up new possibilities.

---

## 1. Project Vision

WORM LIFE is a 2.5D exploration adventure about experiencing a garden from the perspective of a small earthworm. The player explores the surface and underground soil, discovers routes and organisms, adapts to environmental changes, and gradually expands their world.

The game should feel curious, tactile, atmospheric and approachable. Survival systems support exploration rather than punishing the player constantly.

### Design pillars

1. **Curiosity:** Every tunnel, root cluster and patch of soil may reveal something new.
2. **A living world:** Moisture, rain, water, plants and creatures affect the environment.
3. **Tactile movement:** The worm compresses, stretches, bends and squeezes through suitable spaces.
4. **Meaningful exploration:** Discoveries unlock routes, knowledge, resources or new areas.
5. **Accessible play:** Short sessions, minimal HUD, clear controls, desktop and mobile support.

### Product principles

- Build a playable core before expanding content.
- Prefer readable, authored levels over procedural open-world generation in the first prototype.
- Keep game assets replaceable and level data separate from gameplay code.
- Do not require a backend, account or network connection for the first release.
- Use original or properly licensed assets and record their sources.

---

## 2. Game Overview

| Field | Direction |
|---|---|
| Title | WORM LIFE |
| Tagline | A Tiny Life Beneath a Giant World |
| Genre | Exploration adventure, light survival, nature simulation |
| Camera | 2.5D side-view with a cutaway soil cross-section |
| Player fantasy | Discover a hidden ecosystem as a small earthworm |
| Main loop | Enter a stage → explore → complete its goal → claim a reward → visibly grow → unlock the next stage |
| Session target | 5–15 minutes for an early web prototype |
| Monetization | Not required for prototype |
| Multiplayer | Out of scope |
| Save | Browser LocalStorage for prototype |
| Languages | Start with English-friendly code and UI; localize UI later if needed |

---

## 3. Audience

- Players who enjoy indie exploration games and atmospheric worlds.
- Casual players looking for a relaxed but engaging browser game.
- Players interested in nature, creatures and small-scale ecosystems.
- Desktop and mobile web players who prefer no installation.

---

## 4. Story and Narrative

The game begins after rainfall in a quiet garden. A small earthworm emerges in moist soil. The player learns to move, find food, recognize danger and discover a network of roots, stones, tunnels and insects.

Narrative should primarily emerge from environmental storytelling and player discoveries, not long dialogue scenes.

### Narrative goals

- Make the garden feel enormous from the worm’s perspective.
- Reveal new details gradually.
- Give discoveries a sense of wonder.
- Let the environment communicate danger and opportunity.
- Keep the tone contemplative without making the game slow or confusing.

No fixed ending needs to be implemented in v0.1. A short prototype can end after the player reaches a discovery point and returns to a safe area.

---

## 5. World and Level Plan

### Area 1 — The Garden After Rain

**Purpose:** Tutorial and first playable level.

Features:
- Surface grass, fallen leaves, small stones and puddles.
- Moist soil with visible layers.
- Simple roots and a few food objects.
- One safe tunnel and one optional route.
- A discovery point that rewards exploration.

Player learns:
- Move and turn.
- Interact with an object.
- Find food.
- Enter or explore an underground route.
- Avoid a simple hazard.

### Area 2 — The Root Zone

Features:
- Larger roots, narrow passages and branching tunnels.
- Food hidden behind or beneath environmental objects.
- Routes that reconnect to previously explored areas.

Challenge:
- Navigation and route choice rather than combat.

### Area 3 — Insect Territory

Features:
- Ant paths, beetles and other small creatures.
- Readable creature behavior and safe windows for movement.

Challenge:
- Observe and avoid threats.

### Area 4 — Dry Soil

Features:
- Lower moisture, fewer food sources and deeper paths.
- Moist pockets and shelter locations.

Challenge:
- Find a viable route before the worm becomes too dry.

### Area 5 — The Changing Garden

Features:
- Rainfall, water movement and changing routes.
- Connections to earlier areas.

Challenge:
- Combine navigation, observation and environmental knowledge.

**Scope rule:** Areas describe the environments; stages describe the playable goals and progression beats within those environments. Only Stage 1 / Area 1 is playable in v0.1. Later stages and areas are design targets, not prototype requirements.

### Stage-by-stage progression and worm growth

WORM LIFE is divided into clearly identifiable stages ("cửa/chặng"). Every stage has one primary objective, optional discoveries, a completion reward and a growth milestone. The player should always know what they are trying to achieve and what completing the stage will unlock. The stage is completed through exploration, not by defeating a conventional boss.

| Stage | Area / theme | Main objective | Achievement / reward | Growth milestone |
|---|---|---|---|---|
| 1. The First Leaf | Garden after rain | Find three pieces of decaying organic matter and reach a safe burrow | First discovery entry and a safe resting place | Tiny hatchling → young worm; body becomes visibly longer |
| 2. The Root Maze | Root zone | Explore the root network and discover a second way through the area | Root-network map entry and a shortcut | Young worm → growing worm; improved tunnel traversal |
| 3. The Ant Border | Insect territory | Observe an ant patrol, avoid it and reach a protected chamber | Insect journal entry and a new route | Growing worm → explorer; unlock access to deeper passages |
| 4. The Search for Moisture | Dry soil | Follow environmental clues to find a moist refuge | Moisture refuge discovery and a safe checkpoint | Explorer → resilient worm; improved tolerance for short dry crossings |
| 5. The Underground Flood | Changing garden | Escape a rising water level and reach higher, safer soil | Flood-route discovery and a permanent passage | Resilient worm → mature worm; final major growth milestone |
| 6. The Living Garden | Compost-rich garden | Connect the burrow network and discover how the worm affects the garden | Final journal entry, completed route map and an ending scene | Mature worm; full-size appearance and completion of the main journey |

#### Stage completion rules

- Each stage has one required objective that is shown in a compact objective panel.
- Optional discoveries add journal entries or completion marks, but must not block the main route unless stated clearly.
- On completion, show a short results panel: objective completed, discoveries found, reward earned, growth stage reached and next stage unlocked.
- The player can replay completed stages where practical; replaying should not repeatedly grant the same permanent growth reward.
- The next stage unlocks only after the required objective is completed and the growth transition has played.
- Each stage needs a distinct visual landmark and a memorable environmental challenge so levels do not feel like interchangeable tunnels.

#### Worm growth design

Growth is a core progression reward, not just a counter. After each major stage, play a brief, satisfying growth animation and update the worm's body length, segment count, proportions and idle/movement animations. A small growth indicator or journal panel records the current life stage.

Growth can gradually affect gameplay by enabling deeper exploration, more efficient movement through soft soil, or better tolerance for environmental challenges. Keep the head collider and tunnel-fit rules forgiving so a larger worm does not become trapped in previously accessible routes. Where a narrow passage genuinely cannot fit the grown worm, provide an alternate route and communicate that clearly.

Suggested life stages: `Hatchling` → `Young` → `Growing` → `Explorer` → `Resilient` → `Mature`. These are game progression labels, not a claim that real earthworms use exactly these named biological stages.

For the prototype, implement only Stage 1 plus a working stage-completion screen and a visible growth transition. Store `currentStageId` and `growthStage` in save data from the beginning, so additional stages can be added without rewriting progression.

---

## 6. Core Gameplay Loop

1. Enter the current stage and read its main objective.
2. Explore the surface or underground and observe terrain, resources and creatures.
3. Find food and follow clues toward the stage goal.
4. Use existing tunnels or open a designed diggable route.
5. Avoid hazards and respond to weather.
6. Complete the objective and claim the stage achievement.
7. Watch the worm grow, unlock the next stage and save progress.

### Exploration rewards

- New map sections revealed.
- A discovery log entry.
- Food or a small energy recovery.
- A new tunnel connection.
- Visual changes in the environment.
- Progress toward opening a new area.
- A stage-clear card with a distinct reward and growth milestone.
- A visible change in the worm’s size or body length at major milestones.

Avoid relying only on score or collectible counts. Exploration itself should feel rewarding.

---

## 7. Player Character: Earthworm

### Required v0.1 behavior

- Move left and right.
- Turn or reverse direction.
- Basic body compression/stretch animation.
- Collide with solid terrain.
- Interact with nearby objects.
- Enter and exit authored tunnels or transitions.
- Respond to hazard triggers.
- Show a clear state when unable to move.

### Suggested implementation

Start with a controllable head/body sprite or a small chain of body segments. Use a stable, arcade-friendly movement model before attempting advanced soft-body physics.

A segmented worm can be represented by:
- A head position and facing direction.
- A series of body points following previous points.
- A small amount of smoothing for a flexible appearance.
- Separate animation/state logic for moving, idle, squeezing and hurt.

Do not simulate every body segment with a full physics engine in v0.1 unless the simpler model proves insufficient.

### Player states

- `idle`
- `moving`
- `squeezing`
- `interacting`
- `threatened`
- `recovering`

States should be explicit to prevent conflicting animations or inputs.

---

## 8. 2.5D Camera and Environment

The visual approach is a side-view cross-section of the garden.

### Visual layers

1. **Surface layer:** grass, leaves, plants, stones, puddles, weather and surface creatures.
2. **Soil layer:** soil strata, roots, tunnels, stones, organic matter and underground creatures.
3. **Background layer:** distant plants, silhouettes, light gradients and subtle parallax.
4. **Foreground layer:** occasional grass or soil edges that add depth without obscuring gameplay.

### Camera requirements

- Follow the worm smoothly.
- Keep the worm visible and readable.
- Avoid abrupt jumps when changing depth.
- Use modest parallax for depth.
- Clamp the camera to the level boundaries.
- Support different viewport sizes and aspect ratios.

### Terrain strategy

For v0.1, use an authored level with:
- Solid ground and collision boundaries.
- Clearly defined diggable regions or prebuilt tunnels.
- A small number of transition points.
- Data-driven placements for food, hazards and discoveries.

Do not attempt fully destructible, voxel-like soil in the first version. If digging is implemented, begin with defined diggable cells/regions or unlockable tunnel segments.

---

## 9. Controls

### Desktop

| Input | Action |
|---|---|
| A / Left Arrow | Move left |
| D / Right Arrow | Move right |
| E | Interact / inspect nearby discovery |
| Space | Context-sensitive action, if needed |
| Esc | Pause / resume |
| R | Optional restart for development builds |

Avoid assigning multiple critical actions to the same key without context.

### Mobile

- Large left and right touch controls.
- A context-sensitive action button.
- Pause button.
- Optional interaction button when a target is nearby.

Touch controls must:
- Work with held input, not only taps.
- Stop movement when released.
- Avoid blocking important parts of the scene.
- Have clear pressed/disabled states.
- Be tested on narrow screens.

---

## 10. Survival Systems

Survival should add decisions without overwhelming exploration.

### Energy

- Decreases slowly during active movement or selected actions.
- Food restores some energy.
- Reaching zero should trigger a forgiving recovery state or return to a safe point, not an endless punishment loop.

### Moisture

- Represents whether the worm is in a suitable environment.
- Wet soil restores or maintains moisture.
- Exposed dry areas can reduce moisture over time.
- Deep soil and shelters provide safer options.

### Food

- Organic matter and suitable food objects are placed in the level.
- Food can be collected once unless a later system explicitly allows respawning.
- Food should be visually distinguishable from decoration.

### Hazards

For v0.1, implement one primary hazard first. Examples:
- A bird or surface predator zone.
- A moving insect with a predictable patrol.
- A shallow flooding zone.

The player should receive readable warning cues and have a reasonable way to respond.

### Weather

A simple rain event is enough for v0.1:
- Surface rain visuals and sound.
- Optional moisture recovery in exposed soil.
- A localized flooding hazard or blocked passage.
- A clear start/end state.

Do not implement a full climate simulation in the prototype.

---

## 11. Creatures and Ecosystem

Creature behavior should be simple, readable and consistent.

| Creature | Prototype role | Suggested behavior |
|---|---|---|
| Ant | Optional ambient creature | Follows a fixed route |
| Beetle | Optional hazard | Patrols a small area |
| Bird | Optional surface threat | Appears near a marked danger zone |
| Worm | Player | Explores and responds to the environment |

Only one hazard needs to be fully implemented in v0.1. Other creatures can initially be static decoration or omitted.

Avoid presenting stylized behavior as scientifically exact simulation. Use nature as inspiration while prioritizing clear gameplay.

---

## 12. Progression and Discovery Log

### v0.1 progression

- Discover a food source.
- Find an underground route.
- Avoid or pass one hazard.
- Reach a hidden point of interest.
- Complete the short exploration objective.

### Later progression

- New map areas.
- Larger body size or new movement options where appropriate.
- Discovery log of organisms and locations.
- Additional tunnels and environmental routes.
- Seasonal and weather variations.

Progression must not require a user account in v0.1.

---

## 13. HUD and Menus

### HUD

Keep the HUD minimal:
- Energy indicator.
- Moisture/environment indicator.
- Small discovery notification.
- Optional depth/area indicator.
- Context prompt when an object can be interacted with.

### Screens

- Title screen.
- Start/Continue.
- Stage selection / journey map showing locked, current and completed stages.
- Gameplay with the current objective.
- Stage-clear results screen showing reward and growth.
- Pause/settings.
- Discovery notification or log.
- Prototype completion screen.

### Accessibility and usability

- Readable text sizes.
- Sufficient contrast.
- Do not use color alone to communicate danger.
- Allow audio to be muted.
- Provide a short controls guide.
- Make mobile buttons large enough to use comfortably.

---

## 14. Art Direction

### Style

Naturalistic stylized: tactile soil and roots, readable creatures, soft lighting and a slightly cinematic atmosphere.

### Palette direction

- Soil: dark umber, warm brown and muted ochre.
- Plants: moss green and muted leaf green.
- Moist areas: cool brown, subdued teal accents and reflected light.
- Surface sunlight: soft warm yellow.
- Threat cues: clear contrast without excessive UI effects.

### Asset categories

- Worm body/head sprites or segment pieces.
- Soil tile textures and soil strata.
- Tunnel edges and soil cutaway shapes.
- Roots, stones, leaves, grass and small plants.
- Food and organic matter.
- Creature sprites.
- Rain, water and small particle effects.
- UI icons and fonts.

### Asset rules

- Prefer original assets or assets with a license compatible with the intended distribution.
- Record asset name, source URL, author and license in `ASSET_CREDITS.md`.
- Do not assume an asset is free for commercial use just because it is downloadable.
- Use consistent scale, light direction and outline/detail level.
- Temporary placeholders are acceptable during the first playable build.

---

## 15. Audio Direction

Required or planned audio:
- Soft soil movement.
- Worm movement/interactions.
- Food discovery.
- Discovery/reward cue.
- Rain ambience.
- Insect ambience.
- Hazard warning.
- Menu and pause interactions.

Audio should be subtle and layered. Add a master mute/volume setting if feasible. Use licensed or original audio and record credits.

---

## 16. Recommended Technical Stack

| Technology | Purpose |
|---|---|
| Phaser 3 | Game loop, scenes, camera, input, rendering, collisions and audio |
| TypeScript | Maintainable gameplay code and type checking |
| Vite | Development server and static production build |
| HTML/CSS | Page shell, responsive loading screen and optional menus |
| LocalStorage | Local save data and settings |
| GitHub | Source control and collaboration |
| Vercel | Static hosting and deployment |

No backend is required for v0.1. Consider a backend only when cloud saves, accounts, leaderboards or cross-device progress become genuine requirements.

---

## 17. Suggested Repository Structure

```text
worm-life/
├── public/
│   └── assets/
│       ├── sprites/
│       ├── environments/
│       ├── audio/
│       └── fonts/
├── src/
│   ├── main.ts
│   ├── config/
│   │   └── game-config.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── MenuScene.ts
│   │   ├── GardenScene.ts
│   │   └── UIScene.ts
│   ├── entities/
│   │   ├── Worm.ts
│   │   └── Creature.ts
│   ├── systems/
│   │   ├── TerrainSystem.ts
│   │   ├── TunnelSystem.ts
│   │   ├── ExplorationSystem.ts
│   │   └── SurvivalSystem.ts
│   ├── ui/
│   │   └── TouchControls.ts
│   └── data/
│       └── garden-level.json
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── README.md
├── ASSET_CREDITS.md
└── .gitignore
```

This is a target structure. It is fine to begin with fewer files and split modules as the prototype grows.

---

## 18. Data Model Suggestions

### Level data

A level JSON file may contain:
- Level ID and name.
- World dimensions.
- Terrain and collision regions.
- Diggable regions or tunnel segments.
- Food positions and values.
- Creature spawn positions and behavior settings.
- Discovery points.
- Hazard zones.
- Start point and completion trigger.

Example conceptual structure:

```json
{
  "id": "stage-01",
  "name": "The First Leaf",
  "areaId": "garden-after-rain",
  "objective": {
    "id": "collect-organic-matter",
    "targetCount": 3
  },
  "completionReward": {
    "growthStage": "young",
    "unlockStageId": "stage-02",
    "discoveryId": "first-safe-burrow"
  },
  "world": {
    "width": 2400,
    "height": 1200
  },
  "playerStart": {
    "x": 120,
    "y": 360
  },
  "food": [],
  "creatures": [],
  "discoveries": [],
  "hazards": [],
  "tunnels": []
}
```

This is an example schema, not a complete playable level. Define exact coordinate conventions and terrain formats in the implementation.

### Save data

Suggested fields:
- `version`
- `levelId`
- `currentStageId`
- `completedStageIds`
- `growthStage`
- `playerPosition`
- `discoveredIds`
- `collectedFoodIds`
- `unlockedRoutes`
- `settings`

Add a save version and migration/fallback logic so future updates do not break old saves. Validate parsed LocalStorage data and recover safely from invalid JSON.

---

## 19. Prototype Scope — v0.1

### Must have

- [ ] Vite + Phaser + TypeScript project starts and builds.
- [ ] Title screen and start button.
- [ ] One small garden level with surface and underground cutaway.
- [ ] Controllable worm with basic movement animation.
- [ ] Stable collision with level boundaries.
- [ ] Camera follows the player.
- [ ] One way to enter or explore a tunnel.
- [ ] Three organic-matter pickups for the Stage 1 objective, with energy recovery.
- [ ] One discovery point with visible feedback.
- [ ] A clear stage objective and visible objective progress.
- [ ] A stage-clear results panel showing the achievement and reward.
- [ ] A visible growth animation and updated worm appearance after Stage 1.
- [ ] A journey map or stage panel showing Stage 1 as completed and Stage 2 as unlocked.
- [ ] Save/load fields for current stage, completed stages and growth stage.
- [ ] One readable hazard and a way to avoid it.
- [ ] One environmental event, preferably rain or localized flooding.
- [ ] Pause and restart.
- [ ] Desktop keyboard controls.
- [ ] Mobile touch controls.
- [ ] Local save/continue.
- [ ] README with setup and deployment steps.
- [ ] Successful production build and Vercel deployment.

### Should have

- [ ] Multiple worm body segments or convincing stretch animation.
- [ ] Parallax background.
- [ ] Simple ambience and interaction sounds.
- [ ] Discovery log.
- [ ] Settings for sound and controls.
- [ ] Multiple visible growth stages with distinct body silhouettes.
- [ ] Stage replay and optional discovery completion marks.

### Out of scope

- Infinite procedural world.
- Full destructible terrain simulation.
- Advanced soft-body physics.
- Complex reproduction/genetics simulation.
- Multiplayer.
- User accounts or cloud save.
- Large multi-biome world.
- Monetization and analytics integrations.

---

## 20. Implementation Milestones

### Milestone 1 — Playable Core

Tasks:
1. Scaffold Vite, Phaser and TypeScript.
2. Set up scene flow and game configuration.
3. Create a placeholder worm and basic movement.
4. Create surface and soil collision geometry.
5. Add a camera that follows the player.
6. Confirm keyboard input and resizing work.

**Acceptance:** A player can move through a small cutaway test scene without becoming stuck or falling through the ground.

### Milestone 2 — Exploration

Tasks:
1. Add a designed tunnel route.
2. Add interaction detection.
3. Add three organic-matter pickups and energy recovery.
4. Add the safe-burrow discovery point and notification.
5. Add the Stage 1 objective and visible progress.
6. Add stage completion, a reward panel and the Stage 2 unlock.
7. Play the growth animation and save the updated growth stage.

**Acceptance:** The player can explore, complete Stage 1, receive a distinct achievement, watch the worm grow and see Stage 2 unlock.

### Milestone 3 — Living World

Tasks:
1. Add one creature or hazard.
2. Add a readable warning and avoidance mechanic.
3. Add a simple rain event.
4. Add moisture/energy feedback.
5. Add ambience and basic effects.

**Acceptance:** The environment changes play decisions without overwhelming the player.

### Milestone 4 — Save, Polish and Release

Tasks:
1. Implement safe LocalStorage save/load.
2. Add title, pause and completion screens.
3. Add touch controls.
4. Test desktop and mobile layouts.
5. Optimize assets and loading.
6. Add credits and documentation.
7. Run a production build and deploy.

**Acceptance:** A new player can open the published URL, play the prototype, refresh the page and continue from saved progress.

Estimated effort for one developer: approximately 10–15 working days, depending on art quality, animation complexity and debugging. This is a planning estimate, not a guarantee.

---

## 21. Build and Run Locally

Requirements:
- A current Node.js LTS release.
- npm.
- Git (recommended).

After the project scaffold has been created:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

To create a production build:

```bash
npm run build
```

To test the production build locally:

```bash
npm run preview
```

The exact scripts must be defined in `package.json`. A successful build should generate the static site in `dist/`.

---

## 22. GitHub and Vercel Deployment

### GitHub

1. Create a repository named `worm-life`.
2. Commit the source code and licensed assets.
3. Keep generated output, dependencies and secrets out of Git.
4. Include this README and `ASSET_CREDITS.md`.
5. Use small, descriptive commits for each milestone.

### Vercel

Recommended settings for a Vite project:
- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Install command: `npm install`.

A simple static game generally does not need a custom `vercel.json`. Add one only if a routing or hosting requirement needs it.

Example optional configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

For a single-page game served at the root, this rewrite is often unnecessary. Confirm asset paths and routing behavior before adding it.

### Release checklist

- [ ] Repository is accessible to the intended collaborators.
- [ ] `npm run build` succeeds.
- [ ] Vercel deployment succeeds.
- [ ] The published page loads without console errors.
- [ ] Assets load from the correct paths.
- [ ] Keyboard controls work.
- [ ] Touch controls work.
- [ ] Refresh and save/continue work.
- [ ] The game is usable at desktop and mobile sizes.
- [ ] No unlicensed assets or exposed secrets are included.

---

## 23. QA and Acceptance Tests

### Gameplay
- The active stage objective is visible and updates when progress is made.
- Completing a stage shows the achievement and the reward.
- Growth visibly changes the worm and is not awarded repeatedly on replay.
- The next stage unlocks only after the current stage is complete.
- Player movement responds consistently.
- Releasing touch controls stops movement.
- Collision boundaries work at level edges and around obstacles.
- The camera remains within the level.
- The player can reach the discovery point.
- Hazards are visible or signalled before they cause failure.
- The objective can be completed and restarted.

### Persistence
- Save data is written only when appropriate.
- Invalid or outdated save data does not crash the game.
- Continue restores the expected level and progress.
- A reset option is clear and requires deliberate input.

### Browser and performance
- No fatal errors on startup.
- No missing assets.
- No unnecessary large asset downloads.
- Responsive layout does not stretch the game incorrectly.
- Test current desktop Chrome and at least one mobile browser.
- Test a slower device before adding heavy effects.

### Accessibility and clarity
- Controls are explained.
- Text is readable.
- Important interactions are discoverable.
- Audio can be muted.
- Danger is communicated with more than color alone.

---

## 24. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Worm movement feels like a rigid capsule | Use a segmented body or follow-point animation before attempting complex physics |
| Cutaway world looks flat | Layer roots, foreground elements, lighting and subtle parallax |
| Digging becomes technically expensive | Start with authored tunnels or diggable regions |
| Survival bars distract from exploration | Use forgiving rates and minimal HUD |
| Mobile controls obscure gameplay | Use large edge-aligned controls and test narrow screens |
| Assets are inconsistent or improperly licensed | Maintain a central asset-credit log and art direction guide |
| Scope expands too quickly | Require a working acceptance test for each milestone |
| Saves break after updates | Version the save format and validate loaded data |

---

## 25. Future Roadmap

### v0.2 — Better Feel
- Improve worm movement and body animation.
- Improve soil, roots and surface visuals.
- Add more food types and small creatures.
- Expand the garden level.
- Implement Stage 2 with its own objective, achievement and growth milestone.

### v0.3 — Deeper Exploration
- Add more connected tunnels.
- Add more terrain interactions.
- Improve environmental events.
- Add additional discoveries and route choices.
- Implement the insect-territory stage with a distinct hazard and reward.

### v0.4 — Growth and World Variety
- Add progression and selected growth mechanics.
- Add a discovery journal.
- Introduce a dry-soil or root-zone area.
- Add more environmental variation.

### v1.0 — Complete Browser Adventure
- Complete a coherent exploration journey.
- Polish art, sound, UX and accessibility.
- Optimize loading and mobile play.
- Test saves and browser compatibility.
- Publish a documented release build.

---

## 26. Definition of Done for v0.1

The prototype is ready to share when:

1. The player can start a new game and enter Stage 1.
2. The worm can explore the surface and underground cutaway.
3. The active stage objective and progress are visible.
4. The player can find food and a discovery.
5. One hazard can be understood and avoided.
6. The stage can be completed and its achievement displayed.
7. A growth animation plays and the worm visibly changes after completion.
8. The next stage is marked unlocked, even if Stage 2 content is not yet implemented.
9. The game works with keyboard and touch controls.
10. Stage progress and growth can be saved and restored.
11. The production build deploys successfully to Vercel.
12. The repository includes setup instructions, asset credits and known limitations.

---

## 27. Development Handoff Prompt

Use the following prompt when asking an AI coding assistant or developer to implement the project:

> Build WORM LIFE v0.1 for Vinh Làm Game as a playable HTML5 browser game using Phaser 3, TypeScript and Vite. Follow this README as the source of truth. Start with Stage 1, “The First Leaf,” rendered as a 2.5D side-view soil cutaway. Implement stable worm movement with a flexible-looking body, terrain collision, camera follow, surface/underground exploration, a clear objective to collect three pieces of organic matter and reach a safe burrow, one food pickup/energy feedback, one discovery point, one readable hazard, and one environmental event. On stage completion, show the achievement, play a growth animation, visibly lengthen/update the worm and mark Stage 2 as unlocked. Add a simple journey map with current/locked/completed stage states, a title screen, pause/restart, desktop keyboard controls, mobile touch controls and versioned LocalStorage saving for current stage, completed stages and growth stage. Keep the code modular, assets replaceable, level data separate from gameplay code, and the UI responsive. Include `README.md`, `ASSET_CREDITS.md`, and all required project configuration. Ensure `npm run build` succeeds and the static output deploys to Vercel. Do not add a backend, account system, multiplayer or complex terrain simulation in v0.1. Use original placeholder art if licensed production assets are not yet available. Do not claim a feature is complete unless it has been implemented and tested.

---

## 28. Project North Star

WORM LIFE should make players feel that an ordinary garden hides a vast, living world.

The prototype succeeds not by having the most systems, but by making one complete stage feel satisfying: explore, complete a clear goal, earn a memorable reward, watch the worm grow and unlock the next stage.

**Build a small world that feels alive before building a large world.**
