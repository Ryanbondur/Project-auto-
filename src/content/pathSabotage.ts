import type { PathSabotageDef } from "../core/types";

/**
 * Path sabotage items — rare board items that slow a path segment or briefly
 * fork/divert creeps. Placement must stay legal (not path-blocking towers).
 * slow_segment: sabotageSpeedMult in pathing (0.55× on nearby segments).
 * brief_fork: lateral divert hop via sabotageDivertOffset (does not block tiles).
 */
export const PATH_SABOTAGE_DEFS: PathSabotageDef[] = [
  {
    id: "sabotage_tar_slick",
    name: "Tar Slick",
    cost: 4,
    kind: "slow_segment",
    description: "Slows creeps on a short path segment for the rest of the run.",
  },
  {
    id: "sabotage_signal_flare",
    name: "Signal Flare",
    cost: 5,
    kind: "brief_fork",
    description: "Briefly diverts creeps onto a side hop (still on the path).",
  },
];

export function getPathSabotageDef(id: string): PathSabotageDef | undefined {
  return PATH_SABOTAGE_DEFS.find((s) => s.id === id);
}

/** Slow multiplier applied while on a tar segment (stacking multiplicative). */
export const SABOTAGE_SLOW_MULT = 0.55;

/** Path indices covered by a slow segment (inclusive span from anchor). */
export const SABOTAGE_SLOW_SPAN = 3;

/** Path indices covered by a brief fork divert (inclusive span from anchor). */
export const SABOTAGE_FORK_SPAN = 2;

/** Peak lateral divert distance in tile units. */
export const SABOTAGE_FORK_OFFSET = 0.65;
