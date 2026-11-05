import { starStatMultiplier } from "./constants";
import { getUnitDef } from "../content/units";
import type { UnitInstance } from "./types";

export type EffectiveStats = {
  damage: number;
  attackSpeed: number;
  range: number;
  aoeRadius: number;
  starMult: number;
};

/**
 * effectiveStats(unit) = scale(base, star) * meta multipliers.
 * Master Mason range mult applied to range.
 * Quick Assembly: +mergedAsBonus attack speed when fromMerge / star≥2 (Phase 5).
 */
export function effectiveStats(
  unit: UnitInstance,
  meta?: { rangeMult?: number; mergedAsBonus?: number },
): EffectiveStats | null {
  const def = getUnitDef(unit.defId);
  if (!def) return null;

  const starMult = starStatMultiplier(unit.starLevel);
  const rangeMult = meta?.rangeMult ?? 1;
  const asBonus =
    meta?.mergedAsBonus && (unit.fromMerge || unit.starLevel >= 2)
      ? 1 + meta.mergedAsBonus
      : 1;

  return {
    damage: def.stats.damage * starMult,
    attackSpeed: def.stats.attackSpeed * starMult * asBonus,
    range: def.stats.range * starMult * rangeMult,
    aoeRadius: def.stats.aoeRadius * starMult,
    starMult,
  };
}
