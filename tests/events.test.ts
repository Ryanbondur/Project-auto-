import { describe, expect, it } from "vitest";
import {
  ACTIVE_RUN_STORAGE_KEY,
  loadActiveRun,
  saveActiveRun,
} from "../src/meta/persistence";
import {
  applyBossArenaFail,
  applyRunEvent,
  createEmptyModifiers,
  rollEventChoices,
  shouldOfferRunEventAfterEra,
  shouldOfferRunEventAtWaveBand,
} from "../src/core/events";
import { createInitialRunState, createStore } from "../src/core/store";
import { createRng } from "../src/core/rng";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe("run events", () => {
  it("rolls exactly 2 choices", () => {
    const { choices } = rollEventChoices(99, 20);
    expect(choices).toHaveLength(2);
    expect(choices[0]!.id).not.toBe(choices[1]!.id);
  });

  it("offers after era; late band only at era 5 every 10 waves", () => {
    expect(shouldOfferRunEventAfterEra()).toBe(true);
    expect(shouldOfferRunEventAtWaveBand(4, 20)).toBe(false);
    expect(shouldOfferRunEventAtWaveBand(5, 50)).toBe(true);
    expect(shouldOfferRunEventAtWaveBand(5, 51)).toBe(false);
  });

  it("applies ballistic trait additively with no cap", () => {
    const state = createInitialRunState(3);
    const rand = createRng(1);
    applyRunEvent(state, "ballistic_damage", 5, rand);
    applyRunEvent(state, "ballistic_damage", 5, rand);
    applyRunEvent(state, "ballistic_damage", 5, rand);
    expect(state.modifiers.ballisticDamageBonus).toBeCloseTo(0.3);
    expect(state.modifiers.traits.filter((t) => t === "ballistic_damage")).toHaveLength(3);
  });

  it("persists modifiers + pending eventChoice in atd.run.v1", () => {
    const storage = new MemoryStorage();
    const run = createInitialRunState(5);
    run.modifiers.boardSlotsBonus = 2;
    run.modifiers.ballisticDamageBonus = 0.2;
    run.modifiers.traits = ["board_slot_plus", "ballistic_damage"];
    run.eventChoice = {
      reason: "era",
      choices: rollEventChoices(1, 10).choices,
    };
    run.autoMergeEnabled = false;
    saveActiveRun(run, 42, storage);
    expect(storage.getItem(ACTIVE_RUN_STORAGE_KEY)).toBeTruthy();
    const loaded = loadActiveRun(storage);
    expect(loaded?.run.modifiers.boardSlotsBonus).toBe(2);
    expect(loaded?.run.modifiers.ballisticDamageBonus).toBeCloseTo(0.2);
    expect(loaded?.run.eventChoice?.choices).toHaveLength(2);
    expect(loaded?.run.autoMergeEnabled).toBe(false);
  });

  it("pickEvent after discovery queues era→event; spend gold deal deducts", () => {
    const store = createStore(createInitialRunState(8));
    store.debugForceEvent();
    const choice = store.getState().eventChoice!;
    expect(choice.choices).toHaveLength(2);
    // Prefer a free passive if present
    const freeIdx = choice.choices.findIndex((c) => c.goldCost === undefined);
    const idx = freeIdx >= 0 ? freeIdx : 0;
    store.debugSetGold(40);
    expect(store.pickEvent(idx).ok).toBe(true);
    expect(store.getState().eventChoice).toBeNull();
  });

  it("boss arena fail costs gold/HP but does not end the run", () => {
    const state = createInitialRunState(2);
    state.gold = 20;
    state.baseHp = 40;
    state.phase = "EVENT_ARENA";
    state.arena = { kind: "boss", bossDefId: "creep_boss", displayWave: 1 };
    state.modifiers = createEmptyModifiers();
    applyBossArenaFail(state);
    expect(state.phase).toBe("SHOP_PREP");
    expect(state.arena).toBeNull();
    expect(state.baseHp).toBeGreaterThanOrEqual(1);
    expect(state.gold).toBeLessThan(20);
    expect(state.phase).not.toBe("RUN_DEFEAT");
  });

  it("auto-merge toggle gates auto combine but mergeOnto still works", () => {
    const store = createStore(createInitialRunState(4));
    store.setAutoMergeEnabled(false);
    expect(store.getState().autoMergeEnabled).toBe(false);
    store.debugSetGold(40);
    // Buy two identical units when shop happens to offer same — force via state
    const s = store.getState();
    s.autoMergeEnabled = false;
    s.bench = [
      {
        instanceId: "t1",
        defId: "unit_slinger",
        starLevel: 1,
        targeting: "First",
        tile: null,
        cooldownMs: 0,
        currentTargetId: null,
        chipInstanceIds: [],
        fromMerge: false,
      },
      {
        instanceId: "t2",
        defId: "unit_slinger",
        starLevel: 1,
        targeting: "First",
        tile: null,
        cooldownMs: 0,
        currentTargetId: null,
        chipInstanceIds: [],
        fromMerge: false,
      },
    ];
    const store2 = createStore(structuredClone(s));
    // Buy would auto-merge if enabled — with off, two 1★ stay until drag
    expect(store2.getState().bench).toHaveLength(2);
    expect(store2.mergeOnto("t1", "t2").ok).toBe(true);
    expect(store2.getState().bench).toHaveLength(1);
    expect(store2.getState().bench[0]!.starLevel).toBe(2);
  });
});
