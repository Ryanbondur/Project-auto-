# Autobattler Tower Defense

Web autobattler tower defense: shop → merge/place → autobattle → era climb (Primitive → Cyber), with Commander meta between runs.

**Art-last:** gameplay ships with placeholder visuals (colored rects / labels). Draw adapters (`drawUnit` / `drawCreep` / `drawProjectile`) are thin skins over sim-owned world positions — permanent art should swap in without rewriting combat, pathing, economy, or state.

## Stack

- Vite + TypeScript
- HTML5 Canvas (board / combat)
- Light React (shop, bench, stats UI)
- Pure `src/core/` game logic (no DOM)

## Phase status

**Phase 3:** pathing engine, creep waves, range + projectile autobattle, leak damage to base HP, endless runs (HP≤0 ends the run).

- Creeps march continuously along the serpentine path (`pathIndex` + `pathT` sub-tile interpolation, dt-based).
- Projectiles fly with continuous world positions; damage resolves on arrival (not hitscan).
- `requestAnimationFrame` drives combat `tick(dt)` + redraw every frame.
- Ready starts a wave; clear → +5 income + interest → prep with shop refresh.
- Pairwise merge / shop / buff chips / gambits from Phase 2 kept working.
- Path sabotage: Tar Slick slow (0.5×) wired; brief fork placement-only stub.

Locked defaults: starting gold **10**, bench **5**, shop **3** offers, endless runs.

Still stubbed for later: era discovery modal (P4), meta/XP/Codex (P5), fork divert behaviour, most buff combat hooks beyond pierce/aoe ring, art/audio.

### Pairwise merge (not 3-of-a-kind)

Two units with the same `defId` and `starLevel` combine into one at `starLevel + 1`. Chains until stable. Bench-first consume order.

### Star multipliers

| Star | Mult |
| --- | --- |
| 1★ | ×1 |
| 2★ | ×2 |
| 3★ | ×3.5 |
| 4★+ | `3.5 * 1.75^(n-3)` (provisional) |

Sell: 100% for 1★; `floor(0.8 * 2^(star-1) * cost)` for merged (pairwise composition).

## Run locally

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run typecheck
npm run build
npm test
```

## Layout

See `src/` — `core/`, `content/`, `canvas/`, `ui/`, `app/` match the project architecture plan.
