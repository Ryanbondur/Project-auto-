# Autobattler Tower Defense

Web autobattler tower defense: shop → merge/place → autobattle → era climb (Primitive → Cyber), with Commander meta between runs.

**Art-last:** gameplay ships with placeholder visuals (colored rects / labels). No final art or audio in early phases.

## Stack

- Vite + TypeScript
- HTML5 Canvas (board / combat)
- Light React (shop, bench, stats UI)
- Pure `src/core/` game logic (no DOM)

## Phase status

**Phase 2:** buy / reroll (1g) / sell, bench↔board with slot caps, pairwise auto-merge (same id + star → star+1, uncapped), star stat scaling, shop refresh each prep (Ready stub skips combat), buff-chip socket + pierce chip data hook, path-sabotage + commander-gambit stubs.

Locked defaults: starting gold **10**, bench **5**, shop **3** offers, endless runs.

Still stubbed for later: real combat/waves (P3), era discovery modal (P4), meta/XP/Codex (P5), art/audio.

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
