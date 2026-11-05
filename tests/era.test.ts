import { describe, expect, it } from "vitest";
import { ERA_CONFIGS } from "../src/content/eras";
import { UNIT_DEFS } from "../src/content/units";
import {
  eraForWave,
  rollDiscoveryChoices,
  shouldAdvanceEra,
  unitsInEra,
  withVeterancy,
} from "../src/core/era";
import { createInitialRunState, createStore } from "../src/core/store";

describe("era thresholds", () => {
  it("maps wave bands to eras 1–5", () => {
    expect(eraForWave(1, ERA_CONFIGS)).toBe(1);
    expect(eraForWave(10, ERA_CONFIGS)).toBe(1);
    expect(eraForWave(11, ERA_CONFIGS)).toBe(2);
    expect(eraForWave(20, ERA_CONFIGS)).toBe(2);
    expect(eraForWave(21, ERA_CONFIGS)).toBe(3);
    expect(eraForWave(31, ERA_CONFIGS)).toBe(4);
    expect(eraForWave(41, ERA_CONFIGS)).toBe(5);
    expect(eraForWave(100, ERA_CONFIGS)).toBe(5);
  });

  it("detects advance when next wave crosses a band", () => {
    expect(shouldAdvanceEra(1, 10, ERA_CONFIGS)).toBe(false);
    expect(shouldAdvanceEra(1, 11, ERA_CONFIGS)).toBe(true);
    expect(shouldAdvanceEra(2, 21, ERA_CONFIGS)).toBe(true);
    expect(shouldAdvanceEra(5, 99, ERA_CONFIGS)).toBe(false);
  });

  it("shifts boundaries earlier with Veterancy", () => {
    const v = withVeterancy(ERA_CONFIGS);
    expect(v.map((e) => e.waveRange)).toEqual([
      [1, 9],
      [10, 18],
      [19, 27],
      [28, 36],
      [37, 100],
    ]);
    expect(eraForWave(10, v)).toBe(2);
    expect(shouldAdvanceEra(1, 10, v)).toBe(true);
    expect(shouldAdvanceEra(1, 9, v)).toBe(false);
  });
});

describe("era discovery pool", () => {
  it("has 4 units per era for discovery variety", () => {
    for (const era of [1, 2, 3, 4, 5] as const) {
      expect(unitsInEra(era).length).toBe(4);
    }
    expect(UNIT_DEFS).toHaveLength(20);
  });

  it("rolls 3 distinct 2★ choices from the newly unlocked era", () => {
    const { choices } = rollDiscoveryChoices(2, 123);
    expect(choices).toHaveLength(3);
    expect(choices.every((c) => c.starLevel === 2)).toBe(true);
    const ids = choices.map((c) => c.defId);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) {
      expect(UNIT_DEFS.find((u) => u.id === id)?.era).toBe(2);
    }
  });

  it("samples with replacement only when pool is smaller than count", () => {
    // Force tiny pool by requesting era with full roster but count > pool via
    // rollDiscoveryChoices count override — use count 5 with pool 4.
    const { choices } = rollDiscoveryChoices(3, 7, 5);
    expect(choices).toHaveLength(5);
    expect(choices.every((c) => UNIT_DEFS.find((u) => u.id === c.defId)?.era === 3)).toBe(
      true,
    );
  });
});

describe("era freeze store flow", () => {
  it("freezes on clearing wave 10 and grants free 2★ on pick", () => {
    const store = createStore(createInitialRunState(50));
    store.debugSetWave(10);
    expect(store.getState().currentEra).toBe(1);

    expect(store.ready().ok).toBe(true);
    expect(store.debugCompleteWave().ok).toBe(true);

    const frozen = store.getState();
    expect(frozen.phase).toBe("ERA_FREEZE");
    expect(frozen.waveNumber).toBe(11);
    expect(frozen.currentEra).toBe(1); // unlock deferred until pick
    expect(frozen.discovery?.newEra).toBe(2);
    expect(frozen.discovery?.choices).toHaveLength(3);

    // Shop / ready blocked while frozen
    expect(store.rerollShop()).toEqual({ ok: false, reason: "wrong_phase" });
    expect(store.ready()).toEqual({ ok: false, reason: "wrong_phase" });
    expect(store.buyOffer(0)).toEqual({ ok: false, reason: "wrong_phase" });

    const pick = frozen.discovery!.choices[0]!;
    const benchBefore = frozen.bench.length;
    expect(store.pickDiscovery(0).ok).toBe(true);

    const after = store.getState();
    expect(after.phase).toBe("SHOP_PREP");
    expect(after.currentEra).toBe(2);
    expect(after.discovery).toBeNull();
    expect(after.bench.length).toBeGreaterThanOrEqual(benchBefore + 1);
    const granted = after.bench.find((u) => u.defId === pick.defId && u.starLevel === 2);
    expect(granted).toBeTruthy();

    const slots =
      after.metaApplied.eraThresholds.find((e) => e.era === 2)?.maxBoardSlots ?? 0;
    expect(slots).toBe(6);
    expect(after.shop.offers).toHaveLength(3);
  });

  it("does not freeze mid-era (wave 5 → 6)", () => {
    const store = createStore(createInitialRunState(3));
    store.debugSetWave(5);
    store.ready();
    store.debugCompleteWave();
    const s = store.getState();
    expect(s.phase).toBe("SHOP_PREP");
    expect(s.currentEra).toBe(1);
    expect(s.discovery).toBeNull();
    expect(s.waveNumber).toBe(6);
  });
});
