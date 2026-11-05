/** Locked design defaults — see docs/design-decisions.md (overrides architecture §9). */

export const STARTING_GOLD = 10;
export const STARTING_BASE_HP = 100;
export const DEFAULT_BENCH_CAPACITY = 5;
/** Design-decisions: 3 offers (architecture default of 5 is overridden). */
export const SHOP_SIZE = 3;
export const REROLL_COST = 1 as const;
export const WAVE_INCOME = 5;
export const INTEREST_PER_10 = 1;
export const INTEREST_CAP_DEFAULT = 5;
export const INTEREST_CAP_SKILL = 8;
export const STANDARD_LEAK_DAMAGE = 1;
export const BOSS_LEAK_DAMAGE = 15;
export const XP_PER_WAVE_CLEARED = 15;
/** Endless runs — wave-100 victory is disabled (design-decisions). Kept for reference only. */
export const VICTORY_WAVE = Number.POSITIVE_INFINITY;

export const GRID_WIDTH = 14;
export const GRID_HEIGHT = 10;
export const TILE_SIZE_PX = 48;

/**
 * Star stat multipliers on base stats.
 * Canon: 1★ ×1, 2★ ×2, 3★ ×3.5.
 * Provisional for 4★+: continue the 3★/2★ growth ratio (1.75× per additional star).
 *   mult(n) = 3.5 * 1.75^(n-3) for n >= 3; special-cased below for 1–2.
 * No hard star cap in code for now.
 */
export const STAR_GROWTH_AFTER_3 = 1.75;

export function starStatMultiplier(starLevel: number): number {
  const n = Math.max(1, Math.floor(starLevel));
  if (n === 1) return 1;
  if (n === 2) return 2;
  // n >= 3: 3.5 * 1.75^(n-3)
  return 3.5 * STAR_GROWTH_AFTER_3 ** (n - 3);
}

/**
 * Pairwise merge: a k★ unit is composed of 2^(k-1) base 1★ copies.
 * Sell: 100% of purchase for 1★; 80% of total composed value for merged (star ≥ 2).
 */
export function baseCopiesForStar(starLevel: number): number {
  return 2 ** (Math.max(1, Math.floor(starLevel)) - 1);
}

export const MERGED_SELL_RATE = 0.8;
