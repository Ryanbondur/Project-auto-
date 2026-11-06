import { describe, expect, it } from "vitest";
import { createInitialRunState } from "../src/core/store";
import {
  buildUnitInspectData,
  unitAtTile,
} from "../src/core/unitInspect";
import type { BuffChipInstance, UnitInstance } from "../src/core/types";

function unit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    instanceId: "u1",
    defId: "unit_slinger",
    starLevel: 2,
    targeting: "Strongest",
    tile: { x: 1, y: 2 },
    cooldownMs: 0,
    currentTargetId: null,
    chipInstanceIds: [],
    fromMerge: true,
    damageDealtWave: 0,
    damageDealtRun: 0,
    ...overrides,
  };
}

describe("unit inspect helper", () => {
  it("builds name, era, stars, targeting, core stats", () => {
    const state = createInitialRunState(1);
    const data = buildUnitInspectData(unit(), state);
    expect(data).not.toBeNull();
    expect(data!.name).toBe("Slinger");
    expect(data!.era).toBe(1);
    expect(data!.eraName).toMatch(/Primitive/i);
    expect(data!.starLevel).toBe(2);
    expect(data!.targeting).toBe("Strongest");
    expect(data!.stats.damage).toBeGreaterThan(0);
    expect(data!.stats.attackSpeed).toBeGreaterThan(0);
    expect(data!.stats.range).toBeGreaterThan(0);
    expect(data!.stats.aoeRadius).toBe(0);
    expect(data!.buffs).toEqual([]);
  });

  it("lists socketed buff chips and combat modifiers", () => {
    const state = createInitialRunState(2);
    const pierce: BuffChipInstance = {
      instanceId: "c1",
      defId: "chip_pierce",
      starLevel: 2,
      socketedOnInstanceId: "u1",
    };
    const dmg: BuffChipInstance = {
      instanceId: "c2",
      defId: "chip_damage",
      starLevel: 1,
      socketedOnInstanceId: "u1",
    };
    state.chips = [pierce, dmg];
    const u = unit({
      chipInstanceIds: [pierce.instanceId, dmg.instanceId],
    });
    const data = buildUnitInspectData(u, state);
    expect(data!.buffs).toHaveLength(2);
    expect(data!.buffs.map((b) => b.effect).sort()).toEqual([
      "damage",
      "pierce",
    ]);
    expect(data!.modifiers.some((m) => m.includes("pierce"))).toBe(true);
    expect(data!.modifiers.some((m) => m.includes("% dmg"))).toBe(true);
    // Damage chip applied into shown dmg
    expect(data!.stats.damage).toBeGreaterThan(8 * 2);
  });

  it("maps tile hit to boarded unit", () => {
    const board = [
      unit({ instanceId: "a", tile: { x: 1, y: 1 } }),
      unit({ instanceId: "b", defId: "unit_spearman", tile: { x: 3, y: 2 } }),
    ];
    expect(unitAtTile(board, 3, 2)?.instanceId).toBe("b");
    expect(unitAtTile(board, 0, 0)).toBeUndefined();
  });

  it("returns null for unknown defId", () => {
    const state = createInitialRunState(1);
    expect(buildUnitInspectData(unit({ defId: "nope" }), state)).toBeNull();
  });
});
