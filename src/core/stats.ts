import { starStatMultiplier } from "./constants";
import { getUnitDef } from "../content/units";
import {
  DOCTRINE_SUPPORT_AURA_DAMAGE,
  DOCTRINE_SUPPORT_AURA_RANGE,
  doctrineBallisticAsBonus,
  doctrineSiegeDamageBonus,
  doctrineSupportsAura,
  doctrineSwarmAsBonus,
} from "./doctrine";
import type { DoctrineId, UnitInstance } from "./types";

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
 * Ballistic Overclock / Swarm Tide: +AS on matching tags.
 * Siege Battery: +damage on Siege tags.
 * Support Aura doctrine: nearby allies get +damage (caller passes board).
 */
export function effectiveStats(
  unit: UnitInstance,
  meta?: { rangeMult?: number; mergedAsBonus?: number },
  doctrineId: DoctrineId | null = null,
  board: UnitInstance[] = [],
): EffectiveStats | null {
  const def = getUnitDef(unit.defId);
  if (!def) return null;

  const starMult = starStatMultiplier(unit.starLevel);
  const rangeMult = meta?.rangeMult ?? 1;
  const asBonus =
    meta?.mergedAsBonus && (unit.fromMerge || unit.starLevel >= 2)
      ? 1 + meta.mergedAsBonus
      : 1;
  const ballisticAs =
    def.tags.includes("Ballistic") && doctrineId
      ? 1 + doctrineBallisticAsBonus(doctrineId)
      : 1;
  const swarmAs =
    def.tags.includes("Swarm") && doctrineId
      ? 1 + doctrineSwarmAsBonus(doctrineId)
      : 1;
  const siegeDmg =
    def.tags.includes("Siege") && doctrineId
      ? 1 + doctrineSiegeDamageBonus(doctrineId)
      : 1;

  let auraDmg = 1;
  if (doctrineSupportsAura(doctrineId) && unit.tile) {
    for (const ally of board) {
      if (!ally.tile || ally.instanceId === unit.instanceId) continue;
      const allyDef = getUnitDef(ally.defId);
      if (!allyDef?.tags.includes("Support")) continue;
      const dist = Math.hypot(
        ally.tile.x - unit.tile.x,
        ally.tile.y - unit.tile.y,
      );
      if (dist <= DOCTRINE_SUPPORT_AURA_RANGE) {
        auraDmg += DOCTRINE_SUPPORT_AURA_DAMAGE;
      }
    }
  }

  return {
    damage: def.stats.damage * starMult * auraDmg * siegeDmg,
    attackSpeed:
      def.stats.attackSpeed * starMult * asBonus * ballisticAs * swarmAs,
    range: def.stats.range * starMult * rangeMult,
    aoeRadius: def.stats.aoeRadius * starMult,
    starMult,
  };
}
