import { MAP } from "../content/map";
import {
  SABOTAGE_FORK_OFFSET,
  SABOTAGE_FORK_SPAN,
  SABOTAGE_SLOW_MULT,
  SABOTAGE_SLOW_SPAN,
  getPathSabotageDef,
} from "../content/pathSabotage";
import type { CreepInstance, MapDef, PathSabotageInstance } from "./types";

export type WorldPos = { x: number; y: number };

/** Continuous world position (tile units) for a creep on the path. */
export function creepWorldPos(
  creep: Pick<CreepInstance, "pathIndex" | "pathT" | "x" | "y">,
  map: MapDef = MAP,
): WorldPos {
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
    if (
      pathIndex >= s.pathIndex &&
      pathIndex <= s.pathIndex + SABOTAGE_SLOW_SPAN
    ) {
      mult *= SABOTAGE_SLOW_MULT;
    }
  }
  return mult;
}

/**
 * Brief fork / divert: lateral offset (tile units) while on a fork segment.
 * Does not change pathIndex legality — creeps stay on the path polyline with a
 * side hop so placement never blocks path tiles.
 *
 * Offset is perpendicular to the current segment and peaks mid-span (sin).
 */
export function sabotageDivertOffset(
  pathIndex: number,
  pathT: number,
  sabotages: PathSabotageInstance[],
  map: MapDef = MAP,
): WorldPos {
  let ox = 0;
  let oy = 0;
  const path = map.path;
  for (const s of sabotages) {
    if (!s.placed || s.pathIndex === null) continue;
    const def = getPathSabotageDef(s.defId);
    if (!def || def.kind !== "brief_fork") continue;
    const start = s.pathIndex;
    const end = s.pathIndex + SABOTAGE_FORK_SPAN;
    if (pathIndex < start || pathIndex > end) continue;

    const span = SABOTAGE_FORK_SPAN + 1;
    const local = pathIndex - start + pathT;
    const u = Math.min(1, Math.max(0, local / span));
    const strength = Math.sin(u * Math.PI); // 0 → 1 → 0

    const a = path[Math.min(pathIndex, path.length - 1)]!;
    const b = path[Math.min(pathIndex + 1, path.length - 1)]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular unit vector
    const px = -dy / len;
    const py = dx / len;
    ox += px * SABOTAGE_FORK_OFFSET * strength;
    oy += py * SABOTAGE_FORK_OFFSET * strength;
  }
  return { x: ox, y: oy };
}

export type MoveResult = {
  creep: CreepInstance;
  leaked: boolean;
};

/**
 * Advance a creep along the path by `speed` tiles/sec for `dtMs`.
 * Updates continuous x/y every step — no tile-center snapping.
 * Applies brief_fork divert as a world-space offset (path progress unchanged).
 */
export function moveCreepAlongPath(
  creep: CreepInstance,
  speedTilesPerSec: number,
  dtMs: number,
  map: MapDef = MAP,
  speedMult = 1,
  divert: WorldPos = { x: 0, y: 0 },
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
          x: end.x + divert.x,
          y: end.y + divert.y,
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
            x: end.x + divert.x,
            y: end.y + divert.y,
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
    creep: {
      ...creep,
      pathIndex,
      pathT,
      x: pos.x + divert.x,
      y: pos.y + divert.y,
    },
    leaked: false,
  };
}
