import { GRID_HEIGHT, GRID_WIDTH } from "../core/constants";
import type { MapDef } from "../core/types";

/**
 * Default 14×10 serpentine path (left → right with vertical jogs).
 * Path tiles are non-placeable.
 * Living path mutations clone this into RunState.path at run start.
 */
function buildSerpentinePath(): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  const rowA = 2;
  const rowB = 7;

  for (let x = 0; x <= 3; x++) path.push({ x, y: rowA });
  for (let y = rowA; y <= rowB; y++) path.push({ x: 3, y });
  for (let x = 3; x <= 7; x++) path.push({ x, y: rowB });
  for (let y = rowB; y >= rowA; y--) path.push({ x: 7, y });
  for (let x = 7; x <= 10; x++) path.push({ x, y: rowA });
  for (let y = rowA; y <= rowB; y++) path.push({ x: 10, y });
  for (let x = 10; x < GRID_WIDTH; x++) path.push({ x, y: rowB });

  // Deduplicate consecutive duplicates from corner joins
  const deduped: { x: number; y: number }[] = [];
  for (const p of path) {
    const last = deduped[deduped.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) deduped.push(p);
  }
  return deduped;
}

export const MAP: MapDef = {
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  path: buildSerpentinePath(),
};

/** Fresh copy of the default serpentine path for a new run. */
export function cloneDefaultPath(): { x: number; y: number }[] {
  return MAP.path.map((p) => ({ x: p.x, y: p.y }));
}

export function pathTileSet(
  path: { x: number; y: number }[],
): Set<string> {
  return new Set(path.map((p) => `${p.x},${p.y}`));
}

export function isPathTileOn(
  path: { x: number; y: number }[],
  x: number,
  y: number,
): boolean {
  return pathTileSet(path).has(`${x},${y}`);
}

/** @deprecated Prefer isPathTileOn(state.path, …) — uses static MAP. */
export function isPathTile(x: number, y: number): boolean {
  return isPathTileOn(MAP.path, x, y);
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < MAP.width && y < MAP.height;
}

export function isPlaceableTileOn(
  path: { x: number; y: number }[],
  x: number,
  y: number,
): boolean {
  return inBounds(x, y) && !isPathTileOn(path, x, y);
}

/** @deprecated Prefer isPlaceableTileOn(state.path, …) — uses static MAP. */
export function isPlaceableTile(x: number, y: number): boolean {
  return isPlaceableTileOn(MAP.path, x, y);
}

/** MapDef view over a runtime path (combat / renderer). */
export function mapWithPath(path: { x: number; y: number }[]): MapDef {
  return { width: MAP.width, height: MAP.height, path };
}
