# Sprite atlas

Minimal-premium neon unit/creep/boss/projectile art behind thin adapters
(`drawUnit`, `drawCreep`, `drawProjectile`). Combat never imports this folder.

## Layout

```
src/canvas/sprites/
  atlas.ts              # bake + resolve (Canvas 2D cached bitmaps)
  catalog.ts            # defId → recipe fallbacks (role / era / eraBossId)
  types.ts
  recipes/
    uniqueUnits.ts      # Eras 1–5 unique idle/fire sheets
    units.ts            # unique + role:era kits (fallback)
    creeps.ts           # runner / grunt / tank / swarm / creep_boss
    bosses.ts           # named era bosses (boss_*)
    projectiles.ts      # streaks + hit FX
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
2. **Role** — ensure `unitRole(defId, tags)` in `src/canvas/unitRole.ts` maps the id (or rely on tags / `roleShape`).
3. **Unique sheet** — add a recipe in `recipes/uniqueUnits.ts` with `id: "unit_…"`, `anims: ["idle","fire"]`, and a `paint()` silhouette. `UNIQUE_UNIT_SPRITES` is derived from that list.
4. **Or skip art** — missing unique art automatically uses `role:<role>:era:<n>` kits (tinted). Content PRs never crash rendering.
5. **Optional PNG** — drop `public/sprites/units/<defId>/idle.png` (+ `fire.png`); wire via atlas when PNG loader lands (TODO).
6. **Verify** — `npm run typecheck` + `npm test` + place the unit in a run; select ring / star pips stay code-drawn.

## Fallback order (units)

1. Unique `defId` + anim (`fire` → `idle` if needed)
2. `role:<role>:era:<era>` kit
3. Same role, era 1 kit
4. `role:generic:era:<era>`
5. Procedural silhouette stub in `drawUnit.ts`

## Fallback order (creeps / bosses)

1. `eraBossId` unique sheet (`boss_*`) when present
2. Exact creep / boss `defId`
3. `creep_boss` for boss flags
4. `creep_grunt` → `creep:generic` → procedural

Story bosses still spawn with combat `defId: "creep_boss"`; `eraBossId` selects the named silhouette.

## Coverage

| Set | Status |
| --- | --- |
| All units Eras 1–5 (`UNIT_DEFS`) | Unique idle + fire |
| Creeps (runner, grunt, tank, swarm, boss) | Unique idle |
| Named era bosses (`ERA_BOSS_DEFS`) | Unique idle |
| Projectiles / hit FX | Family streaks + selective impact bloom |
| Unknown future content | Role kits / grunt / procedural stubs |

## Taste

Quiet silhouettes, selective cyan muzzle on `fire`, magenta hostiles, boss-only glow + light glitch ghost. Hit FX bloom only near projectile arrival. No board nameplates.
