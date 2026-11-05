import type { UnitDef } from "../core/types";

/**
 * Tiny Phase 1 placeholder pool (era 1 only for shop shell).
 * Full 4-per-era roster arrives with later phases.
 */
export const UNIT_DEFS: UnitDef[] = [
  {
    id: "unit_slinger",
    name: "Slinger",
    era: 1,
    cost: 1,
    tags: ["Ballistic", "Primitive"],
    stats: { damage: 8, attackSpeed: 1.0, range: 3.0, aoeRadius: 0 },
    abilities: {
      starLevel2: "Throws faster after first hit on a target.",
      starLevel3: "Stones pierce one extra creep.",
    },
  },
  {
    id: "unit_spearman",
    name: "Spearman",
    era: 1,
    cost: 2,
    tags: ["Melee", "Primitive"],
    stats: { damage: 18, attackSpeed: 0.7, range: 1.5, aoeRadius: 0 },
    abilities: {
      starLevel2: "First attack on a creep deals bonus damage.",
      starLevel3: "Briefly slows the target on hit.",
    },
  },
  {
    id: "unit_tribe_drummer",
    name: "Tribe Drummer",
    era: 1,
    cost: 3,
    tags: ["Support", "Primitive"],
    stats: { damage: 6, attackSpeed: 0.9, range: 2.5, aoeRadius: 1.0 },
    abilities: {
      starLevel2: "Nearby allies gain a small attack-speed aura.",
      starLevel3: "Aura also grants a damage buff.",
    },
  },
  {
    id: "unit_boulder_roll",
    name: "Boulder Roll",
    era: 1,
    cost: 3,
    tags: ["Siege", "Primitive"],
    stats: { damage: 28, attackSpeed: 0.4, range: 2.0, aoeRadius: 1.2 },
    abilities: {
      starLevel2: "Boulder knocks creeps slightly back along the path.",
      starLevel3: "Larger impact radius.",
    },
  },
];

export function getUnitDef(id: string): UnitDef | undefined {
  return UNIT_DEFS.find((u) => u.id === id);
}

/** Era hue for placeholder rects (degrees on HSL). */
export const ERA_HUE: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 28,
  2: 210,
  3: 35,
  4: 120,
  5: 280,
};
