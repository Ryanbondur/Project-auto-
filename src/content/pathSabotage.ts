import type { PathSabotageDef } from "../core/types";

/**
 * Path sabotage items — rare board items that slow a path segment or briefly
 * fork/divert creeps. Placement must stay legal (not path-blocking towers).
 * slow_segment: wired via sabotageSpeedMult in pathing (0.5× on nearby segments).
 * brief_fork: placement works; divert behaviour still stubbed for Phase 4+.
 */
export const PATH_SABOTAGE_DEFS: PathSabotageDef[] = [
  {
    id: "sabotage_tar_slick",
    name: "Tar Slick",
    cost: 4,
    kind: "slow_segment",
    description: "Slows creeps on one path segment for the wave (stub).",
  },
  {
    id: "sabotage_signal_flare",
    name: "Signal Flare",
    cost: 5,
    kind: "brief_fork",
    description: "Briefly forks/diverts creeps onto a side hop (stub).",
  },
];

export function getPathSabotageDef(id: string): PathSabotageDef | undefined {
  return PATH_SABOTAGE_DEFS.find((s) => s.id === id);
}
