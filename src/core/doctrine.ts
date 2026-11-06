import { getDoctrineDef } from "../content/doctrines";
import type { DoctrineId, RunModifiers, RunState } from "./types";

/** Shop weight bump for tag-biased doctrines. */
export const DOCTRINE_TAG_SHOP_WEIGHT = 2.2;
/** @deprecated Prefer DOCTRINE_TAG_SHOP_WEIGHT — kept for ballistic callers. */
export const DOCTRINE_BALLISTIC_SHOP_WEIGHT = DOCTRINE_TAG_SHOP_WEIGHT;
/** Attack-speed bonus for Ballistic units. */
export const DOCTRINE_BALLISTIC_AS_BONUS = 0.12;
/** Damage bonus for Siege units under Siege Battery. */
export const DOCTRINE_SIEGE_DAMAGE_BONUS = 0.12;
/** Attack-speed bonus for Swarm units under Swarm Tide. */
export const DOCTRINE_SWARM_AS_BONUS = 0.15;
/** Support aura: ally damage buff within this tile radius. */
export const DOCTRINE_SUPPORT_AURA_RANGE = 2.5;
export const DOCTRINE_SUPPORT_AURA_DAMAGE = 0.1;
/** Gold granted on each pairwise merge. */
export const DOCTRINE_MERGE_GOLD = 2;
/** Extra chip chance additive under Merge Gambler. */
export const DOCTRINE_CHIP_CHANCE_BONUS = 0.12;
/** Path Warden starting slow duration (waves). */
export const DOCTRINE_WARDEN_SLOW_WAVES = 3;
/** Sabotage gold discount (floors at 1). */
export const DOCTRINE_SABOTAGE_DISCOUNT = 1;
/** Deep Coffers starting gold bonus. */
export const DOCTRINE_COFFERS_GOLD = 5;
/** Deep Coffers flat interest each payout. */
export const DOCTRINE_COFFERS_INTEREST = 1;
/** Iron Curtain starting board slot. */
export const DOCTRINE_CURTAIN_SLOTS = 1;
/** Iron Curtain leak reduction. */
export const DOCTRINE_CURTAIN_LEAK = 1;

/**
 * Apply doctrine one-shot / persistent modifiers at run creation.
 * Call after createEmptyModifiers + meta skills.
 */
export function applyDoctrineToRun(
  state: RunState,
  doctrineId: DoctrineId,
  midPathIndex: number,
): void {
  state.doctrineId = doctrineId;
  const def = getDoctrineDef(doctrineId);
  if (!def) return;

  switch (doctrineId) {
    case "ballistic_overclock":
    case "support_aura":
    case "merge_gambler":
    case "siege_battery":
    case "swarm_tide":
      break;
    case "path_warden":
      state.modifiers.pathSlow = {
        pathIndex: Math.max(0, midPathIndex),
        wavesRemaining: DOCTRINE_WARDEN_SLOW_WAVES,
      };
      break;
    case "deep_coffers":
      state.gold += DOCTRINE_COFFERS_GOLD;
      break;
    case "iron_curtain":
      state.modifiers.boardSlotsBonus += DOCTRINE_CURTAIN_SLOTS;
      state.modifiers.leakDamageReduction += DOCTRINE_CURTAIN_LEAK;
      state.modifiers.traits.push("board_slot_plus", "leak_brace");
      break;
    default: {
      const _exhaustive: never = doctrineId;
      void _exhaustive;
    }
  }
}

/** Flat interest added each payout while doctrine is Deep Coffers. */
export function doctrineInterestBonus(doctrineId: DoctrineId | null): number {
  return doctrineId === "deep_coffers" ? DOCTRINE_COFFERS_INTEREST : 0;
}

/** Sabotage offer cost after Path Warden discount. */
export function doctrineSabotageCost(
  baseCost: number,
  doctrineId: DoctrineId | null,
): number {
  if (doctrineId !== "path_warden") return baseCost;
  return Math.max(1, baseCost - DOCTRINE_SABOTAGE_DISCOUNT);
}

/** Gold granted when a merge resolves under Merge Gambler. */
export function doctrineMergeGold(doctrineId: DoctrineId | null): number {
  return doctrineId === "merge_gambler" ? DOCTRINE_MERGE_GOLD : 0;
}

/** Chip chance bonus under Merge Gambler. */
export function doctrineChipChanceBonus(doctrineId: DoctrineId | null): number {
  return doctrineId === "merge_gambler" ? DOCTRINE_CHIP_CHANCE_BONUS : 0;
}

/** Whether shop should bias Ballistic units. */
export function doctrineBallisticShopBias(doctrineId: DoctrineId | null): boolean {
  return doctrineId === "ballistic_overclock";
}

/** Primary shop tag bias for doctrines (null = none). */
export function doctrineShopBiasTags(
  doctrineId: DoctrineId | null,
): string[] {
  if (doctrineId === "ballistic_overclock") return ["Ballistic"];
  if (doctrineId === "siege_battery") return ["Siege"];
  if (doctrineId === "swarm_tide") return ["Swarm", "Energy"];
  return [];
}

export function doctrineSupportsAura(doctrineId: DoctrineId | null): boolean {
  return doctrineId === "support_aura";
}

export function doctrineBallisticAsBonus(doctrineId: DoctrineId | null): number {
  return doctrineId === "ballistic_overclock" ? DOCTRINE_BALLISTIC_AS_BONUS : 0;
}

export function doctrineSiegeDamageBonus(doctrineId: DoctrineId | null): number {
  return doctrineId === "siege_battery" ? DOCTRINE_SIEGE_DAMAGE_BONUS : 0;
}

export function doctrineSwarmAsBonus(doctrineId: DoctrineId | null): number {
  return doctrineId === "swarm_tide" ? DOCTRINE_SWARM_AS_BONUS : 0;
}

/** Test helper: empty modifiers + doctrine apply without full store. */
export function applyDoctrineModifiersOnly(
  modifiers: RunModifiers,
  doctrineId: DoctrineId,
  midPathIndex: number,
): void {
  if (doctrineId === "path_warden") {
    modifiers.pathSlow = {
      pathIndex: Math.max(0, midPathIndex),
      wavesRemaining: DOCTRINE_WARDEN_SLOW_WAVES,
    };
  }
  if (doctrineId === "iron_curtain") {
    modifiers.boardSlotsBonus += DOCTRINE_CURTAIN_SLOTS;
    modifiers.leakDamageReduction += DOCTRINE_CURTAIN_LEAK;
  }
}
