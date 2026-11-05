import { describe, expect, it } from "vitest";
import { MAP } from "../src/content/map";
import {
  creepWorldPos,
  moveCreepAlongPath,
  pathProgress,
  sabotageSpeedMult,
} from "../src/core/pathing";
import type { CreepInstance, PathSabotageInstance } from "../src/core/types";

function makeCreep(pathIndex = 0, pathT = 0): CreepInstance {
  const a = MAP.path[pathIndex] ?? { x: 0, y: 0 };
  const b = MAP.path[pathIndex + 1] ?? a;
  return {
    instanceId: "e1",
    defId: "creep_grunt",
    hp: 40,
    maxHp: 40,
    pathIndex,
    pathT,
    x: a.x + (b.x - a.x) * pathT,
    y: a.y + (b.y - a.y) * pathT,
    alive: true,
  };
}

describe("continuous pathing", () => {
  it("interpolates sub-tile world positions", () => {
    const a = MAP.path[0]!;
    const b = MAP.path[1]!;
    const pos = creepWorldPos({
      pathIndex: 0,
      pathT: 0.5,
      x: a.x + (b.x - a.x) * 0.5,
      y: a.y + (b.y - a.y) * 0.5,
    });
    expect(pos.x).toBeCloseTo(a.x + (b.x - a.x) * 0.5);
    expect(pos.y).toBeCloseTo(a.y + (b.y - a.y) * 0.5);
  });

  it("advances smoothly without tile teleport across many small dts", () => {
    let creep = makeCreep();
    const samples: number[] = [];
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const { creep: moved } = moveCreepAlongPath(creep, 1.5, 16, MAP, 1);
      creep = moved;
      samples.push(pathProgress(creep));
      positions.push({ x: creep.x, y: creep.y });
    }
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!).toBeGreaterThanOrEqual(samples[i - 1]!);
      // No huge jumps in a single 16ms frame at 1.5 tiles/s
      expect(samples[i]! - samples[i - 1]!).toBeLessThan(0.08);
      const dx = positions[i]!.x - positions[i - 1]!.x;
      const dy = positions[i]!.y - positions[i - 1]!.y;
      expect(Math.hypot(dx, dy)).toBeLessThan(0.1);
      // Must not sit only on integer tile centers
    }
    const midFrac = positions.filter(
      (p) => Math.abs(p.x - Math.round(p.x)) > 0.05 || Math.abs(p.y - Math.round(p.y)) > 0.05,
    );
    expect(midFrac.length).toBeGreaterThan(5);
  });

  it("leaks after finishing the path", () => {
    let creep = makeCreep(MAP.path.length - 2, 0.99);
    const { creep: moved, leaked } = moveCreepAlongPath(creep, 5, 200, MAP, 1);
    expect(leaked).toBe(true);
    expect(moved.alive).toBe(false);
  });

  it("slow sabotage reduces speed multiplier on nearby segments", () => {
    const items: PathSabotageInstance[] = [
      {
        instanceId: "s1",
        defId: "sabotage_tar_slick",
        pathIndex: 5,
        placed: true,
      },
    ];
    expect(sabotageSpeedMult(5, items)).toBe(0.55);
    expect(sabotageSpeedMult(20, items)).toBe(1);
  });
});
