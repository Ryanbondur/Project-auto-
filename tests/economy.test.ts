import { describe, expect, it } from "vitest";
import {
  applyWavePayout,
  calcInterest,
  waveIncome,
} from "../src/core/economy";
import { INTEREST_CAP_DEFAULT, INTEREST_CAP_SKILL, WAVE_INCOME } from "../src/core/constants";
import { createInitialRunState, createStore } from "../src/core/store";

describe("interest defaults", () => {
  it("gives +1 per 10 gold, floored, capped at 5", () => {
    expect(calcInterest(0, INTEREST_CAP_DEFAULT)).toBe(0);
    expect(calcInterest(9, INTEREST_CAP_DEFAULT)).toBe(0);
    expect(calcInterest(10, INTEREST_CAP_DEFAULT)).toBe(1);
    expect(calcInterest(49, INTEREST_CAP_DEFAULT)).toBe(4);
    expect(calcInterest(50, INTEREST_CAP_DEFAULT)).toBe(5);
    expect(calcInterest(99, INTEREST_CAP_DEFAULT)).toBe(5);
    expect(calcInterest(100, INTEREST_CAP_DEFAULT)).toBe(5);
  });

  it("raises cap to 8 with Interest Rate Cap skill constant", () => {
    expect(calcInterest(80, INTEREST_CAP_SKILL)).toBe(8);
    expect(calcInterest(70, INTEREST_CAP_SKILL)).toBe(7);
  });

  it("applies interest before +5 income", () => {
    const payout = applyWavePayout(25, INTEREST_CAP_DEFAULT);
    expect(payout.interest).toBe(2);
    expect(payout.income).toBe(WAVE_INCOME);
    expect(payout.goldAfter).toBe(25 + 2 + 5);
    expect(waveIncome()).toBe(5);
  });
});

describe("prep Ready stub payout + shop refresh", () => {
  it("adds interest+income, increments wave, refreshes 3 offers", () => {
    const store = createStore(createInitialRunState(99));
    store.debugSetGold(30);
    const before = store.getState();
    expect(before.shop.offers).toHaveLength(3);
    const offersBefore = before.shop.offers.map((o) => o.defId).join(",");

    const result = store.readyStub();
    expect(result.ok).toBe(true);
    const after = store.getState();
    expect(after.waveNumber).toBe(before.waveNumber + 1);
    expect(after.wavesCleared).toBe(before.wavesCleared + 1);
    expect(after.lastPayout).toEqual({ interest: 3, income: 5 });
    expect(after.gold).toBe(30 + 3 + 5);
    expect(after.shop.offers).toHaveLength(3);
    expect(after.shop.offers.every((o) => !o.purchased)).toBe(true);
    // Seed advanced — offers may or may not differ; at least shop object replaced
    void offersBefore;
  });

  it("reroll costs 1g and refuses when broke", () => {
    const store = createStore(createInitialRunState(2));
    store.debugSetGold(0);
    expect(store.rerollShop()).toEqual({ ok: false, reason: "insufficient_gold" });
    store.debugSetGold(2);
    expect(store.rerollShop().ok).toBe(true);
    expect(store.getState().gold).toBe(1);
  });
});
