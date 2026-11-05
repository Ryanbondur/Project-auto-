import { describe, expect, it } from "vitest";
import { applyLeak } from "../src/core/leak";
import type { CreepDef } from "../src/core/types";
import { BOSS_LEAK_DAMAGE, STANDARD_LEAK_DAMAGE } from "../src/core/constants";

const grunt: CreepDef = {
  id: "creep_grunt",
  name: "Grunt",
  isBoss: false,
  maxHp: 40,
  speed: 1,
  armor: 0,
  leakDamage: STANDARD_LEAK_DAMAGE,
};

const boss: CreepDef = {
  id: "creep_boss",
  name: "Boss",
  isBoss: true,
  maxHp: 600,
  speed: 0.5,
  armor: 0,
  leakDamage: BOSS_LEAK_DAMAGE,
};

describe("leak HP", () => {
  it("standard creep deals −1", () => {
    const r = applyLeak(100, grunt);
    expect(r.damage).toBe(1);
    expect(r.baseHp).toBe(99);
    expect(r.defeated).toBe(false);
  });

  it("boss deals −15", () => {
    const r = applyLeak(100, boss);
    expect(r.damage).toBe(15);
    expect(r.baseHp).toBe(85);
    expect(r.defeated).toBe(false);
  });

  it("floors at 0 and marks defeat", () => {
    const r = applyLeak(1, boss);
    expect(r.baseHp).toBe(0);
    expect(r.defeated).toBe(true);
  });
});
