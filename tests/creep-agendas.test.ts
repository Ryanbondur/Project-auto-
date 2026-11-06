import { describe, expect, it } from "vitest";
import {
  applyDamageWithAgendas,
  initAgendaRuntime,
  rollCreepAgendas,
  siegeArmorBonus,
  splitterChildCount,
  tickHex,
  tickRegen,
  isUnitSilenced,
  AGENDA_HEX_DURATION_MS,
} from "../src/core/creepAgendas";
import type { CreepInstance, UnitInstance } from "../src/core/types";

function makeCreep(partial: Partial<CreepInstance> = {}): CreepInstance {
  const c: CreepInstance = {
    instanceId: "c1",
    defId: "creep_grunt",
    hp: 100,
    maxHp: 100,
    pathIndex: 0,
    pathT: 0,
    x: 0,
    y: 0,
    alive: true,
    agendas: [],
    shieldHp: 0,
    regenAccMs: 0,
    hexCooldownMs: 0,
    isBossCreep: false,
    ...partial,
  };
  return c;
}

describe("creep agendas", () => {
  it("Shielded absorbs damage before HP", () => {
    const c = makeCreep();
    initAgendaRuntime(c, ["shielded"]);
    expect(c.shieldHp).toBeGreaterThan(0);
    const shield = c.shieldHp;
    const dealt = applyDamageWithAgendas(c, shield);
    expect(dealt).toBe(0);
    expect(c.hp).toBe(100);
    expect(c.shieldHp).toBe(0);
    const dealt2 = applyDamageWithAgendas(c, 30);
    expect(dealt2).toBe(30);
    expect(c.hp).toBe(70);
  });

  it("Regen restores HP over time", () => {
    const c = makeCreep({ hp: 50 });
    initAgendaRuntime(c, ["regen"]);
    tickRegen(c, 1000);
    expect(c.hp).toBeGreaterThan(50);
    expect(c.hp).toBeLessThanOrEqual(100);
  });

  it("Splitter reports child count; Siege armor near path end", () => {
    const c = makeCreep();
    initAgendaRuntime(c, ["splitter", "siege"]);
    expect(splitterChildCount(c)).toBe(2);
    expect(siegeArmorBonus(c, 0.5)).toBe(0);
    expect(siegeArmorBonus(c, 0.85)).toBeGreaterThan(0);
  });

  it("Hex silences nearest tower briefly", () => {
    const c = makeCreep({ x: 2, y: 2, hexCooldownMs: 0 });
    initAgendaRuntime(c, ["hex"]);
    c.hexCooldownMs = 0;
    const unit: UnitInstance = {
      instanceId: "u1",
      defId: "unit_slinger",
      starLevel: 1,
      targeting: "First",
      tile: { x: 3, y: 2 },
      cooldownMs: 0,
      currentTargetId: null,
      chipInstanceIds: [],
      fromMerge: false,
      damageDealtWave: 0,
      damageDealtRun: 0,
    };
    const res = tickHex(c, 16, [unit], 1000);
    expect(res.silencedUnitId).toBe("u1");
    expect(isUnitSilenced(unit, 1000 + 100)).toBe(true);
    expect(isUnitSilenced(unit, 1000 + AGENDA_HEX_DURATION_MS + 1)).toBe(false);
  });

  it("escalates agenda chance with wave/era", () => {
    let hits = 0;
    for (let i = 0; i < 40; i++) {
      const early = rollCreepAgendas(2, 1, 100 + i, false);
      const late = rollCreepAgendas(40, 5, 200 + i, false);
      if (late.length >= early.length) hits += 1;
    }
    expect(hits).toBeGreaterThan(15);
  });
});
