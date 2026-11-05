import { describe, expect, it } from "vitest";
import {
  chipAoeBonus,
  chipDamageMultiplier,
  chipHealPulseAmount,
  chipLifestealFraction,
  chipPierceExtra,
  HEAL_PULSE_INTERVAL_MS,
} from "../src/core/buffEffects";
import {
  advanceProjectiles,
  PROJECTILE_SPEED,
  tickCombat,
} from "../src/core/combat";
import { createInitialRunState } from "../src/core/store";
import type {
  BuffChipInstance,
  Projectile,
  UnitInstance,
} from "../src/core/types";

function chip(
  defId: string,
  starLevel: number,
  socketedOn: string,
): BuffChipInstance {
  return {
    instanceId: `c_${defId}_${starLevel}`,
    defId,
    starLevel,
    socketedOnInstanceId: socketedOn,
  };
}

function unitWithChips(
  chipIds: string[],
  overrides: Partial<UnitInstance> = {},
): UnitInstance {
  return {
    instanceId: "u1",
    defId: "unit_slinger",
    starLevel: 1,
    targeting: "First",
    tile: { x: 1, y: 1 },
    cooldownMs: 0,
    currentTargetId: null,
    chipInstanceIds: chipIds,
    fromMerge: false,
    damageDealtWave: 0,
    damageDealtRun: 0,
    ...overrides,
  };
}

describe("buff craftsman combat hooks", () => {
  it("damage chip multiplies damage by 18% per star", () => {
    const chips = [chip("chip_damage", 2, "u1")];
    const u = unitWithChips([chips[0]!.instanceId]);
    expect(chipDamageMultiplier(u, chips)).toBeCloseTo(1.36);
  });

  it("pierce chip adds star-scaled extra targets", () => {
    const chips = [chip("chip_pierce", 2, "u1")];
    const u = unitWithChips([chips[0]!.instanceId]);
    expect(chipPierceExtra(u, chips)).toBe(2);
  });

  it("aoe_ring chip expands radius", () => {
    const chips = [chip("chip_aoe_ring", 1, "u1")];
    const u = unitWithChips([chips[0]!.instanceId]);
    expect(chipAoeBonus(u, chips)).toBeCloseTo(0.55);
  });

  it("lifesteal chip heals base HP on projectile arrival", () => {
    const state = createInitialRunState(1);
    const lifeChip = chip("chip_lifesteal", 2, "u1");
    state.chips = [lifeChip];
    state.board = [unitWithChips([lifeChip.instanceId])];
    state.baseHp = 80;
    state.creeps = [
      {
        instanceId: "e1",
        defId: "creep_grunt",
        hp: 40,
        maxHp: 40,
        pathIndex: 2,
        pathT: 0,
        x: 2,
        y: 2,
        alive: true,
      },
    ];
    const proj: Projectile = {
      id: "p1",
      sourceUnitId: "u1",
      from: { x: 2.5, y: 2.5 },
      pos: { x: 2.5, y: 2.5 },
      aim: { x: 2.5, y: 2.5 },
      toCreepId: "e1",
      damage: 20,
      aoeRadius: 0,
      speed: PROJECTILE_SPEED,
      progress: 0.99,
      pierceExtra: 0,
      arcHeight: 0,
      lifestealFraction: chipLifestealFraction(state.board[0]!, state.chips),
    };
    expect(proj.lifestealFraction).toBeCloseTo(0.16);
    state.projectiles = [proj];
    advanceProjectiles(state, 50);
    expect(state.projectiles).toHaveLength(0);
    expect(state.baseHp).toBeGreaterThan(80);
  });

  it("heal_pulse chip restores base HP on interval", () => {
    const state = createInitialRunState(2);
    const pulse = chip("chip_heal_pulse", 3, "u1");
    state.chips = [pulse];
    state.board = [unitWithChips([pulse.instanceId])];
    state.baseHp = 70;
    state.healPulseCooldownMs = 0;
    state.creeps = [];
    state.phase = "AUTOBATTLE";
    state.waveRuntime = {
      spawnQueue: [],
      elapsedMs: 0,
      allSpawned: true,
    };
    expect(chipHealPulseAmount(state.board[0]!, state.chips)).toBe(3);
    tickCombat(state, 16, () => "p_x");
    expect(state.baseHp).toBe(73);
    expect(state.healPulseCooldownMs).toBe(HEAL_PULSE_INTERVAL_MS);
  });

  it("pierce on hit damages a second creep further along the path", () => {
    const state = createInitialRunState(3);
    const pierce = chip("chip_pierce", 1, "u1");
    state.chips = [pierce];
    state.board = [unitWithChips([pierce.instanceId])];
    state.creeps = [
      {
        instanceId: "e1",
        defId: "creep_grunt",
        hp: 40,
        maxHp: 40,
        pathIndex: 1,
        pathT: 0.2,
        x: 1,
        y: 2,
        alive: true,
      },
      {
        instanceId: "e2",
        defId: "creep_grunt",
        hp: 40,
        maxHp: 40,
        pathIndex: 3,
        pathT: 0.1,
        x: 3,
        y: 2,
        alive: true,
      },
    ];
    state.projectiles = [
      {
        id: "p1",
        sourceUnitId: "u1",
        from: { x: 1.5, y: 2.5 },
        pos: { x: 1.5, y: 2.5 },
        aim: { x: 1.5, y: 2.5 },
        toCreepId: "e1",
        damage: 10,
        aoeRadius: 0,
        speed: 80,
        progress: 0.99,
        pierceExtra: chipPierceExtra(state.board[0]!, state.chips),
        arcHeight: 0,
        lifestealFraction: 0,
      },
    ];
    advanceProjectiles(state, 50);
    expect(state.creeps[0]!.hp).toBeLessThan(40);
    expect(state.creeps[1]!.hp).toBeLessThan(40);
  });
});
