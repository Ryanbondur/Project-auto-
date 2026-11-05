import { describe, expect, it } from "vitest";
import { autoMergePairwise, autoMergeChipsPairwise } from "../src/core/merge";
import { starStatMultiplier } from "../src/core/constants";
import { effectiveStats } from "../src/core/stats";
import type { BuffChipInstance, UnitInstance } from "../src/core/types";

let seq = 0;
function id() {
  seq += 1;
  return `t_${seq}`;
}

function unit(
  defId: string,
  starLevel: number,
  tile: { x: number; y: number } | null = null,
): UnitInstance {
  return {
    instanceId: id(),
    defId,
    starLevel,
    targeting: "First",
    tile,
    cooldownMs: 0,
    currentTargetId: null,
    chipInstanceIds: [],
    fromMerge: false,
  };
}

describe("pairwise auto-merge", () => {
  it("merges two 1★ of same id into one 2★", () => {
    const bench = [unit("unit_slinger", 1), unit("unit_slinger", 1)];
    const result = autoMergePairwise([], bench, id);
    expect(result.mergeCount).toBe(1);
    expect(result.bench).toHaveLength(1);
    expect(result.bench[0]!.starLevel).toBe(2);
    expect(result.bench[0]!.defId).toBe("unit_slinger");
    expect(result.bench[0]!.fromMerge).toBe(true);
  });

  it("merges 2★+2★ → 3★ and does not hard-cap (3★+3★ → 4★)", () => {
    const bench = [unit("unit_spearman", 2), unit("unit_spearman", 2)];
    const mid = autoMergePairwise([], bench, id);
    expect(mid.bench[0]!.starLevel).toBe(3);

    const next = autoMergePairwise(
      [],
      [mid.bench[0]!, unit("unit_spearman", 3)],
      id,
    );
    expect(next.bench[0]!.starLevel).toBe(4);
  });

  it("chains four 1★ into two 2★ then one 3★", () => {
    const bench = [
      unit("unit_slinger", 1),
      unit("unit_slinger", 1),
      unit("unit_slinger", 1),
      unit("unit_slinger", 1),
    ];
    const result = autoMergePairwise([], bench, id);
    // 4×1★ → 2×2★ → 1×3★
    expect(result.bench).toHaveLength(1);
    expect(result.bench[0]!.starLevel).toBe(3);
    expect(result.mergeCount).toBe(3);
  });

  it("pools bench+board and prefers bench-first consume; result stays on board tile", () => {
    const board = [unit("unit_slinger", 1, { x: 1, y: 1 })];
    const bench = [unit("unit_slinger", 1)];
    const result = autoMergePairwise(board, bench, id);
    expect(result.mergeCount).toBe(1);
    expect(result.bench).toHaveLength(0);
    expect(result.board).toHaveLength(1);
    expect(result.board[0]!.tile).toEqual({ x: 1, y: 1 });
    expect(result.board[0]!.starLevel).toBe(2);
  });

  it("does not merge different ids or different star levels", () => {
    const bench = [
      unit("unit_slinger", 1),
      unit("unit_spearman", 1),
      unit("unit_slinger", 2),
    ];
    const result = autoMergePairwise([], bench, id);
    expect(result.mergeCount).toBe(0);
    expect(result.bench).toHaveLength(3);
  });
});

describe("chip pairwise merge", () => {
  it("merges two unsocketed pierce chips", () => {
    const chips: BuffChipInstance[] = [
      { instanceId: id(), defId: "chip_pierce", starLevel: 1, socketedOnInstanceId: null },
      { instanceId: id(), defId: "chip_pierce", starLevel: 1, socketedOnInstanceId: null },
    ];
    const result = autoMergeChipsPairwise(chips, id);
    expect(result.mergeCount).toBe(1);
    expect(result.chips).toHaveLength(1);
    expect(result.chips[0]!.starLevel).toBe(2);
  });

  it("ignores socketed chips when pairing", () => {
    const chips: BuffChipInstance[] = [
      { instanceId: id(), defId: "chip_pierce", starLevel: 1, socketedOnInstanceId: "u1" },
      { instanceId: id(), defId: "chip_pierce", starLevel: 1, socketedOnInstanceId: null },
    ];
    const result = autoMergeChipsPairwise(chips, id);
    expect(result.mergeCount).toBe(0);
  });
});

describe("star stat scaling", () => {
  it("matches canon 1/2/3.5 and provisional 4+", () => {
    expect(starStatMultiplier(1)).toBe(1);
    expect(starStatMultiplier(2)).toBe(2);
    expect(starStatMultiplier(3)).toBe(3.5);
    expect(starStatMultiplier(4)).toBeCloseTo(3.5 * 1.55, 8);
    expect(starStatMultiplier(5)).toBeCloseTo(3.5 * 1.55 * 1.55, 8);
  });

  it("effectiveStats scales damage by star mult", () => {
    const u = unit("unit_slinger", 2);
    const stats = effectiveStats(u);
    expect(stats?.damage).toBe(8 * 2);
  });
});
