import { UNIT_DEFS } from "../content/units";
import type { UnitDef } from "../core/types";

export type CodexEntry = {
  def: UnitDef;
  unlocked: boolean;
};

/** Full roster with silhouette state from persisted unlocks. */
export function buildCodexEntries(unlockedIds: string[]): CodexEntry[] {
  const unlocked = new Set(unlockedIds);
  return UNIT_DEFS.map((def) => ({
    def,
    unlocked: unlocked.has(def.id),
  }));
}

export function isCodexUnlocked(unlockedIds: string[], unitId: string): boolean {
  return unlockedIds.includes(unitId);
}

/** Group entries by era for Codex UI. */
export function codexByEra(entries: CodexEntry[]): Map<1 | 2 | 3 | 4 | 5, CodexEntry[]> {
  const map = new Map<1 | 2 | 3 | 4 | 5, CodexEntry[]>();
  for (const era of [1, 2, 3, 4, 5] as const) {
    map.set(
      era,
      entries.filter((e) => e.def.era === era),
    );
  }
  return map;
}
