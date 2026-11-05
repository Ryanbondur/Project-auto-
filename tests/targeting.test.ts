import { describe, expect, it } from "vitest";
import type { CreepDef, CreepInstance, MapDef } from "../src/core/types";
import { selectTarget, nextTargetingMode } from "../src/core/targeting";

const map: MapDef = {
  width: 5,
  height: 3,
  path: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
  ],
};

function creep(
  id: string,
  defId: string,
  pathIndex: number,
  pathT: number,
  hp: number,
): CreepInstance {
  const a = map.path[pathIndex] ?? { x: 0, y: 0 };
  const b = map.path[pathIndex + 1] ?? a;
  return {
    instanceId: id,
    defId,
    hp,
    pathIndex,
    pathT,
    x: a.x + (b.x - a.x) * pathT,
    y: a.y + (b.y - a.y) * pathT,
    alive: true,
  };
}

const defs = new Map<string, CreepDef>([
  [
    "grunt",
    {
      id: "grunt",
      name: "G",
      isBoss: false,
      maxHp: 40,
      speed: 1,
      armor: 0,
      leakDamage: 1,
    },
  ],
  [
    "tank",
    {
      id: "tank",
      name: "T",
      isBoss: false,
      maxHp: 120,
      speed: 1,
      armor: 0,
      leakDamage: 1,
    },
  ],
  [
    "swarm",
    {
      id: "swarm",
      name: "S",
      isBoss: false,
      maxHp: 10,
      speed: 1,
      armor: 0,
      leakDamage: 1,
    },
  ],
]);

describe("targeting picks", () => {
  const unitTile = { x: 2, y: 0 };
  const range = 3;

  const pack = [
    creep("a", "grunt", 1, 0.2, 30),
    creep("b", "tank", 3, 0.5, 100),
    creep("c", "swarm", 2, 0.1, 4),
    creep("d", "swarm", 2, 0.3, 8),
  ];

  it("First = furthest along path", () => {
    const t = selectTarget("First", unitTile, range, pack, defs, 0, map);
    expect(t?.instanceId).toBe("b");
  });

  it("Last = least path progress", () => {
    const t = selectTarget("Last", unitTile, range, pack, defs, 0, map);
    expect(t?.instanceId).toBe("a");
  });

  it("Strongest = highest maxHp", () => {
    const t = selectTarget("Strongest", unitTile, range, pack, defs, 0, map);
    expect(t?.instanceId).toBe("b");
  });

  it("LowestHP = lowest current hp", () => {
    const t = selectTarget("LowestHP", unitTile, range, pack, defs, 0, map);
    expect(t?.instanceId).toBe("c");
  });

  it("AoeCluster prefers densest neighborhood", () => {
    const t = selectTarget("AoeCluster", unitTile, range, pack, defs, 0, map, 1.0);
    // c and d are near each other on segment 2
    expect(t?.instanceId === "c" || t?.instanceId === "d").toBe(true);
  });

  it("returns null when nothing in range", () => {
    const far = [creep("z", "grunt", 0, 0, 10)];
    const tinyMap: MapDef = {
      width: 20,
      height: 3,
      path: Array.from({ length: 20 }, (_, i) => ({ x: i, y: 1 })),
    };
    const t = selectTarget(
      "First",
      { x: 18, y: 0 },
      0.5,
      far,
      defs,
      0,
      tinyMap,
    );
    expect(t).toBeNull();
  });

  it("cycles targeting modes", () => {
    expect(nextTargetingMode("First")).toBe("Last");
    expect(nextTargetingMode("AoeCluster")).toBe("First");
  });
});
