/** Defaults (not author canon) — see game-architecture.md §9 */

export const STARTING_GOLD = 10;
export const STARTING_BASE_HP = 100;
export const DEFAULT_BENCH_CAPACITY = 5;
export const SHOP_SIZE = 5;
export const REROLL_COST = 1 as const;
export const WAVE_INCOME = 5;
export const INTEREST_PER_10 = 1;
export const INTEREST_CAP_DEFAULT = 5;
export const INTEREST_CAP_SKILL = 8;
export const STANDARD_LEAK_DAMAGE = 1;
export const BOSS_LEAK_DAMAGE = 15;
export const XP_PER_WAVE_CLEARED = 15;
export const VICTORY_WAVE = 100;

export const GRID_WIDTH = 14;
export const GRID_HEIGHT = 10;
export const TILE_SIZE_PX = 48;

/** Star stat multipliers on base stats */
export const STAR_STAT_MULT: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 2,
  3: 3.5,
};
