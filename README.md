# Autobattler Tower Defense

Web autobattler tower defense: shop → merge/place → autobattle → era climb (Primitive → Cyber), with Commander meta between runs.

**Art-last:** gameplay ships with placeholder visuals (colored rects / labels). Draw adapters (`drawUnit` / `drawCreep` / `drawProjectile`) are thin skins over sim-owned world positions — permanent art should swap in without rewriting combat, pathing, economy, or state.

**Mobile / iPhone first:** portrait phone layout with safe-area padding, ~44px touch targets, maximized canvas play area, and compact shop/bench chrome. Desktop works as a secondary wider stack.

## Stack

- Vite + TypeScript
- HTML5 Canvas (board / combat)
- Light React (shop, bench, stats, Era Discovery sheet)
- Pure `src/core/` game logic (no DOM)

## Phase status

**Phase 4:** era transition controller, era-weighted shop odds, free Level-2 Era Discovery modal.

- Wave thresholds advance eras (1–10 → 2 at 11, … → 5 at 41).
- On advance: `ERA_FREEZE` — wave progress + shop locked until the player picks 1 of 3 random **2★** units from the **newly unlocked** era (free, soft bench overflow).
- Shop unit offers sample era via `shopOdds`, then uniform unit in that era; board slot caps bump with the unlocked era table.
- Full 20-unit placeholder roster (4 per era).

Still stubbed for Phase 5: main menu, meta XP / skill tree / Codex / `localStorage`, mid-run pause/resume, fork divert, most buff combat hooks, art/audio.

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

Locked defaults: starting gold **10**, bench **5**, shop **3** offers, endless runs.

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
