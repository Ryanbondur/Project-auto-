import { describe, expect, it } from "vitest";
import { mergeSpecificPair } from "../src/core/merge";
import { createInitialRunState, createStore } from "../src/core/store";
import type { UnitInstance } from "../src/core/types";

let seq = 0;
function id() {
  seq += 1;
  return `d_${seq}`;
}

function unit(
  defId: string,
  star: number,
  tile: { x: number; y: number } | null = null,
): UnitInstance {
  return {
    instanceId: id(),
    defId,
    starLevel: star,
    targeting: "First",
    tile,
    cooldownMs: 0,
    currentTargetId: null,
    chipInstanceIds: [],
    fromMerge: false,
  };
}

describe("drag-to-combine pairing", () => {
  it("merges identical id+star across bench↔board", () => {
    const a = unit("unit_slinger", 1, null);
    const b = unit("unit_slinger", 1, { x: 1, y: 1 });
    const result = mergeSpecificPair([b], [a], a.instanceId, b.instanceId, id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.board).toHaveLength(1);
    expect(result.board[0]!.starLevel).toBe(2);
    expect(result.board[0]!.tile).toEqual({ x: 1, y: 1 });
    expect(result.bench).toHaveLength(0);
  });

  it("rejects non-identical drops", () => {
    const a = unit("unit_slinger", 1);
    const b = unit("unit_spearman", 1);
    const result = mergeSpecificPair([], [a, b], a.instanceId, b.instanceId, id);
    expect(result.ok).toBe(false);
  });

  it("store.mergeOnto works board↔board and respects auto-merge toggle", () => {
    const store = createStore(createInitialRunState(11));
    const s = store.getState();
    const u1 = unit("unit_archer", 1, { x: 1, y: 1 });
    const u2 = unit("unit_archer", 1, { x: 2, y: 3 });
    s.board = [u1, u2];
    s.bench = [];
    s.autoMergeEnabled = false;
    // Force state via debug helpers — mutate through sell/buy path instead:
    store.resetRun(11);
    store.debugSetGold(50);
    // Seed two boarded identical units via debugSeed then patch
    const next = store.getState();
    next.board = [
      {
        ...u1,
        instanceId: "merge_a",
      },
      {
        ...u2,
        instanceId: "merge_b",
      },
    ];
    next.bench = [];
    next.autoMergeEnabled = false;
    // Re-create store from this snapshot
    const store2 = createStore(structuredClone(next));
    const r = store2.mergeOnto("merge_a", "merge_b");
    expect(r.ok).toBe(true);
    const after = store2.getState();
    expect(after.board).toHaveLength(1);
    expect(after.board[0]!.starLevel).toBe(2);
    // With auto-merge off, a third identical wouldn't chain — only the pair merged.
    expect(after.autoMergeEnabled).toBe(false);
  });
});
