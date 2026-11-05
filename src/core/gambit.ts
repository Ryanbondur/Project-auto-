import type { CommanderGambitState, GambitId, RunState } from "./types";

export function createGambitState(): CommanderGambitState {
  return {
    usedThisRun: false,
    activeGambit: null,
    freeRerollsRemaining: 0,
  };
}

export type GambitResult =
  | { ok: true; state: Partial<RunState> & { gambit: CommanderGambitState; gold?: number; baseHp?: number } }
  | { ok: false; reason: string };

/**
 * Commander gambit — once per run.
 * Spend HP or gold for a one-wave (or run) rule bend.
 * TODO: wire UI picker; combat-phase expiry for double_interest / free_rerolls.
 */
export function tryActivateGambit(
  state: RunState,
  gambitId: GambitId,
): GambitResult {
  if (state.gambit.usedThisRun) {
    return { ok: false, reason: "gambit_already_used" };
  }
  if (state.phase !== "SHOP_PREP" && state.phase !== "MERGE_SETUP") {
    return { ok: false, reason: "wrong_phase" };
  }

  const gambit: CommanderGambitState = {
    usedThisRun: true,
    activeGambit: gambitId,
    freeRerollsRemaining: 0,
  };

  switch (gambitId) {
    case "double_interest": {
      // Costs 5 HP — interest doubled on next payout (flag via activeGambit).
      if (state.baseHp <= 5) return { ok: false, reason: "insufficient_hp" };
      return {
        ok: true,
        state: { gambit, baseHp: state.baseHp - 5 },
      };
    }
    case "free_rerolls": {
      // Costs 3 gold — next 3 rerolls free.
      if (state.gold < 3) return { ok: false, reason: "insufficient_gold" };
      gambit.freeRerollsRemaining = 3;
      return {
        ok: true,
        state: { gambit, gold: state.gold - 3 },
      };
    }
    case "random_higher_unit": {
      // Costs 8 gold — grant handled by store (needs RNG + unit spawn).
      if (state.gold < 8) return { ok: false, reason: "insufficient_gold" };
      return {
        ok: true,
        state: { gambit, gold: state.gold - 8 },
      };
    }
    default:
      return { ok: false, reason: "unknown_gambit" };
  }
}

/** Interest multiplier when double_interest gambit is active. */
export function interestMultiplier(gambit: CommanderGambitState): number {
  return gambit.activeGambit === "double_interest" && gambit.usedThisRun ? 2 : 1;
}
