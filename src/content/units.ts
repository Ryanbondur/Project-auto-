import type { UnitDef } from "../core/types";

/**
 * Placeholder roster: 4 units per era (20 total) for shop + Era Discovery variety.
 * Stats scale roughly with era/cost. Abilities are string stubs.
 */
export const UNIT_DEFS: UnitDef[] = [
  // —— Era 1 Primitive / Ancient ——
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
  // —— Era 2 Medieval / Feudal ——
  {
    id: "unit_archer",
    name: "Archer",
    era: 2,
    cost: 2,
    tags: ["Ballistic", "Medieval"],
    stats: { damage: 14, attackSpeed: 1.1, range: 3.5, aoeRadius: 0 },
    abilities: {
      starLevel2: "Volley: every 4th shot fires two arrows.",
      starLevel3: "Critical hits deal double damage.",
    },
  },
  {
    id: "unit_knight",
    name: "Knight",
    era: 2,
    cost: 3,
    tags: ["Melee", "Medieval"],
    stats: { damage: 26, attackSpeed: 0.65, range: 1.6, aoeRadius: 0 },
    abilities: {
      starLevel2: "Charges the first creep in range for bonus damage.",
      starLevel3: "Taunts nearby creeps briefly on hit.",
    },
  },
  {
    id: "unit_catapult",
    name: "Catapult",
    era: 2,
    cost: 4,
    tags: ["Siege", "Medieval"],
    stats: { damage: 40, attackSpeed: 0.35, range: 4.0, aoeRadius: 1.4 },
    abilities: {
      starLevel2: "Shells leave a short burn zone.",
      starLevel3: "Wider blast radius.",
    },
  },
  {
    id: "unit_monk",
    name: "Monk",
    era: 2,
    cost: 3,
    tags: ["Support", "Medieval"],
    stats: { damage: 8, attackSpeed: 0.85, range: 2.8, aoeRadius: 0.8 },
    abilities: {
      starLevel2: "Pulses a small heal to nearby allies.",
      starLevel3: "Heal pulse also cleanses one debuff.",
    },
  },
  // —— Era 3 Industrial / Steam ——
  {
    id: "unit_musket",
    name: "Musket Line",
    era: 3,
    cost: 2,
    tags: ["Ballistic", "Industrial"],
    stats: { damage: 22, attackSpeed: 0.9, range: 3.8, aoeRadius: 0 },
    abilities: {
      starLevel2: "Reload burst after killing a creep.",
      starLevel3: "Armor-piercing: ignore part of creep armor.",
    },
  },
  {
    id: "unit_cannon",
    name: "Field Cannon",
    era: 3,
    cost: 4,
    tags: ["Siege", "Industrial"],
    stats: { damage: 55, attackSpeed: 0.32, range: 4.2, aoeRadius: 1.5 },
    abilities: {
      starLevel2: "Shells stagger creeps (brief slow).",
      starLevel3: "Chain splash to a second nearby creep.",
    },
  },
  {
    id: "unit_gatling",
    name: "Gatling Gun",
    era: 3,
    cost: 5,
    tags: ["Ballistic", "Industrial"],
    stats: { damage: 12, attackSpeed: 2.2, range: 3.2, aoeRadius: 0 },
    abilities: {
      starLevel2: "Spin-up: attack speed rises while firing the same target.",
      starLevel3: "Overheat: brief cone spray.",
    },
  },
  {
    id: "unit_medic_steam",
    name: "Steam Medic",
    era: 3,
    cost: 3,
    tags: ["Support", "Industrial"],
    stats: { damage: 10, attackSpeed: 1.0, range: 2.6, aoeRadius: 1.0 },
    abilities: {
      starLevel2: "Repairs nearby allies (placeholder heal pulse).",
      starLevel3: "Emergency vent: AoE slow on creeps.",
    },
  },
  // —— Era 4 Modern Warfare ——
  {
    id: "unit_m16_soldier",
    name: "M16 Infantry",
    era: 4,
    cost: 4,
    tags: ["Ballistic", "Modern"],
    stats: { damage: 45, attackSpeed: 1.2, range: 3.5, aoeRadius: 0 },
    abilities: {
      starLevel2: "Gains +20% Attack Speed burst on target switch.",
      starLevel3: "Fires Armor-Piercing rounds dealing 1.5x damage to heavy enemies.",
    },
  },
  {
    id: "unit_sniper",
    name: "Sniper",
    era: 4,
    cost: 5,
    tags: ["Ballistic", "Modern"],
    stats: { damage: 90, attackSpeed: 0.45, range: 5.5, aoeRadius: 0 },
    abilities: {
      starLevel2: "Marks the strongest creep for bonus damage.",
      starLevel3: "Headshot executes low-HP creeps.",
    },
  },
  {
    id: "unit_rpg",
    name: "RPG Team",
    era: 4,
    cost: 5,
    tags: ["Siege", "Modern"],
    stats: { damage: 70, attackSpeed: 0.4, range: 4.0, aoeRadius: 1.6 },
    abilities: {
      starLevel2: "Blast knocks creeps back slightly.",
      starLevel3: "Anti-armor warheads vs tanks/bosses.",
    },
  },
  {
    id: "unit_drone_spotter",
    name: "Drone Spotter",
    era: 4,
    cost: 3,
    tags: ["Support", "Modern"],
    stats: { damage: 14, attackSpeed: 1.1, range: 4.0, aoeRadius: 0.6 },
    abilities: {
      starLevel2: "Reveals creeps; allies gain slight range.",
      starLevel3: "Laser designate: shared damage amp.",
    },
  },
  // —— Era 5 Futuristic / Cyber ——
  {
    id: "unit_laser_grid",
    name: "Laser Grid",
    era: 5,
    cost: 4,
    tags: ["Energy", "Cyber"],
    stats: { damage: 35, attackSpeed: 1.4, range: 3.6, aoeRadius: 0.4 },
    abilities: {
      starLevel2: "Beams chain to a second creep.",
      starLevel3: "Overcharge: brief damage spike.",
    },
  },
  {
    id: "unit_nano_swarm",
    name: "Nano Swarm",
    era: 5,
    cost: 3,
    tags: ["Swarm", "Cyber"],
    stats: { damage: 18, attackSpeed: 1.8, range: 2.8, aoeRadius: 1.2 },
    abilities: {
      starLevel2: "Dots stack on creeps in the cloud.",
      starLevel3: "Swarm expands after a kill.",
    },
  },
  {
    id: "unit_shield_bot",
    name: "Shield Bot",
    era: 5,
    cost: 4,
    tags: ["Support", "Cyber"],
    stats: { damage: 16, attackSpeed: 1.0, range: 3.0, aoeRadius: 1.0 },
    abilities: {
      starLevel2: "Projects a damage-absorb bubble on allies.",
      starLevel3: "Reflects a portion of absorbed damage.",
    },
  },
  {
    id: "unit_rail_turret",
    name: "Rail Turret",
    era: 5,
    cost: 5,
    tags: ["Siege", "Cyber"],
    stats: { damage: 110, attackSpeed: 0.38, range: 5.0, aoeRadius: 0.3 },
    abilities: {
      starLevel2: "Pierces through the first creep hit.",
      starLevel3: "Charged shot stuns briefly.",
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
