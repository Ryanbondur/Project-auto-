import { describe, expect, it } from "vitest";
import {
  GAMBIT_DOUBLE_INTEREST_HP_COST,
  GAMBIT_FREE_REROLL_COUNT,
  GAMBIT_FREE_REROLLS_GOLD_COST,
  GAMBIT_RANDOM_2STAR_GOLD_COST,
  GAMBIT_USES_PER_RUN,
} from "../src/core/constants";
import {
  clearPrepGambitOnReady,
  createGambitState,
  gambitsRemaining,
  interestMultiplier,
  tryActivateGambit,
} from "../src/core/gambit";
import { createInitialRunState, createStore } from "../src/core/store";

describe("commander gambits", () => {
  it("starts with tunable uses remaining", () => {
    const g = createGambitState();
    expect(gambitsRemaining(g)).toBe(GAMBIT_USES_PER_RUN);
    expect(g.usedThisRun).toBe(false);
  });

  it("double_interest spends HP and doubles next payout interest", () => {
    const store = createStore(createInitialRunState(21));
    store.debugSetGold(40);
    const hpBefore = store.getState().baseHp;
    expect(store.activateGambit("double_interest").ok).toBe(true);
    const mid = store.getState();
    expect(mid.baseHp).toBe(hpBefore - GAMBIT_DOUBLE_INTEREST_HP_COST);
    expect(mid.gambit.usedThisRun).toBe(true);
    expect(interestMultiplier(mid.gambit)).toBe(2);

    store.ready();
    expect(store.debugCompleteWave().ok).toBe(true);
    const after = store.getState();
    // Interest on 40 gold = 4, doubled → 8; income WAVE_INCOME
    expect(after.lastPayout!.interest).toBe(8);
    expect(after.gambit.activeGambit).toBeNull();
  });

  it("free_rerolls spend gold and grant free rerolls this prep only", () => {
    const store = createStore(createInitialRunState(22));
    store.debugSetGold(20);
    expect(store.activateGambit("free_rerolls").ok).toBe(true);
    expect(store.getState().gold).toBe(20 - GAMBIT_FREE_REROLLS_GOLD_COST);
    expect(store.getState().gambit.freeRerollsRemaining).toBe(
      GAMBIT_FREE_REROLL_COUNT,
    );
    const goldBefore = store.getState().gold;
    expect(store.rerollShop().ok).toBe(true);
    expect(store.getState().gold).toBe(goldBefore);
    expect(store.getState().gambit.freeRerollsRemaining).toBe(
      GAMBIT_FREE_REROLL_COUNT - 1,
    );

    store.ready();
    expect(store.getState().gambit.freeRerollsRemaining).toBe(0);
    expect(store.getState().gambit.activeGambit).toBeNull();
  });

  it("random_higher_unit grants a 2★ and marks gambit used", () => {
    const store = createStore(createInitialRunState(23));
    store.debugSetGold(30);
    const benchBefore = store.getState().bench.length;
    expect(store.activateGambit("random_higher_unit").ok).toBe(true);
    expect(store.getState().gold).toBe(30 - GAMBIT_RANDOM_2STAR_GOLD_COST);
    expect(store.getState().bench.length).toBeGreaterThan(benchBefore);
    const granted = store.getState().bench.find((u) => u.starLevel === 2);
    expect(granted).toBeTruthy();
    expect(store.getState().gambit.usedThisRun).toBe(true);
  });

  it("refuses a second gambit once-per-run", () => {
    const store = createStore(createInitialRunState(24));
    store.debugSetGold(50);
    expect(store.activateGambit("free_rerolls").ok).toBe(true);
    expect(store.activateGambit("double_interest")).toEqual({
      ok: false,
      reason: "gambit_already_used",
    });
  });

  it("tryActivateGambit refuses insufficient resources", () => {
    const state = createInitialRunState(25);
    state.gold = 0;
    state.baseHp = 3;
    expect(tryActivateGambit(state, "free_rerolls").ok).toBe(false);
    expect(tryActivateGambit(state, "double_interest").ok).toBe(false);
    expect(tryActivateGambit(state, "random_higher_unit").ok).toBe(false);
  });

  it("clearPrepGambitOnReady only clears free_rerolls", () => {
    const free = {
      ...createGambitState(),
      usesSpent: 1,
      usedThisRun: true,
      activeGambit: "free_rerolls" as const,
      freeRerollsRemaining: 2,
    };
    const cleared = clearPrepGambitOnReady(free);
    expect(cleared.activeGambit).toBeNull();
    expect(cleared.freeRerollsRemaining).toBe(0);

    const interest = {
      ...createGambitState(),
      usesSpent: 1,
      usedThisRun: true,
      activeGambit: "double_interest" as const,
    };
    expect(clearPrepGambitOnReady(interest).activeGambit).toBe("double_interest");
  });
});
