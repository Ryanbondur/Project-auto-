import type { CreepAgenda, EraBossDef, EraBossId } from "../core/types";

/**
 * Named era bosses — story beats every ~10 waves / era transition.
 * Two named bosses per era with distinct agenda mixes + mechanics.
 * Fought on the main path (boss wave), not a second modal on top of Era Discovery.
 */
export const ERA_BOSS_DEFS: EraBossDef[] = [
  // —— Era 1 ——
  {
    id: "boss_path_splitter",
    name: "Lane Fracturer",
    era: 1,
    blurb: "Splits the lane — brief fork divert for the fight.",
    mechanic: "path_splitter",
    maxHp: 520,
    speed: 0.58,
    armor: 3,
    leakDamage: 15,
    agendas: ["shielded", "hex"],
    loot: [
      { kind: "gold", amount: 10, weight: 2 },
      { kind: "trait", traitId: "creep_hp_cut", weight: 1 },
      { kind: "unit", weight: 1 },
    ],
  },
  {
    id: "boss_tribe_warlord",
    name: "Tribe Warlord",
    era: 1,
    blurb: "Taxes coffers on spawn; regenerates and splits on death.",
    mechanic: "gold_tax",
    maxHp: 560,
    speed: 0.6,
    armor: 2,
    leakDamage: 15,
    agendas: ["regen", "splitter"],
    loot: [
      { kind: "gold", amount: 11, weight: 2 },
      { kind: "trait", traitId: "melee_damage", weight: 1 },
      { kind: "chip", weight: 1 },
    ],
  },
  // —— Era 2 ——
  {
    id: "boss_gold_tax",
    name: "Tithe Colossus",
    era: 2,
    blurb: "Taxes your coffers on spawn (−4g).",
    mechanic: "gold_tax",
    maxHp: 700,
    speed: 0.52,
    armor: 4,
    leakDamage: 15,
    agendas: ["regen", "siege"],
    loot: [
      { kind: "gold", amount: 14, weight: 2 },
      { kind: "trait", traitId: "interest_bonus", weight: 1 },
      { kind: "chip", weight: 1 },
    ],
  },
  {
    id: "boss_siege_saint",
    name: "Siege Saint",
    era: 2,
    blurb: "Forks the path; armored siege near the exit.",
    mechanic: "path_splitter",
    maxHp: 760,
    speed: 0.5,
    armor: 5,
    leakDamage: 16,
    agendas: ["shielded", "siege"],
    loot: [
      { kind: "gold", amount: 12, weight: 1 },
      { kind: "trait", traitId: "board_slot_plus", weight: 2 },
      { kind: "unit", weight: 1 },
    ],
  },
  // —— Era 3 ——
  {
    id: "boss_shop_lock",
    name: "Market Warden",
    era: 3,
    blurb: "Locks the shop next prep (no offers until the wave after).",
    mechanic: "disable_shop",
    maxHp: 900,
    speed: 0.5,
    armor: 5,
    leakDamage: 16,
    agendas: ["shielded", "regen"],
    loot: [
      { kind: "gold", amount: 12, weight: 1 },
      { kind: "trait", traitId: "board_slot_plus", weight: 2 },
      { kind: "chip", weight: 1 },
    ],
  },
  {
    id: "boss_furnace_king",
    name: "Furnace King",
    era: 3,
    blurb: "Hex choir heat — silences towers; siege near the core.",
    mechanic: "silence_pulse",
    maxHp: 980,
    speed: 0.48,
    armor: 5,
    leakDamage: 16,
    agendas: ["hex", "siege", "regen"],
    loot: [
      { kind: "gold", amount: 14, weight: 2 },
      { kind: "trait", traitId: "ballistic_damage", weight: 1 },
      { kind: "unit", weight: 1 },
    ],
  },
  // —— Era 4 ——
  {
    id: "boss_silence_choir",
    name: "Hex Choir",
    era: 4,
    blurb: "Hexes towers more aggressively; dual agendas.",
    mechanic: "silence_pulse",
    maxHp: 1100,
    speed: 0.48,
    armor: 5,
    leakDamage: 17,
    agendas: ["hex", "splitter"],
    loot: [
      { kind: "gold", amount: 16, weight: 1 },
      { kind: "trait", traitId: "ballistic_damage", weight: 2 },
      { kind: "unit", weight: 1 },
    ],
  },
  {
    id: "boss_blackout",
    name: "Blackout Marshal",
    era: 4,
    blurb: "Locks the shop; shielded hex pulse.",
    mechanic: "disable_shop",
    maxHp: 1180,
    speed: 0.46,
    armor: 6,
    leakDamage: 17,
    agendas: ["shielded", "hex"],
    loot: [
      { kind: "gold", amount: 15, weight: 1 },
      { kind: "trait", traitId: "support_as", weight: 2 },
      { kind: "chip", weight: 1 },
    ],
  },
  // —— Era 5 ——
  {
    id: "boss_endless_tax",
    name: "Null Cartel",
    era: 5,
    blurb: "Endless enforcer — gold tax + shop lock threat.",
    mechanic: "gold_tax_and_lock",
    maxHp: 1400,
    speed: 0.45,
    armor: 6,
    leakDamage: 18,
    agendas: ["shielded", "regen", "siege"],
    loot: [
      { kind: "gold", amount: 18, weight: 2 },
      { kind: "trait", traitId: "ballistic_damage", weight: 1 },
      { kind: "trait", traitId: "board_slot_plus", weight: 1 },
      { kind: "chip", weight: 1 },
    ],
  },
  {
    id: "boss_glitch_sovereign",
    name: "Glitch Sovereign",
    era: 5,
    blurb: "Full agenda stack — tax, lock, and fork threat.",
    mechanic: "gold_tax_and_lock",
    maxHp: 1550,
    speed: 0.42,
    armor: 7,
    leakDamage: 19,
    agendas: ["shielded", "regen", "splitter", "hex"],
    loot: [
      { kind: "gold", amount: 20, weight: 2 },
      { kind: "trait", traitId: "leak_brace", weight: 1 },
      { kind: "trait", traitId: "melee_damage", weight: 1 },
      { kind: "unit", weight: 1 },
    ],
  },
];

export function getEraBossDef(id: EraBossId): EraBossDef | undefined {
  return ERA_BOSS_DEFS.find((b) => b.id === id);
}

export function eraBossesForEra(era: 1 | 2 | 3 | 4 | 5): EraBossDef[] {
  return ERA_BOSS_DEFS.filter((b) => b.era === era);
}

/**
 * Boss for a boss-wave number (every 10).
 * Cycles named bosses within the era so repeats stay fresh.
 */
export function eraBossForWave(
  waveNumber: number,
  currentEra: 1 | 2 | 3 | 4 | 5,
): EraBossDef {
  const band = Math.max(1, Math.ceil(waveNumber / 10));
  const era = Math.min(5, Math.max(1, Math.min(band, currentEra))) as
    | 1
    | 2
    | 3
    | 4
    | 5;
  const pool = eraBossesForEra(era);
  if (pool.length === 0) {
    return ERA_BOSS_DEFS[ERA_BOSS_DEFS.length - 1]!;
  }
  const idx = Math.max(0, band - 1) % pool.length;
  return pool[idx]!;
}

export function bossAgendas(def: EraBossDef): CreepAgenda[] {
  return [...def.agendas];
}
