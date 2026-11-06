import { describe, expect, it } from "vitest";
import {
  attributeDamage,
  formatDamageShort,
  rankDamageDealt,
  resetWaveDamage,
} from "../src/core/damageStats";
import { autoMergePairwise } from "../src/core/merge";
import {
  createInitialRunState,
  createStore,
} from "../src/core/store";
import type { UnitInstance } from "../src/core/types";

function unit(
  partial: Partial<UnitInstance> & Pick<UnitInstance, "instanceId" | "defId">,
): UnitInstance {
  return {
    starLevel: 1,
    targeting: "First",
    tile: { x: 1, y: 1 },
    cooldownMs: 0,
    currentTargetId: null,
    chipInstanceIds: [],
    fromMerge: false,
    damageDealtWave: 0,
    damageDealtRun: 0,
    ...partial,
  };
}

describe("damage tracking aggregation", () => {
  it("formats short damage numbers", () => {
    expect(formatDamageShort(42)).toBe("42");
    expect(formatDamageShort(1250)).toBe("1.3k");
    expect(formatDamageShort(12_000)).toBe("12k");
  });

  it("ranks boarded units by wave damage descending", () => {
    const board = [
      unit({
        instanceId: "a",
        defId: "unit_slinger",
        damageDealtWave: 40,
        damageDealtRun: 100,
      }),
      unit({
        instanceId: "b",
        defId: "unit_spearman",
        tile: { x: 2, y: 1 },
        damageDealtWave: 90,
        damageDealtRun: 90,
      }),
      unit({
        instanceId: "c",
        defId: "unit_tribe_drummer",
        tile: null,
        damageDealtWave: 999,
      }),
    ];
    const ranked = rankDamageDealt(board, "wave");
    expect(ranked.map((r) => r.instanceId)).toEqual(["b", "a"]);
    expect(ranked[0]!.damage).toBe(90);
    expect(ranked[0]!.name).toBe("Spearman");
  });

  it("attributes damage onto wave and run totals", () => {
    const board = [
      unit({ instanceId: "u1", defId: "unit_slinger" }),
      unit({
        instanceId: "u2",
        defId: "unit_spearman",
        tile: { x: 2, y: 1 },
      }),
    ];
    attributeDamage(board, "u1", 25);
    attributeDamage(board, "u1", 10);
    attributeDamage(board, "missing", 50);
    expect(board[0]!.damageDealtWave).toBe(35);
    expect(board[0]!.damageDealtRun).toBe(35);
    expect(board[1]!.damageDealtWave).toBe(0);
  });

  it("resets wave damage on Ready while keeping run totals", () => {
    const store = createStore(createInitialRunState(11));
    store.debugSetGold(30);
    const offer = store.getState().shop.offers.find((o) => o.kind === "unit");
    expect(offer).toBeTruthy();
    store.buyOffer(offer!.slotIndex);
    const benchUnit = store.getState().bench[0]!;
    store.selectUnit(benchUnit.instanceId);
    store.clickTile(1, 1);
    const boarded = store.getState().board[0]!;
    boarded.damageDealtWave = 50;
    boarded.damageDealtRun = 120;
    // Force HUD snapshot so store keeps mutated unit fields via clone path next.
    store.debugSetGold(store.getState().gold);
    // Mutate live state after clone-based debugSetGold:
    store.getState().board[0]!.damageDealtWave = 50;
    store.getState().board[0]!.damageDealtRun = 120;

    expect(store.ready().ok).toBe(true);
    const after = store.getState().board[0]!;
    expect(after.damageDealtWave).toBe(0);
    expect(after.damageDealtRun).toBe(120);
  });

  it("transfers run damage across pairwise merge", () => {
    let seq = 0;
    const id = () => {
      seq += 1;
      return `m${seq}`;
    };
    const a = unit({
      instanceId: "a",
      defId: "unit_slinger",
      tile: null,
      damageDealtRun: 30,
      damageDealtWave: 5,
    });
    const b = unit({
      instanceId: "b",
      defId: "unit_slinger",
      tile: null,
      damageDealtRun: 70,
      damageDealtWave: 8,
    });
    const result = autoMergePairwise([], [a, b], id);
    expect(result.bench).toHaveLength(1);
    expect(result.bench[0]!.damageDealtRun).toBe(100);
    expect(result.bench[0]!.damageDealtWave).toBe(0);
  });

  it("resetWaveDamage clears only wave counters", () => {
    const units = [
      unit({
        instanceId: "u",
        defId: "unit_slinger",
        damageDealtWave: 12,
        damageDealtRun: 44,
      }),
    ];
    resetWaveDamage(units);
    expect(units[0]!.damageDealtWave).toBe(0);
    expect(units[0]!.damageDealtRun).toBe(44);
  });
});
