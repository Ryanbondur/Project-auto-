import type { BuffChipDef } from "../core/types";

/**
 * Buff craftsman chips — socket onto a unit; amplify what that card does.
 * Not TFT trait synergies. Identical chips merge pairwise (same as units).
 * Combat hooks live in core/buffEffects.ts + combat.ts.
 */
export const BUFF_CHIP_DEFS: BuffChipDef[] = [
  {
    id: "chip_damage",
    name: "Damage Chip",
    cost: 2,
    effect: "damage",
    description: "+18% damage per star while socketed.",
  },
  {
    id: "chip_pierce",
    name: "Pierce Chip",
    cost: 2,
    effect: "pierce",
    description: "Attacks pierce to extra creeps further along the path.",
  },
  {
    id: "chip_lifesteal",
    name: "Lifesteal Chip",
    cost: 3,
    effect: "lifesteal",
    description: "Heal base HP for a fraction of damage dealt on hit.",
  },
  {
    id: "chip_heal_pulse",
    name: "Heal Pulse Chip",
    cost: 2,
    effect: "heal_pulse",
    description: "Periodic heal pulse restores base HP during combat.",
  },
  {
    id: "chip_aoe_ring",
    name: "AoE Ring Chip",
    cost: 3,
    effect: "aoe_ring",
    description: "Adds/expands a small AoE ring on hit.",
  },
];

export function getBuffChipDef(id: string): BuffChipDef | undefined {
  return BUFF_CHIP_DEFS.find((c) => c.id === id);
}

/**
 * Pierce extra targets from a single chip's star level.
 * Prefer chipPierceExtra(unit, chips) for combat.
 */
export function pierceExtraTargets(chipStarLevel: number): number {
  return Math.max(1, Math.floor(chipStarLevel));
}
