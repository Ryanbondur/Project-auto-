import { describe, expect, it } from "vitest";
import { getUnitDef } from "../src/content/units";
import { sellValue } from "../src/core/economy";
import { createInitialRunState, createStore } from "../src/core/store";
import type { UnitInstance } from "../src/core/types";

describe("sell from board", () => {
  it("sells a placed board unit and refunds sellValue", () => {
    const base = createInitialRunState(7);
    const unit: UnitInstance = {
      instanceId: "board_sell_1",
      defId: "unit_slinger",
      starLevel: 1,
      targeting: "First",
      tile: { x: 1, y: 1 },
      cooldownMs: 0,
      currentTargetId: null,
      chipInstanceIds: [],
      fromMerge: false,
    };
    base.board = [unit];
    base.bench = [];
    const store = createStore(base);
    const def = getUnitDef(unit.defId)!;
    const goldBefore = store.getState().gold;
    const refund = sellValue(def.cost, unit.starLevel);
    expect(store.sellUnit(unit.instanceId).ok).toBe(true);
    expect(
      store.getState().board.find((u) => u.instanceId === unit.instanceId),
    ).toBeUndefined();
    expect(store.getState().gold).toBe(goldBefore + refund);
  });
});
