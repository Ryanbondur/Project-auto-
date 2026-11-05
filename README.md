# Autobattler Tower Defense

Web autobattler tower defense: shop → merge/place → autobattle → era climb (Primitive → Cyber), with Commander meta between runs.

**Art-last:** gameplay ships with placeholder visuals (colored rects / labels). Draw adapters (`drawUnit` / `drawCreep` / `drawProjectile`) are thin skins over sim-owned world positions — permanent art should swap in without rewriting combat, pathing, economy, or state.

**Mobile / iPhone first:** portrait phone layout with safe-area padding, ~44px touch targets, maximized canvas play area, and compact shop/bench chrome. Desktop works as a secondary wider stack.

## Stack

- Vite + TypeScript
- HTML5 Canvas (board / combat)
- Light React (menu, shop, bench, stats, Era Discovery, skills, Codex)
- Pure `src/core/` game logic (no DOM)
- `src/meta/` localStorage persistence

## Phase status

**Phase 5:** main menu, Commander XP, skill tree, Unit Codex, pause/resume (one active run).

- Main menu → New run / Continue / Skills / Codex
- Run end (HP ≤ 0): XP = `wavesCleared × 15` (endless — no wave-100 victory)
- Skills persist in `localStorage` key `atd.meta.v1` and apply on **new** runs:
  - Deep Pockets (+5 start gold → 15)
  - Interest Rate Cap (cap 8)
  - Master Mason (+15% range)
  - Quick Assembly (+10% AS on merged / 2★+)
  - Veterancy (era bands −1 wave)
  - Reinforcements (bench 6)
- Codex silhouettes until purchased or encountered (shop / discovery)
- Pause saves the single active run to `atd.run.v1`; New run replaces it

Still stubbed (art-last): final sprites, era art, audio, juice; fork divert; most buff combat hooks.

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

Locked defaults: starting gold **10**, bench **5**, shop **3** offers, endless runs, pause/resume one active run.

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

See `src/` — `core/`, `content/`, `meta/`, `canvas/`, `ui/`, `app/` match the project architecture plan.
