import {
  INTEREST_PER_10,
  MERGED_SELL_RATE,
  WAVE_INCOME,
  baseCopiesForStar,
} from "./constants";

/**
 * Interest on gold held at wave completion, BEFORE +5 income (TFT-like).
 * +1 per 10 gold, capped at interestCap (5 default / 8 with skill).
 */
export function calcInterest(gold: number, interestCap: number): number {
  if (gold < 0) return 0;
  return Math.min(interestCap, Math.floor(gold / 10) * INTEREST_PER_10);
}

export function waveIncome(): number {
  return WAVE_INCOME;
}

/**
 * Sell refund for a unit of given base purchase cost and star level.
 * 1★: 100% of cost.
 * ≥2★: floor(0.8 * 2^(star-1) * cost) — pairwise composition (design-decisions).
 */
export function sellValue(unitCost: number, starLevel: number): number {
  const cost = Math.max(0, unitCost);
  const star = Math.max(1, Math.floor(starLevel));
  if (star <= 1) return cost;
  return Math.floor(MERGED_SELL_RATE * baseCopiesForStar(star) * cost);
}

/** Sell refund for a buff chip (same pairwise composition formula). */
export function sellChipValue(chipCost: number, starLevel: number): number {
  return sellValue(chipCost, starLevel);
}

export type WavePayout = {
  interest: number;
  income: number;
  total: number;
  goldAfter: number;
};

/** Apply interest (on current gold) then wave income. */
export function applyWavePayout(
  gold: number,
  interestCap: number,
): WavePayout {
  const interest = calcInterest(gold, interestCap);
  const income = waveIncome();
  const total = interest + income;
  return {
    interest,
    income,
    total,
    goldAfter: gold + total,
  };
}
