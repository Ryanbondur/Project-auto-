import { getBuffChipDef } from "../content/buffChips";
import type { BuffChipInstance, UnitInstance } from "./types";

/** Flat damage multiplier from damage chips: +18% per star per chip. */
export function chipDamageMultiplier(
  unit: UnitInstance,
  chips: BuffChipInstance[],
): number {
  let bonus = 0;
  for (const id of unit.chipInstanceIds) {
    const chip = chips.find((c) => c.instanceId === id);
    if (!chip) continue;
    const def = getBuffChipDef(chip.defId);
    if (def?.effect === "damage") {
      bonus += 0.18 * chip.starLevel;
    }
  }
  return 1 + bonus;
}

/** Extra AoE radius (tiles) from aoe_ring chips. */
export function chipAoeBonus(
  unit: UnitInstance,
  chips: BuffChipInstance[],
): number {
  let bonus = 0;
  for (const id of unit.chipInstanceIds) {
    const chip = chips.find((c) => c.instanceId === id);
    if (!chip) continue;
    const def = getBuffChipDef(chip.defId);
    if (def?.effect === "aoe_ring") {
      bonus += 0.55 * chip.starLevel;
    }
  }
  return bonus;
}

/** Extra pierce targets beyond the primary. */
export function chipPierceExtra(
  unit: UnitInstance,
  chips: BuffChipInstance[],
): number {
  let extra = 0;
  for (const id of unit.chipInstanceIds) {
    const chip = chips.find((c) => c.instanceId === id);
    if (!chip) continue;
    const def = getBuffChipDef(chip.defId);
    if (def?.effect === "pierce") {
      extra += Math.max(1, Math.floor(chip.starLevel));
    }
  }
  return extra;
}

/**
 * Lifesteal fraction of damage dealt → base HP heal.
 * 8% per star per chip (capped later by combat).
 */
export function chipLifestealFraction(
  unit: UnitInstance,
  chips: BuffChipInstance[],
): number {
  let frac = 0;
  for (const id of unit.chipInstanceIds) {
    const chip = chips.find((c) => c.instanceId === id);
    if (!chip) continue;
    const def = getBuffChipDef(chip.defId);
    if (def?.effect === "lifesteal") {
      frac += 0.08 * chip.starLevel;
    }
  }
  return frac;
}

/**
 * Heal-pulse amount per pulse (base HP), scaled by chip stars.
 * 1★ ≈ 1 HP; stacks across chips.
 */
export function chipHealPulseAmount(
  unit: UnitInstance,
  chips: BuffChipInstance[],
): number {
  let amount = 0;
  for (const id of unit.chipInstanceIds) {
    const chip = chips.find((c) => c.instanceId === id);
    if (!chip) continue;
    const def = getBuffChipDef(chip.defId);
    if (def?.effect === "heal_pulse") {
      amount += Math.max(1, chip.starLevel);
    }
  }
  return amount;
}

/** Heal-pulse interval in ms (faster with more / higher stars, soft floor). */
export const HEAL_PULSE_INTERVAL_MS = 4000;
