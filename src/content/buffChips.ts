import type { BuffChipDef } from "../core/types";

/**
 * Buff craftsman chips — socket onto a unit; amplify what that card does.
 * Not TFT trait synergies. Identical chips merge pairwise (same as units).
 */
export const BUFF_CHIP_DEFS: BuffChipDef[] = [
  {
    id: "chip_pierce",
    name: "Pierce Chip",
    cost: 2,
    effect: "pierce",
    description: "Attacks pierce to one extra creep in line (stub — combat Phase 3).",
  },
  {
    id: "chip_lifesteal",
    name: "Lifesteal Chip",
    cost: 3,
    effect: "lifesteal",
    description: "Heal base HP for a fraction of damage dealt (stub).",
  },
  {
    id: "chip_heal_pulse",
    name: "Heal Pulse Chip",
    cost: 2,
    effect: "heal_pulse",
    description: "Periodic heal pulse around the unit (stub).",
  },
  {
    id: "chip_aoe_ring",
    name: "AoE Ring Chip",
    cost: 3,
    effect: "aoe_ring",
    description: "Adds/expands a small AoE ring on hit (stub).",
  },
];

export function getBuffChipDef(id: string): BuffChipDef | undefined {
  return BUFF_CHIP_DEFS.find((c) => c.id === id);
}

/**
 * Apply pierce chip effect multiplier placeholder.
 * Working data-model hook: star-scaled pierce count for combat later.
 */
export function pierceExtraTargets(chipStarLevel: number): number {
  return Math.max(1, Math.floor(chipStarLevel));
}
