import { describe, expect, it } from "vitest";
import { cloneDefaultPath } from "../src/content/map";
import {
  autoBenchInvalidatedUnits,
  isPathLegal,
  mutatePath,
} from "../src/core/pathMutate";
import type { UnitInstance } from "../src/core/types";

function unit(id: string, tile: { x: number; y: number } | null): UnitInstance {
  return {
    instanceId: id,
    defId: "unit_slinger",
    starLevel: 1,
    targeting: "First",
    tile,
    cooldownMs: 0,
    currentTargetId: null,
    chipInstanceIds: [],
    fromMerge: false,
    damageDealtWave: 0,
    damageDealtRun: 0,
  };
}

describe("living path mutate", () => {
  it("default path is legal", () => {
    expect(isPathLegal(cloneDefaultPath())).toBe(true);
  });

  it("lengthen / bend keep path legal and contiguous", () => {
    const base = cloneDefaultPath();
    for (const kind of ["lengthen", "add_bend"] as const) {
      const result = mutatePath(base, kind, 42 + kind.length);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(isPathLegal(result.path)).toBe(true);
      expect(result.path.length).toBeGreaterThanOrEqual(base.length);
    }
  });

  it("brief_fork keeps tiles; autoBench moves units on invalidated tiles", () => {
    const base = cloneDefaultPath();
    const bend = mutatePath(base, "add_bend", 99);
    expect(bend.ok).toBe(true);
    if (!bend.ok) return;
    expect(bend.invalidated.length).toBeGreaterThan(0);
    const victimTile = bend.invalidated[0]!;
    const board = [unit("a", victimTile), unit("b", { x: 0, y: 0 })];
    // Ensure b is not on new path if possible
    const moved = autoBenchInvalidatedUnits(board, [], bend.invalidated, 5);
    expect(moved.benchedIds).toContain("a");
    expect(moved.board.every((u) => u.instanceId !== "a")).toBe(true);
    expect(moved.bench.some((u) => u.instanceId === "a" && u.tile === null)).toBe(
      true,
    );
  });

  it("auto mutation eventually succeeds on default map", () => {
    const result = mutatePath(cloneDefaultPath(), "auto", 12345);
    expect(result.ok).toBe(true);
  });
});
