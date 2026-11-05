/** Locked design defaults — see docs/design-decisions.md (overrides architecture §9). */

export const STARTING_GOLD = 10;
export const STARTING_BASE_HP = 100;
export const DEFAULT_BENCH_CAPACITY = 5;
/** Design-decisions: 3 offers (architecture default of 5 is overridden). */
export const SHOP_SIZE = 3;
export const REROLL_COST = 1 as const;
/**
 * Balance pass (mechanics finish): wave income 5 → 6 so early phone runs can
 * afford a second unit / chip without starving rerolls.
 */
export const WAVE_INCOME = 6;
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
 * Balance pass: growth after 3★ softened 1.75 → 1.55 so uncapped pairwise
 * stars do not explode mid-run while still rewarding high merges.
 *   mult(n) = 3.5 * STAR_GROWTH_AFTER_3^(n-3) for n >= 3.
 */
export const STAR_GROWTH_AFTER_3 = 1.55;

export function starStatMultiplier(starLevel: number): number {
  const n = Math.max(1, Math.floor(starLevel));
  if (n === 1) return 1;
  if (n === 2) return 2;
  // n >= 3: 3.5 * growth^(n-3)
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

/** Tunable: how many commander gambits per run (design: once-per-run default). */
export const GAMBIT_USES_PER_RUN = 1;

/** Gambit costs */
export const GAMBIT_DOUBLE_INTEREST_HP_COST = 5;
export const GAMBIT_FREE_REROLLS_GOLD_COST = 3;
export const GAMBIT_FREE_REROLL_COUNT = 3;
export const GAMBIT_RANDOM_2STAR_GOLD_COST = 8;

/**
 * Shop offer kind weights (balance pass).
 * Order of rolls: sabotage first (rare), then chip, else unit.
 */
export const SHOP_SABOTAGE_CHANCE = 0.04;
export const SHOP_CHIP_CHANCE = 0.2;

/**
 * Endless / late-wave HP scale. Applied on spawn.
 * Mild through mid game; accelerates after era 5 band (wave 41+).
 * hp *= 1 + (wave-1) * EARLY + max(0, wave-40) * LATE
 */
export const WAVE_HP_SCALE_PER_WAVE = 0.035;
export const WAVE_HP_SCALE_ENDLESS_EXTRA = 0.025;
export const WAVE_HP_ENDLESS_START = 40;

/** Cap base HP heal from lifesteal / heal-pulse so chips cannot trivialize leaks. */
export const BASE_HP_HEAL_CAP = STARTING_BASE_HP;
