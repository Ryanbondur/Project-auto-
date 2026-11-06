import type { CreepDef } from "./types";

export type LeakResult = {
  baseHp: number;
  damage: number;
  defeated: boolean;
};

/**
 * Apply leak damage from a creep that reached the path end.
 * Standard −1 / boss −15 via CreepDef.leakDamage. HP floors at 0.
 * `leakReduction` from draft anti_siege etc. floors damage at 1 when base > 0.
 */
export function applyLeak(
  baseHp: number,
  creepDef: CreepDef,
  leakReduction = 0,
  extraLeak = 0,
): LeakResult {
  const raw = Math.max(0, creepDef.leakDamage + extraLeak);
  const damage =
    raw <= 0 ? 0 : Math.max(1, raw - Math.max(0, leakReduction));
  const next = Math.max(0, baseHp - damage);
  return {
    baseHp: next,
    damage,
    defeated: next <= 0,
  };
}
