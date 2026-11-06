import { GRID_HEIGHT, GRID_WIDTH } from "./constants";
import { createRng } from "./rng";
import type { PathMutationKind, PathMutationResult, UnitInstance } from "./types";

export type Tile = { x: number; y: number };

function key(t: Tile): string {
  return `${t.x},${t.y}`;
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT;
}

function dedupePath(path: Tile[]): Tile[] {
  const out: Tile[] = [];
  for (const p of path) {
    const last = out[out.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) out.push({ ...p });
  }
  return out;
}

function pathSetOf(path: Tile[]): Set<string> {
  return new Set(path.map(key));
}

/** Orthogonal neighbors not already on the path. */
function freeNeighbor(
  tile: Tile,
  occupied: Set<string>,
  prefer: "perp" | "any",
  incoming: Tile | null,
): Tile | null {
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  const candidates: Tile[] = [];
  for (const d of dirs) {
    const n = { x: tile.x + d.x, y: tile.y + d.y };
    if (!inBounds(n.x, n.y)) continue;
    if (occupied.has(key(n))) continue;
    if (prefer === "perp" && incoming) {
      const idx = tile.x - incoming.x;
      const idy = tile.y - incoming.y;
      // Prefer turn (perpendicular) over continuing straight
      const straight = n.x - tile.x === idx && n.y - tile.y === idy;
      if (straight) continue;
    }
    candidates.push(n);
  }
  if (candidates.length === 0 && prefer === "perp") {
    return freeNeighbor(tile, occupied, "any", incoming);
  }
  return candidates[0] ?? null;
}

/**
 * Lengthen: insert a 3-tile detour jog mid-path into free tiles.
 * Keeps start/end fixed; path stays contiguous orthogonally.
 */
export function mutateLengthen(path: Tile[], seed: number): PathMutationResult {
  const rand = createRng(seed);
  const base = dedupePath(path);
  if (base.length < 6) {
    return { ok: false, reason: "path_too_short", path: base, invalidated: [] };
  }
  const occupied = pathSetOf(base);
  const startIdx = 2 + Math.floor(rand() * Math.max(1, base.length - 5));
  const anchor = base[startIdx]!;
  const prev = base[startIdx - 1] ?? null;
  const side = freeNeighbor(anchor, occupied, "perp", prev);
  if (!side) {
    return { ok: false, reason: "no_free_tile", path: base, invalidated: [] };
  }
  occupied.add(key(side));
  // Return toward next tile or a second free step
  const next = base[startIdx + 1]!;
  let bridge = freeNeighbor(side, occupied, "any", anchor);
  // Prefer a tile adjacent to `next` so we can rejoin
  const rejoins = [
    { x: side.x + (next.x - anchor.x), y: side.y + (next.y - anchor.y) },
    { x: next.x, y: side.y },
    { x: side.x, y: next.y },
  ].filter(
    (t) =>
      inBounds(t.x, t.y) &&
      !occupied.has(key(t)) &&
      Math.abs(t.x - next.x) + Math.abs(t.y - next.y) === 1,
  );
  bridge = rejoins[0] ?? bridge;
  if (!bridge) {
    return { ok: false, reason: "no_bridge", path: base, invalidated: [] };
  }
  // Insert: ... anchor → side → bridge → next ...
  // Remove the direct anchor→next edge by splicing after startIdx
  const inserted = [side, bridge];
  const newPath = dedupePath([
    ...base.slice(0, startIdx + 1),
    ...inserted,
    ...base.slice(startIdx + 1),
  ]);
  // Ensure adjacency along whole path
  if (!isContiguous(newPath)) {
    return { ok: false, reason: "not_contiguous", path: base, invalidated: [] };
  }
  const invalidated = inserted.filter((t) => !pathSetOf(base).has(key(t)));
  return {
    ok: true,
    kind: "lengthen",
    path: newPath,
    invalidated,
    message: "Path lengthened — units on new lane tiles were benched.",
  };
}

/**
 * Add bend: replace a straight 3-tile run with an L-jog (bulge into free space).
 */
export function mutateAddBend(path: Tile[], seed: number): PathMutationResult {
  const rand = createRng(seed);
  const base = dedupePath(path);
  if (base.length < 5) {
    return { ok: false, reason: "path_too_short", path: base, invalidated: [] };
  }
  // Find straight segments of length >= 3
  const straights: number[] = [];
  for (let i = 0; i < base.length - 2; i++) {
    const a = base[i]!;
    const b = base[i + 1]!;
    const c = base[i + 2]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (c.x - b.x === dx && c.y - b.y === dy && (dx !== 0 || dy !== 0)) {
      straights.push(i);
    }
  }
  if (straights.length === 0) {
    return mutateLengthen(base, seed + 7);
  }
  const startIdx = straights[Math.floor(rand() * straights.length)]!;
  const a = base[startIdx]!;
  const b = base[startIdx + 1]!;
  const c = base[startIdx + 2]!;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Perpendicular bulge: a → u → v → w → c (skip b), all ortho-adjacent
  const occupied = pathSetOf(base);
  const alts = [
    { px: -dy, py: dx },
    { px: dy, py: -dx },
  ];
  for (const { px, py } of alts) {
    const u = { x: a.x + px, y: a.y + py };
    const v = { x: b.x + px, y: b.y + py };
    const w = { x: c.x + px, y: c.y + py };
    if (![u, v, w].every((t) => inBounds(t.x, t.y))) continue;
    if ([u, v, w].some((t) => occupied.has(key(t)))) continue;
    // a → u → v → w → c
    const newPath = dedupePath([
      ...base.slice(0, startIdx + 1),
      u,
      v,
      w,
      ...base.slice(startIdx + 2),
    ]);
    if (!isContiguous(newPath) || !isPathLegal(newPath)) continue;
    const invalidated = [u, v, w];
    return {
      ok: true,
      kind: "add_bend",
      path: newPath,
      invalidated,
      message: "Path bent — towers on the new lane were auto-benched.",
    };
  }
  return mutateLengthen(base, seed + 11);
}

/**
 * Brief fork/divert: mark a mid-path divert hop (uses sabotage-style offset).
 * Does not change placeable tiles — returns same path + forkAnchor for sabotage.
 */
export function mutateBriefFork(
  path: Tile[],
  seed: number,
): PathMutationResult & { forkAnchor?: number } {
  const rand = createRng(seed);
  const base = dedupePath(path);
  if (base.length < 4) {
    return { ok: false, reason: "path_too_short", path: base, invalidated: [] };
  }
  const anchor =
    2 + Math.floor(rand() * Math.max(1, base.length - 4));
  return {
    ok: true,
    kind: "brief_fork",
    path: base,
    invalidated: [],
    forkAnchor: anchor,
    message: "Path forked briefly — creeps take a side hop.",
  };
}

export function isContiguous(path: Tile[]): boolean {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const man = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (man !== 1) return false;
  }
  return true;
}

export function isPathLegal(path: Tile[]): boolean {
  if (path.length < 2) return false;
  if (!isContiguous(path)) return false;
  for (const t of path) {
    if (!inBounds(t.x, t.y)) return false;
  }
  // Unique tiles preferred (no loops that revisit) — allow revisit? keep unique for placement clarity
  const seen = new Set<string>();
  for (const t of path) {
    const k = key(t);
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}

/** Pick a mutation kind and apply. Falls back through kinds until one succeeds. */
export function mutatePath(
  path: Tile[],
  kind: PathMutationKind | "auto",
  seed: number,
): PathMutationResult & { forkAnchor?: number } {
  const order: PathMutationKind[] =
    kind === "auto"
      ? (["add_bend", "lengthen", "brief_fork"] as PathMutationKind[])
      : [kind];
  // Shuffle lightly by seed
  const rand = createRng(seed);
  if (kind === "auto") {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = order[i]!;
      order[i] = order[j]!;
      order[j] = tmp;
    }
  }
  for (const k of order) {
    let result: PathMutationResult & { forkAnchor?: number };
    if (k === "lengthen") result = mutateLengthen(path, seed);
    else if (k === "add_bend") result = mutateAddBend(path, seed + 3);
    else result = mutateBriefFork(path, seed + 5);
    if (result.ok) {
      if (result.kind !== "brief_fork" && !isPathLegal(result.path)) {
        continue;
      }
      return result;
    }
  }
  return {
    ok: false,
    reason: "all_mutations_failed",
    path: dedupePath(path),
    invalidated: [],
  };
}

/**
 * Move board units sitting on invalidated (new path) tiles to bench.
 * Soft-overflows bench capacity. Returns benched instance ids.
 */
export function autoBenchInvalidatedUnits(
  board: UnitInstance[],
  bench: UnitInstance[],
  invalidated: Tile[],
  benchCapacity: number,
): { board: UnitInstance[]; bench: UnitInstance[]; benchedIds: string[] } {
  if (invalidated.length === 0) {
    return { board, bench, benchedIds: [] };
  }
  const bad = new Set(invalidated.map(key));
  const stay: UnitInstance[] = [];
  const moved: UnitInstance[] = [];
  for (const u of board) {
    if (u.tile && bad.has(key(u.tile))) {
      moved.push({ ...u, tile: null });
    } else {
      stay.push(u);
    }
  }
  const nextBench = [...bench, ...moved];
  // Soft overflow allowed (same as era discovery grant)
  void benchCapacity;
  return {
    board: stay,
    bench: nextBench,
    benchedIds: moved.map((u) => u.instanceId),
  };
}

export function tilesBecamePath(
  oldPath: Tile[],
  newPath: Tile[],
): Tile[] {
  const old = pathSetOf(oldPath);
  return newPath.filter((t) => !old.has(key(t)));
}
