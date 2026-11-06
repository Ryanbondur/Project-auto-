# Sprite atlas

Minimal-premium neon unit/creep art behind thin adapters (`drawUnit`, `drawCreep`).
Combat never imports this folder.

## Layout

```
src/canvas/sprites/
  atlas.ts              # bake + resolve (Canvas 2D cached bitmaps)
  catalog.ts            # defId → recipe fallbacks (role / era)
  types.ts
  recipes/
    units.ts            # Era 1 unique + role:era kits (2–5)
    creeps.ts           # runner / grunt / tank / swarm / boss
    helpers.ts
public/sprites/         # optional PNG drops (future handcrafted sheets)
  units/<defId>/idle.png
  units/<defId>/fire.png
  creeps/<defId>.png
  README.md             # drop-in convention
```

Runtime today: **procedural → cached bitmaps** (no PNG required). PNG loader can plug into `atlas.ts` later without touching sim.

## How to add a new unit sprite

1. **Content first** — add the `UnitDef` in `src/content/units.ts` (shop/combat work with procedural fallback immediately).
2. **Role** — ensure `unitRole(defId, tags)` in `src/canvas/unitRole.ts` maps the id (or rely on tags).
3. **Unique sheet (preferred for hero eras)** — add a recipe in `recipes/units.ts` with `id: "unit_…"`, `anims: ["idle","fire"]`, and a `paint()` silhouette. Register the id in `UNIQUE_UNIT_SPRITES` in `catalog.ts`.
4. **Or skip art** — missing unique art automatically uses `role:<role>:era:<n>` kits (tinted). Content PRs never crash rendering.
5. **Optional PNG** — drop `public/sprites/units/<defId>/idle.png` (+ `fire.png`); wire via atlas when PNG loader lands (TODO).
6. **Verify** — `npm run typecheck` + place the unit in a run; select ring / star pips stay code-drawn.

## Fallback order (units)

1. Unique `defId` + anim (`fire` → `idle` if needed)
2. `role:<role>:era:<era>` kit
3. Same role, era 1 kit
4. `role:generic:era:<era>`
5. Procedural silhouette stub in `drawUnit.ts`

## Coverage

| Set | Status |
| --- | --- |
| Era 1 (slinger, spearman, tribe_drummer, boulder_roll) | Unique idle + fire |
| Eras 2–5 | Role kits, era-tinted — **TODO** unique sheets |
| Creeps (runner, grunt, tank, swarm, boss) | Unique idle |
| Projectiles | Procedural streaks (adapter untouched this pass) |

## Taste

Quiet silhouettes, selective cyan muzzle on `fire`, magenta hostiles, boss-only glow. No board nameplates.
