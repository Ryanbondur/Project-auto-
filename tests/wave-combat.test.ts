import { describe, expect, it } from "vitest";
import { createInitialRunState, createStore } from "../src/core/store";
import { STARTING_BASE_HP, WAVE_INCOME } from "../src/core/constants";

describe("wave Ready → combat → income", () => {
  it("ready enters AUTOBATTLE with a spawn plan", () => {
    const store = createStore(createInitialRunState(5));
    expect(store.ready().ok).toBe(true);
    const s = store.getState();
    expect(s.phase).toBe("AUTOBATTLE");
    expect(s.waveRuntime).not.toBeNull();
    expect(s.waveRuntime!.spawnQueue.length).toBeGreaterThan(0);
  });

  it("debugCompleteWave applies interest + income and returns to prep", () => {
    const store = createStore(createInitialRunState(9));
    store.debugSetGold(30);
    store.ready();
    expect(store.debugCompleteWave().ok).toBe(true);
    const after = store.getState();
    expect(after.phase).toBe("SHOP_PREP");
    expect(after.waveNumber).toBe(2);
    expect(after.wavesCleared).toBe(1);
    expect(after.lastPayout).toEqual({ interest: 3, income: WAVE_INCOME });
    expect(after.gold).toBe(30 + 3 + WAVE_INCOME);
    expect(after.shop.offers).toHaveLength(3);
    expect(after.creeps).toHaveLength(0);
  });

  it("leaking enough creeps can defeat the run", () => {
    const store = createStore(createInitialRunState(3));
    store.ready();
    // Simulate many ticks with empty board — creeps march and leak
    for (let i = 0; i < 20000; i++) {
      store.tick(50);
      const s = store.getState();
      if (s.phase === "RUN_DEFEAT" || s.phase === "SHOP_PREP") break;
    }
    const end = store.getState();
    // Either wave cleared (units none but creeps all leaked with HP left) or defeat
    expect(["RUN_DEFEAT", "SHOP_PREP"]).toContain(end.phase);
    if (end.phase === "RUN_DEFEAT") {
      expect(end.baseHp).toBe(0);
    } else {
      expect(end.baseHp).toBeLessThan(STARTING_BASE_HP);
      expect(end.wavesCleared).toBe(1);
    }
  });

  it("cycleTargeting updates boarded unit mode", () => {
    const store = createStore(createInitialRunState(4));
    store.debugSetGold(20);
    const offer = store.getState().shop.offers.find((o) => o.kind === "unit");
    expect(offer).toBeTruthy();
    store.buyOffer(offer!.slotIndex);
    const unit = store.getState().bench[0]!;
    store.selectUnit(unit.instanceId);
    store.clickTile(1, 1);
    const boarded = store.getState().board[0]!;
    expect(boarded.targeting).toBe("First");
    store.cycleTargeting(boarded.instanceId);
    expect(store.getState().board[0]!.targeting).toBe("Last");
  });
});
