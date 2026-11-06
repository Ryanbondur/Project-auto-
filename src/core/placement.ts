import { MAP, isPlaceableTileOn } from "../content/map";
import type { UnitInstance } from "./types";

export type PlaceResult =
  | { ok: true; board: UnitInstance[]; bench: UnitInstance[] }
  | { ok: false; reason: string };

function occupiedKey(board: UnitInstance[]): Set<string> {
  const s = new Set<string>();
  for (const u of board) {
    if (u.tile) s.add(`${u.tile.x},${u.tile.y}`);
  }
  return s;
}

/**
 * Move a unit from bench → board onto a valid non-path, unoccupied tile.
 * Fails if board at maxBoardSlots, tile illegal, or unit not on bench.
 */
export function tryPlaceOnBoard(
  board: UnitInstance[],
  bench: UnitInstance[],
  instanceId: string,
  tile: { x: number; y: number },
  maxBoardSlots: number,
  path: { x: number; y: number }[] = MAP.path,
): PlaceResult {
  const benchIdx = bench.findIndex((u) => u.instanceId === instanceId);
  if (benchIdx < 0) {
    // Already on board — allow reposition
    const boardIdx = board.findIndex((u) => u.instanceId === instanceId);
    if (boardIdx < 0) return { ok: false, reason: "unit_not_found" };
    if (!isPlaceableTileOn(path, tile.x, tile.y)) {
      return { ok: false, reason: "tile_not_placeable" };
    }
    const occ = occupiedKey(board);
    const self = board[boardIdx]!;
    if (self.tile) occ.delete(`${self.tile.x},${self.tile.y}`);
    if (occ.has(`${tile.x},${tile.y}`)) {
      return { ok: false, reason: "tile_occupied" };
    }
    const nextBoard = board.map((u, i) =>
      i === boardIdx ? { ...u, tile: { ...tile } } : u,
    );
    return { ok: true, board: nextBoard, bench };
  }

  if (board.length >= maxBoardSlots) {
    return { ok: false, reason: "board_full" };
  }
  if (!isPlaceableTileOn(path, tile.x, tile.y)) {
    return { ok: false, reason: "tile_not_placeable" };
  }
  if (occupiedKey(board).has(`${tile.x},${tile.y}`)) {
    return { ok: false, reason: "tile_occupied" };
  }

  const unit = bench[benchIdx]!;
  const nextBench = bench.filter((_, i) => i !== benchIdx);
  const nextBoard = [...board, { ...unit, tile: { ...tile } }];
  return { ok: true, board: nextBoard, bench: nextBench };
}

/** Move a boarded unit back to bench (if capacity allows). */
export function tryMoveToBench(
  board: UnitInstance[],
  bench: UnitInstance[],
  instanceId: string,
  benchCapacity: number,
): PlaceResult {
  const boardIdx = board.findIndex((u) => u.instanceId === instanceId);
  if (boardIdx < 0) return { ok: false, reason: "unit_not_on_board" };
  if (bench.length >= benchCapacity) {
    return { ok: false, reason: "bench_full" };
  }
  const unit = board[boardIdx]!;
  const nextBoard = board.filter((_, i) => i !== boardIdx);
  const nextBench = [...bench, { ...unit, tile: null }];
  return { ok: true, board: nextBoard, bench: nextBench };
}
