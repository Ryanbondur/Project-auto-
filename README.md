# Autobattler Tower Defense

Web autobattler tower defense: shop → merge/place → autobattle → era climb (Primitive → Cyber), with Commander meta between runs.

**Art-last:** gameplay ships with placeholder visuals (colored rects / labels). No final art or audio in early phases.

## Stack

- Vite + TypeScript
- HTML5 Canvas (board / combat)
- Light React (shop, bench, stats UI)
- Pure `src/core/` game logic (no DOM)

## Phase status

**Phase 1 (this branch):** core types, game store, shell UI (Shop, Grid Board, Bench, Stats Bar), stub era config + tiny unit pool, placeholder draw adapters.

Still stubbed for Phase 2+: buy/reroll/sell, merge, placement moves, combat, era discovery modal, meta/XP/Codex.

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
