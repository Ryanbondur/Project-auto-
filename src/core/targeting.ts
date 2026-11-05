import type { CreepDef, CreepInstance, TargetingMode } from "./types";
import { creepWorldPos, pathProgress } from "./pathing";
import type { MapDef } from "./types";
import { MAP } from "../content/map";

export const DEFAULT_CLUSTER_RADIUS = 1.0;

export type TargetCandidate = {
  creep: CreepInstance;
  def: CreepDef;
  dist: number;
};

function euclidean(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}

/**
 * Pick a target among living creeps in range according to targeting mode.
 * Returns null if none in range.
 */
export function selectTarget(
  mode: TargetingMode,
  unitTile: { x: number; y: number },
  range: number,
  creeps: CreepInstance[],
  defs: Map<string, CreepDef>,
  aoeRadius = 0,
  map: MapDef = MAP,
  clusterRadius = DEFAULT_CLUSTER_RADIUS,
): CreepInstance | null {
  const living = creeps.filter((c) => c.alive && c.hp > 0);
  const inRange: TargetCandidate[] = [];

  for (const creep of living) {
    const pos = creepWorldPos(creep, map);
    const dist = euclidean(unitTile.x + 0.5, unitTile.y + 0.5, pos.x + 0.5, pos.y + 0.5);
    if (dist <= range) {
      const def = defs.get(creep.defId);
      if (def) inRange.push({ creep, def, dist });
    }
  }

  if (inRange.length === 0) return null;

  switch (mode) {
    case "First":
      return inRange.reduce((best, cur) =>
        pathProgress(cur.creep, map) > pathProgress(best.creep, map) ? cur : best,
      ).creep;
    case "Last":
      return inRange.reduce((best, cur) =>
        pathProgress(cur.creep, map) < pathProgress(best.creep, map) ? cur : best,
      ).creep;
    case "Strongest":
      return inRange.reduce((best, cur) => {
        if (cur.def.maxHp !== best.def.maxHp) {
          return cur.def.maxHp > best.def.maxHp ? cur : best;
        }
        return cur.creep.hp > best.creep.hp ? cur : best;
      }).creep;
    case "LowestHP":
      return inRange.reduce((best, cur) =>
        cur.creep.hp < best.creep.hp ? cur : best,
      ).creep;
    case "AoeCluster": {
      const radius = aoeRadius > 0 ? aoeRadius : clusterRadius;
      let best = inRange[0]!;
      let bestCount = -1;
      for (const cand of inRange) {
        const center = creepWorldPos(cand.creep, map);
        let count = 0;
        for (const other of living) {
          const op = creepWorldPos(other, map);
          if (
            euclidean(center.x, center.y, op.x, op.y) <= radius
          ) {
            count += 1;
          }
        }
        if (count > bestCount) {
          bestCount = count;
          best = cand;
        }
      }
      return best.creep;
    }
    default:
      return inRange[0]!.creep;
  }
}

export const TARGETING_CYCLE: TargetingMode[] = [
  "First",
  "Last",
  "Strongest",
  "LowestHP",
  "AoeCluster",
];

export function nextTargetingMode(current: TargetingMode): TargetingMode {
  const i = TARGETING_CYCLE.indexOf(current);
  return TARGETING_CYCLE[(i + 1) % TARGETING_CYCLE.length]!;
}
