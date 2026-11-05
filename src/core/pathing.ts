import { MAP } from "../content/map";
import { getPathSabotageDef } from "../content/pathSabotage";
import type { CreepInstance, MapDef, PathSabotageInstance } from "./types";

export type WorldPos = { x: number; y: number };

/** Continuous world position (tile units) for a creep on the path. */
export function creepWorldPos(
  creep: Pick<CreepInstance, "pathIndex" | "pathT" | "x" | "y">,
  map: MapDef = MAP,
): WorldPos {
  // Prefer sim-authored x/y when present (finite); fall back to path lerp.
  if (Number.isFinite(creep.x) && Number.isFinite(creep.y)) {
    return { x: creep.x, y: creep.y };
  }
  const path = map.path;
  if (path.length === 0) return { x: 0, y: 0 };
  const i = Math.max(0, Math.min(creep.pathIndex, path.length - 1));
  const a = path[i]!;
  const b = path[i + 1] ?? a;
  return {
    x: a.x + (b.x - a.x) * creep.pathT,
    y: a.y + (b.y - a.y) * creep.pathT,
  };
}

/** Lerp helpers for pathIndex + pathT → world. */
export function worldPosFromPath(
  pathIndex: number,
  pathT: number,
  map: MapDef = MAP,
): WorldPos {
  const path = map.path;
  if (path.length === 0) return { x: 0, y: 0 };
  const i = Math.max(0, Math.min(pathIndex, path.length - 1));
  const a = path[i]!;
  const b = path[i + 1] ?? a;
  const t = Math.min(1, Math.max(0, pathT));
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/** Scalar progress along the whole path (for First / Last targeting). */
export function pathProgress(
  creep: Pick<CreepInstance, "pathIndex" | "pathT">,
  map: MapDef = MAP,
): number {
  const segs = Math.max(1, map.path.length - 1);
  return (creep.pathIndex + creep.pathT) / segs;
}

/** Tar Slick etc.: slow multiplier when creep is near a placed slow segment. */
export function sabotageSpeedMult(
  pathIndex: number,
  sabotages: PathSabotageInstance[],
): number {
  let mult = 1;
  for (const s of sabotages) {
    if (!s.placed || s.pathIndex === null) continue;
    const def = getPathSabotageDef(s.defId);
    if (!def || def.kind !== "slow_segment") continue;
    if (pathIndex >= s.pathIndex && pathIndex <= s.pathIndex + 3) {
      mult *= 0.5;
    }
  }
  return mult;
}

export type MoveResult = {
  creep: CreepInstance;
  leaked: boolean;
};

/**
 * Advance a creep along the path by `speed` tiles/sec for `dtMs`.
 * Updates continuous x/y every step — no tile-center snapping.
 */
export function moveCreepAlongPath(
  creep: CreepInstance,
  speedTilesPerSec: number,
  dtMs: number,
  map: MapDef = MAP,
  speedMult = 1,
): MoveResult {
  if (!creep.alive) return { creep, leaked: false };
  const path = map.path;
  if (path.length === 0) return { creep, leaked: true };

  let pathIndex = creep.pathIndex;
  let pathT = creep.pathT;
  let remaining = (speedTilesPerSec * speedMult * dtMs) / 1000;

  while (remaining > 1e-9) {
    if (pathIndex >= path.length - 1) {
      const end = path[path.length - 1]!;
      return {
        creep: {
          ...creep,
          pathIndex: path.length - 1,
          pathT: 1,
          x: end.x,
          y: end.y,
          alive: false,
        },
        leaked: true,
      };
    }
    const distLeft = 1 - pathT;
    if (remaining >= distLeft - 1e-12) {
      remaining -= distLeft;
      pathIndex += 1;
      pathT = 0;
      if (pathIndex >= path.length - 1) {
        const end = path[path.length - 1]!;
        return {
          creep: {
            ...creep,
            pathIndex: path.length - 1,
            pathT: 1,
            x: end.x,
            y: end.y,
            alive: false,
          },
          leaked: true,
        };
      }
    } else {
      pathT += remaining;
      remaining = 0;
    }
  }

  const pos = worldPosFromPath(pathIndex, pathT, map);
  return {
    creep: { ...creep, pathIndex, pathT, x: pos.x, y: pos.y },
    leaked: false,
  };
}
