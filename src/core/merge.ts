import type { UnitInstance } from "./types";

export type MergePools = {
  board: UnitInstance[];
  bench: UnitInstance[];
};

export type MergeResult = MergePools & {
  merged: boolean;
  mergeCount: number;
};

function keyOf(u: UnitInstance): string {
  return `${u.defId}::${u.starLevel}`;
}

/**
 * Auto pairwise merge:
 * Two units with same defId + same starLevel → consume both, spawn one at starLevel+1.
 * Chain until stable. No hard star cap.
 *
 * Consume order (architecture default): bench-first, then board (preserve board DPS).
 * Placement of result: if either consumed was on board, spawn on a freed board tile;
 * else spawn on bench. Targeting inherited from first consumed.
 */
export function autoMergePairwise(
  board: UnitInstance[],
  bench: UnitInstance[],
  createInstanceId: () => string,
): MergeResult {
  let nextBoard = [...board];
  let nextBench = [...bench];
  let mergeCount = 0;
  let guard = 0;

  while (guard++ < 256) {
    // Bench-first ordering for consume candidates
    const ordered: { unit: UnitInstance; loc: "bench" | "board"; index: number }[] =
      [
        ...nextBench.map((unit, index) => ({ unit, loc: "bench" as const, index })),
        ...nextBoard.map((unit, index) => ({ unit, loc: "board" as const, index })),
      ];

    const groups = new Map<string, typeof ordered>();
    for (const entry of ordered) {
      const k = keyOf(entry.unit);
      const list = groups.get(k) ?? [];
      list.push(entry);
      groups.set(k, list);
    }

    let foundPair: (typeof ordered)[number][] | null = null;
    for (const list of groups.values()) {
      if (list.length >= 2) {
        foundPair = list.slice(0, 2);
        break;
      }
    }
    if (!foundPair) break;

    const [a, b] = foundPair;
    if (!a || !b) break;

    // Remove consumed (higher index first within same array to keep indices valid)
    const removeFrom = (loc: "bench" | "board", index: number) => {
      if (loc === "bench") {
        nextBench = nextBench.filter((_, i) => i !== index);
      } else {
        nextBoard = nextBoard.filter((_, i) => i !== index);
      }
    };

    // When both in same list, remove higher index first
    if (a.loc === b.loc) {
      const hi = Math.max(a.index, b.index);
      const lo = Math.min(a.index, b.index);
      removeFrom(a.loc, hi);
      removeFrom(a.loc, lo);
    } else {
      // Different lists — order doesn't matter across lists, but after first
      // removal indices in the other list are unchanged.
      removeFrom(b.loc, b.index);
      removeFrom(a.loc, a.index);
    }

    const boardTile =
      (a.loc === "board" ? a.unit.tile : null) ??
      (b.loc === "board" ? b.unit.tile : null);

    const merged: UnitInstance = {
      instanceId: createInstanceId(),
      defId: a.unit.defId,
      starLevel: a.unit.starLevel + 1,
      targeting: a.unit.targeting,
      tile: boardTile,
      cooldownMs: 0,
      currentTargetId: null,
      // Chips from consumed units: defer — Phase 2 keeps chips on inventory;
      // TODO: transfer/socket policy when chips are combat-live.
      chipInstanceIds: [],
      fromMerge: true,
    };

    if (boardTile) {
      nextBoard.push(merged);
    } else {
      nextBench.push(merged);
    }
    mergeCount += 1;
  }

  return {
    board: nextBoard,
    bench: nextBench,
    merged: mergeCount > 0,
    mergeCount,
  };
}

/**
 * Pairwise merge for buff chips in inventory (unsocketed only).
 * Same id + same star → one at star+1.
 */
export function autoMergeChipsPairwise<
  T extends { instanceId: string; defId: string; starLevel: number; socketedOnInstanceId: string | null },
>(
  chips: T[],
  createInstanceId: () => string,
): { chips: T[]; mergeCount: number } {
  let next = chips.map((c) => ({ ...c }));
  let mergeCount = 0;
  let guard = 0;

  while (guard++ < 128) {
    const free = next
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => c.socketedOnInstanceId === null);

    const groups = new Map<string, { c: T; index: number }[]>();
    for (const entry of free) {
      const k = `${entry.c.defId}::${entry.c.starLevel}`;
      const list = groups.get(k) ?? [];
      list.push(entry);
      groups.set(k, list);
    }

    let pair: { c: T; index: number }[] | null = null;
    for (const list of groups.values()) {
      if (list.length >= 2) {
        pair = list.slice(0, 2);
        break;
      }
    }
    if (!pair) break;

    const [a, b] = pair;
    if (!a || !b) break;
    const removeIds = new Set([a.c.instanceId, b.c.instanceId]);
    next = next.filter((c) => !removeIds.has(c.instanceId));
    next.push({
      ...a.c,
      instanceId: createInstanceId(),
      starLevel: a.c.starLevel + 1,
      socketedOnInstanceId: null,
    });
    mergeCount += 1;
  }

  return { chips: next, mergeCount };
}
