import { createRng } from "./rng";
import type {
  RunEventChoice,
  RunEventId,
  RunModifiers,
  RunState,
  RunTraitId,
} from "./types";

/**
 * Events fire on **era change** (wave bands ~10/20/30/40…), not every few waves.
 *
 * Queue with Era Discovery (documented):
 * 1. Wave clear crosses era threshold → ERA_FREEZE + Era Discovery sheet
 * 2. Player picks free 2★ → then Event Choice (exactly 1 of 2)
 * 3. Never open both sheets the same frame
 *
 * After era 5 (endless), continue the ~10-wave cadence via wavesCleared % 10
 * so late runs still get events without a further era unlock.
 */
export const EVENT_WAVE_BAND = 10;

/** Boss arena fail penalties — never ends the run by itself (HP floors at 1). */
export const BOSS_ARENA_FAIL_GOLD = 8;
export const BOSS_ARENA_FAIL_HP = 15;
/** Boss arena win loot gold fallback. */
export const BOSS_ARENA_LOOT_GOLD = 12;
/** Elite arena loot gold bump. */
export const BOSS_ARENA_ELITE_LOOT_GOLD = 18;

export type RunEventDef = {
  id: RunEventId;
  title: string;
  blurb: string;
  /** Optional gold cost to accept (spend-gold deals). */
  goldCost?: number;
  kind: "boss" | "chest" | "spend" | "passive";
};

export const RUN_EVENT_DEFS: RunEventDef[] = [
  {
    id: "boss_arena",
    title: "Boss bounty",
    blurb: "Separate arena: beat a tough boss for loot. Fail costs gold/HP — not the run.",
    kind: "boss",
  },
  {
    id: "boss_arena_elite",
    title: "Elite bounty",
    blurb: "Harder arena boss, richer loot. Fail still costs gold/HP — not the run.",
    kind: "boss",
  },
  {
    id: "trait_chest",
    title: "Trait chest",
    blurb: "Open a chest for a random run trait (stacks additively, no cap).",
    kind: "chest",
  },
  {
    id: "gold_board_slot",
    title: "Buy a pad",
    blurb: "Spend 6 gold → +1 board slot for the rest of the run.",
    goldCost: 6,
    kind: "spend",
  },
  {
    id: "gold_heal_core",
    title: "Core patch",
    blurb: "Spend 5 gold → restore 20 base HP (capped).",
    goldCost: 5,
    kind: "spend",
  },
  {
    id: "gold_rerolls",
    title: "Buy rerolls",
    blurb: "Spend 4 gold → 2 free shop rerolls this prep.",
    goldCost: 4,
    kind: "spend",
  },
  {
    id: "gold_shop_offers",
    title: "Extra offer",
    blurb: "Spend 5 gold → +1 shop offer slot this prep.",
    goldCost: 5,
    kind: "spend",
  },
  {
    id: "gold_leak_brace",
    title: "Brace the gate",
    blurb: "Spend 7 gold → leaks deal 1 less damage (stacks).",
    goldCost: 7,
    kind: "spend",
  },
  {
    id: "gold_interest_deal",
    title: "Bond deal",
    blurb: "Spend 6 gold → +2 interest on the next wave payout.",
    goldCost: 6,
    kind: "spend",
  },
  {
    id: "board_slot_plus",
    title: "+1 board slot",
    blurb: "One extra placeable slot for the rest of this run.",
    kind: "passive",
  },
  {
    id: "path_slow_lane",
    title: "Path twist",
    blurb: "A mid-path segment slows creeps for the next 3 waves.",
    kind: "passive",
  },
  {
    id: "path_mutate",
    title: "Living path",
    blurb: "The lane mutates — lengthen, bend, or brief fork. Towers on new path tiles auto-bench.",
    kind: "passive",
  },
  {
    id: "path_fork_lane",
    title: "Fork gift",
    blurb: "Brief path fork for 3 waves — creeps divert sideways near the bend.",
    kind: "passive",
  },
  {
    id: "draft_duel",
    title: "Draft duel",
    blurb: "Scout 3 rival boards and pick a counter trait for the next segment.",
    kind: "passive",
  },
  {
    id: "interest_bonus",
    title: "Interest bump",
    blurb: "+1 interest on the next wave payout.",
    kind: "passive",
  },
  {
    id: "creep_hp_cut",
    title: "Weakened swarm",
    blurb: "Next wave creeps spawn with −10% HP.",
    kind: "passive",
  },
  {
    id: "ballistic_damage",
    title: "Ballistic surge",
    blurb: "All Ballistic units +10% damage (stacks, uncapped).",
    kind: "passive",
  },
  {
    id: "melee_surge",
    title: "Melee surge",
    blurb: "All Melee units +10% damage (stacks, uncapped).",
    kind: "passive",
  },
  {
    id: "support_surge",
    title: "Support pulse",
    blurb: "All Support units +10% attack speed (stacks, uncapped).",
    kind: "passive",
  },
  {
    id: "free_buff_chip",
    title: "Chip crate",
    blurb: "Gain a free random buff chip in inventory.",
    kind: "chest",
  },
];

/** Random traits granted by the trait chest (additive stacks). */
export const CHEST_TRAIT_POOL: {
  id: RunTraitId;
  label: string;
  apply: (m: RunModifiers) => void;
}[] = [
  {
    id: "ballistic_damage",
    label: "Ballistic +10% dmg",
    apply: (m) => {
      m.ballisticDamageBonus += 0.1;
    },
  },
  {
    id: "melee_damage",
    label: "Melee +10% dmg",
    apply: (m) => {
      m.meleeDamageBonus += 0.1;
    },
  },
  {
    id: "support_as",
    label: "Support +10% AS",
    apply: (m) => {
      m.supportAsBonus += 0.1;
    },
  },
  {
    id: "interest_bonus",
    label: "Interest +1 next payout",
    apply: (m) => {
      m.interestBonusNextPayout += 1;
    },
  },
  {
    id: "creep_hp_cut",
    label: "Next wave −10% HP",
    apply: (m) => {
      // Additive stacks, no cap (floor at 10% HP remaining).
      m.nextWaveHpMult = Math.max(0.1, m.nextWaveHpMult - 0.1);
    },
  },
  {
    id: "board_slot_plus",
    label: "+1 board slot",
    apply: (m) => {
      m.boardSlotsBonus += 1;
    },
  },
  {
    id: "leak_brace",
    label: "Leak −1 dmg",
    apply: (m) => {
      m.leakDamageReduction += 1;
    },
  },
];

export function getRunEventDef(id: RunEventId): RunEventDef | undefined {
  return RUN_EVENT_DEFS.find((e) => e.id === id);
}

export function createEmptyModifiers(): RunModifiers {
  return {
    boardSlotsBonus: 0,
    ballisticDamageBonus: 0,
    meleeDamageBonus: 0,
    supportAsBonus: 0,
    interestBonusNextPayout: 0,
    nextWaveHpMult: 1,
    freeRerolls: 0,
    shopOfferBonusThisPrep: 0,
    pathSlow: null,
    traits: [],
    leakDamageReduction: 0,
    shopDisabledThisPrep: false,
    pathFork: null,
  };
}

/**
 * Offer an event after era discovery, or on the 10-wave band once already at
 * max era (endless continuation). Never while ERA_FREEZE is open.
 */
export function shouldOfferRunEventAfterEra(): boolean {
  return true;
}

/** Late-game cadence once era 5 is unlocked (no further era sheets). */
export function shouldOfferRunEventAtWaveBand(
  currentEra: number,
  wavesCleared: number,
): boolean {
  if (currentEra < 5) return false;
  return wavesCleared > 0 && wavesCleared % EVENT_WAVE_BAND === 0;
}

/**
 * Roll exactly 2 distinct event options.
 * Spend-gold deals that the player cannot afford are deprioritized but may
 * still appear (UI disables them).
 */
export function rollEventChoices(
  seed: number,
  gold: number,
): { choices: RunEventChoice[]; nextSeed: number } {
  const rand = createRng(seed);
  const pool = [...RUN_EVENT_DEFS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }

  // Prefer at least one non-spend if both rolled spends are unaffordable.
  const affordable = pool.filter(
    (d) => d.goldCost === undefined || gold >= d.goldCost,
  );
  const ordered =
    affordable.length >= 2
      ? [...affordable, ...pool.filter((d) => !affordable.includes(d))]
      : pool;

  const picks = ordered.slice(0, 2);
  // Ensure exactly 2 (catalog is larger).
  while (picks.length < 2 && pool.length > picks.length) {
    const next = pool.find((d) => !picks.includes(d));
    if (!next) break;
    picks.push(next);
  }

  const choices: RunEventChoice[] = picks.map((d) => ({
    id: d.id,
    title: d.title,
    blurb: d.blurb,
    goldCost: d.goldCost,
    kind: d.kind,
  }));
  const nextSeed = (seed + 1 + Math.floor(rand() * 1e9)) >>> 0;
  return { choices, nextSeed };
}

export type ApplyEventResult =
  | { kind: "applied"; chestTraitLabel?: string }
  | { kind: "start_boss_arena"; elite?: boolean }
  | { kind: "path_mutate" }
  | { kind: "start_draft_duel" }
  | { kind: "grant_chip" }
  | { kind: "cannot_afford" };

/**
 * Apply a picked event. Boss arena returns start_boss_arena for the store to
 * enter the separate fight. Traits stack additively with no cap.
 */
export function applyRunEvent(
  state: RunState,
  eventId: RunEventId,
  pathAnchorIndex: number,
  rand: () => number,
): ApplyEventResult {
  const def = getRunEventDef(eventId);
  if (def?.goldCost !== undefined) {
    if (state.gold < def.goldCost) return { kind: "cannot_afford" };
    state.gold -= def.goldCost;
  }

  const m = state.modifiers;
  switch (eventId) {
    case "boss_arena":
      return { kind: "start_boss_arena", elite: false };
    case "boss_arena_elite":
      return { kind: "start_boss_arena", elite: true };
    case "trait_chest": {
      const trait =
        CHEST_TRAIT_POOL[Math.floor(rand() * CHEST_TRAIT_POOL.length)] ??
        CHEST_TRAIT_POOL[0]!;
      trait.apply(m);
      m.traits.push(trait.id);
      return { kind: "applied", chestTraitLabel: trait.label };
    }
    case "gold_board_slot":
    case "board_slot_plus":
      m.boardSlotsBonus += 1;
      m.traits.push("board_slot_plus");
      break;
    case "gold_heal_core":
      state.baseHp = Math.min(100, state.baseHp + 20);
      break;
    case "gold_rerolls":
      m.freeRerolls += 2;
      state.gambit.freeRerollsRemaining += 2;
      break;
    case "gold_shop_offers":
      m.shopOfferBonusThisPrep += 1;
      break;
    case "gold_leak_brace":
      m.leakDamageReduction += 1;
      m.traits.push("leak_brace");
      break;
    case "gold_interest_deal":
      m.interestBonusNextPayout += 2;
      m.traits.push("interest_bonus");
      break;
    case "path_slow_lane":
      m.pathSlow = {
        pathIndex: Math.max(0, pathAnchorIndex),
        wavesRemaining: 3,
      };
      break;
    case "path_mutate":
      return { kind: "path_mutate" };
    case "path_fork_lane":
      m.pathFork = {
        pathIndex: Math.max(0, pathAnchorIndex),
        wavesRemaining: 3,
      };
      break;
    case "draft_duel":
      return { kind: "start_draft_duel" };
    case "interest_bonus":
      m.interestBonusNextPayout += 1;
      m.traits.push("interest_bonus");
      break;
    case "creep_hp_cut":
      m.nextWaveHpMult = Math.max(0.1, m.nextWaveHpMult - 0.1);
      m.traits.push("creep_hp_cut");
      break;
    case "ballistic_damage":
      m.ballisticDamageBonus += 0.1;
      m.traits.push("ballistic_damage");
      break;
    case "melee_surge":
      m.meleeDamageBonus += 0.1;
      m.traits.push("melee_damage");
      break;
    case "support_surge":
      m.supportAsBonus += 0.1;
      m.traits.push("support_as");
      break;
    case "free_buff_chip":
      return { kind: "grant_chip" };
    default: {
      const _exhaustive: never = eventId;
      void _exhaustive;
      break;
    }
  }
  return { kind: "applied" };
}

/** Tick path-slow / path-fork duration after a wave clears. */
export function tickPathSlowAfterWave(modifiers: RunModifiers): void {
  if (modifiers.pathSlow) {
    modifiers.pathSlow.wavesRemaining -= 1;
    if (modifiers.pathSlow.wavesRemaining <= 0) {
      modifiers.pathSlow = null;
    }
  }
  if (modifiers.pathFork) {
    modifiers.pathFork.wavesRemaining -= 1;
    if (modifiers.pathFork.wavesRemaining <= 0) {
      modifiers.pathFork = null;
    }
  }
}

export function consumeShopOfferBonus(modifiers: RunModifiers): number {
  const bonus = modifiers.shopOfferBonusThisPrep;
  modifiers.shopOfferBonusThisPrep = 0;
  return bonus;
}

export function consumeNextWaveHpMult(modifiers: RunModifiers): number {
  const mult = modifiers.nextWaveHpMult;
  modifiers.nextWaveHpMult = 1;
  return mult;
}

export function consumeInterestBonus(modifiers: RunModifiers): number {
  const bonus = modifiers.interestBonusNextPayout;
  modifiers.interestBonusNextPayout = 0;
  return bonus;
}

export function effectiveBoardSlots(
  eraMaxSlots: number,
  modifiers: RunModifiers,
): number {
  return eraMaxSlots + Math.max(0, modifiers.boardSlotsBonus);
}

/** Apply arena fail costs without ending the run (HP floors at 1). */
export function applyBossArenaFail(state: RunState): void {
  state.gold = Math.max(0, state.gold - BOSS_ARENA_FAIL_GOLD);
  state.baseHp = Math.max(1, state.baseHp - BOSS_ARENA_FAIL_HP);
  state.arena = null;
  state.creeps = [];
  state.projectiles = [];
  state.waveRuntime = null;
  state.phase = "SHOP_PREP";
}
