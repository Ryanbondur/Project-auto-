import { describe, expect, it } from "vitest";
import { sellValue, sellChipValue } from "../src/core/economy";
import { createInitialRunState, createStore } from "../src/core/store";
import { getUnitDef } from "../src/content/units";

describe("sell valuation (pairwise composition)", () => {
  it("refunds 100% for 1★", () => {
    expect(sellValue(3, 1)).toBe(3);
    expect(sellValue(1, 1)).toBe(1);
  });

  it("refunds 80% of 2^(star-1) * cost for merged stars", () => {
    // 2★ = 2 base copies → floor(0.8 * 2 * cost)
    expect(sellValue(3, 2)).toBe(Math.floor(0.8 * 2 * 3)); // 4
    // 3★ = 4 base copies
    expect(sellValue(3, 3)).toBe(Math.floor(0.8 * 4 * 3)); // 9
    // 4★ = 8 base copies
    expect(sellValue(3, 4)).toBe(Math.floor(0.8 * 8 * 3)); // 19
  });

  it("uses the same formula for chips", () => {
    expect(sellChipValue(2, 2)).toBe(sellValue(2, 2));
  });

  it("store sellUnit credits gold and removes unit", () => {
    const store = createStore(createInitialRunState(1));
    store.debugSetGold(20);
    const buy = store.buyOffer(0);
    expect(buy.ok).toBe(true);
    const afterBuy = store.getState();
    const unit = afterBuy.bench[0]!;
    const def = getUnitDef(unit.defId)!;
    const goldBeforeSell = afterBuy.gold;
    const sold = store.sellUnit(unit.instanceId);
    expect(sold.ok).toBe(true);
    expect(store.getState().gold).toBe(goldBeforeSell + sellValue(def.cost, 1));
    expect(store.getState().bench.find((u) => u.instanceId === unit.instanceId)).toBeUndefined();
  });
});
