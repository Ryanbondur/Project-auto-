# Optional PNG sprite drops

Runtime ships **canvas-baked** frames from `src/canvas/sprites/recipes/`.
Use this folder when swapping in handcrafted PNGs later — adapters already key by `defId`.

## Convention

```
public/sprites/
  units/
    unit_slinger/
      idle.png    # square, transparent, ~128×128 recommended
      fire.png
    unit_spearman/
      idle.png
      fire.png
  creeps/
    creep_runner.png
    creep_grunt.png
    creep_tank.png
    creep_swarm.png
    creep_boss.png
  bosses/
    boss_path_splitter.png
    boss_glitch_sovereign.png
    # …one PNG per ERA_BOSS_DEFS id
```

- Keep silhouettes ≤ ~0.85 tile (units) / ≤ ~0.7 (creeps) / ~1.0 (boss) when drawn.
- Prefer flat neon fills + thin edges; avoid noisy reference clutter.
- Star pips, select rings, HP bars stay **code-drawn** — do not bake them into PNGs.

Until a PNG loader is wired in `atlas.ts`, files here are unused by the game (safe to commit WIP art).
