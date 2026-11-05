import { describe, expect, it } from "vitest";
import { advanceProjectiles, PROJECTILE_SPEED, projectileDrawPos } from "../src/core/combat";
import type { Projectile, RunState } from "../src/core/types";
import { createInitialRunState } from "../src/core/store";

function flying(overrides: Partial<Projectile> = {}): Projectile {
  return {
    id: "p1",
    from: { x: 0, y: 0 },
    pos: { x: 0, y: 0 },
    aim: { x: 3, y: 0 },
    toCreepId: "missing",
    damage: 10,
    aoeRadius: 0,
    speed: PROJECTILE_SPEED,
    progress: 0,
    pierceExtra: 0,
    arcHeight: 0.4,
    ...overrides,
  };
}

describe("projectile continuous flight", () => {
  it("advances progress each dt and arcs visually", () => {
    const state = createInitialRunState(1) as RunState;
    state.projectiles = [flying()];
    advanceProjectiles(state, 50);
    const p = state.projectiles[0];
    expect(p).toBeTruthy();
    expect(p!.progress).toBeGreaterThan(0);
    expect(p!.progress).toBeLessThan(1);
    expect(p!.pos.x).toBeGreaterThan(0);
    const draw = projectileDrawPos(p!);
    // Arc lifts above linear y=0
    expect(draw.y).toBeLessThan(p!.pos.y);
  });

  it("resolves hit on arrival (progress >= 1), not on spawn", () => {
    const state = createInitialRunState(1) as RunState;
    state.creeps = [
      {
        instanceId: "c1",
        defId: "creep_grunt",
        hp: 40,
        pathIndex: 2,
        pathT: 0,
        x: 2,
        y: 2,
        alive: true,
      },
    ];
    state.projectiles = [
      flying({
        toCreepId: "c1",
        from: { x: 2.5, y: 2.5 },
        pos: { x: 2.5, y: 2.5 },
        aim: { x: 2.5, y: 2.5 },
        progress: 0.99,
        speed: 50,
      }),
    ];
    const hpBefore = state.creeps[0]!.hp;
    advanceProjectiles(state, 16);
    // Near-arrival with high speed should complete
    expect(state.projectiles.length).toBe(0);
    expect(state.creeps[0]!.hp).toBeLessThan(hpBefore);
  });
});
