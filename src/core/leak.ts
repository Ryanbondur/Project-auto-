import type { CreepDef } from "./types";

export type LeakResult = {
  baseHp: number;
  damage: number;
  defeated: boolean;
};

/**
 * Apply leak damage from a creep that reached the path end.
 * Standard −1 / boss −15 via CreepDef.leakDamage. HP floors at 0.
 */
export function applyLeak(baseHp: number, creepDef: CreepDef): LeakResult {
  const damage = Math.max(0, creepDef.leakDamage);
  const next = Math.max(0, baseHp - damage);
  return {
    baseHp: next,
    damage,
    defeated: next <= 0,
  };
}
