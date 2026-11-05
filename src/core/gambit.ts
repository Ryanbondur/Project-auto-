import {
  GAMBIT_DOUBLE_INTEREST_HP_COST,
  GAMBIT_FREE_REROLL_COUNT,
  GAMBIT_FREE_REROLLS_GOLD_COST,
  GAMBIT_RANDOM_2STAR_GOLD_COST,
  GAMBIT_USES_PER_RUN,
} from "./constants";
import type { CommanderGambitState, GambitId, RunState } from "./types";

export function createGambitState(): CommanderGambitState {
  return {
    usesSpent: 0,
    usedThisRun: false,
    activeGambit: null,
    freeRerollsRemaining: 0,
  };
}

export function gambitsRemaining(gambit: CommanderGambitState): number {
  return Math.max(0, GAMBIT_USES_PER_RUN - gambit.usesSpent);
}

export type GambitResult =
  | {
      ok: true;
      state: Partial<RunState> & {
        gambit: CommanderGambitState;
        gold?: number;
        baseHp?: number;
      };
    }
  | { ok: false; reason: string };

/**
 * Commander gambit — once per run (tunable via GAMBIT_USES_PER_RUN).
 * Spend HP or gold for a one-wave / this-prep rule bend.
 */
export function tryActivateGambit(
  state: RunState,
  gambitId: GambitId,
): GambitResult {
  if (gambitsRemaining(state.gambit) <= 0) {
    return { ok: false, reason: "gambit_already_used" };
  }
  if (state.phase !== "SHOP_PREP" && state.phase !== "MERGE_SETUP") {
    return { ok: false, reason: "wrong_phase" };
  }

  const usesSpent = state.gambit.usesSpent + 1;
  const gambit: CommanderGambitState = {
    usesSpent,
    usedThisRun: usesSpent >= GAMBIT_USES_PER_RUN,
    activeGambit: gambitId,
    freeRerollsRemaining: 0,
  };

  switch (gambitId) {
    case "double_interest": {
      if (state.baseHp <= GAMBIT_DOUBLE_INTEREST_HP_COST) {
        return { ok: false, reason: "insufficient_hp" };
      }
      return {
        ok: true,
        state: {
          gambit,
          baseHp: state.baseHp - GAMBIT_DOUBLE_INTEREST_HP_COST,
        },
      };
    }
    case "free_rerolls": {
      if (state.gold < GAMBIT_FREE_REROLLS_GOLD_COST) {
        return { ok: false, reason: "insufficient_gold" };
      }
      gambit.freeRerollsRemaining = GAMBIT_FREE_REROLL_COUNT;
      return {
        ok: true,
        state: { gambit, gold: state.gold - GAMBIT_FREE_REROLLS_GOLD_COST },
      };
    }
    case "random_higher_unit": {
      if (state.gold < GAMBIT_RANDOM_2STAR_GOLD_COST) {
        return { ok: false, reason: "insufficient_gold" };
      }
      return {
        ok: true,
        state: { gambit, gold: state.gold - GAMBIT_RANDOM_2STAR_GOLD_COST },
      };
    }
    default:
      return { ok: false, reason: "unknown_gambit" };
  }
}

/** Interest multiplier when double_interest gambit is active for the next payout. */
export function interestMultiplier(gambit: CommanderGambitState): number {
  return gambit.activeGambit === "double_interest" ? 2 : 1;
}

/**
 * Clear this-prep gambit effects when the wave starts
 * (free rerolls expire; double_interest stays until payout).
 */
export function clearPrepGambitOnReady(gambit: CommanderGambitState): CommanderGambitState {
  if (gambit.activeGambit !== "free_rerolls") return gambit;
  return {
    ...gambit,
    activeGambit: null,
    freeRerollsRemaining: 0,
  };
}
