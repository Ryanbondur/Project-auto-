import {
  awardRunXp,
  unlockCodexEntries,
  unlockSkill,
} from "./commander";
import {
  clearActiveRun,
  freshMeta,
  hasActiveRun,
  loadActiveRun,
  loadMeta,
  saveActiveRun,
  saveMeta,
  type PersistedMetaV1,
} from "./persistence";
import type { RunState, SkillId } from "../core/types";

type Listener = () => void;

/**
 * Cross-run Commander meta + single active-run handle.
 * Game store owns live RunState; this owns localStorage + menu XP/skills/codex.
 */
export type MetaStore = {
  getMeta: () => PersistedMetaV1;
  subscribe: (listener: Listener) => () => void;
  hasPausedRun: () => boolean;
  /** Persist current run for pause/resume (only one slot). */
  pauseRun: (run: RunState, nextInstanceSeq: number) => void;
  /** Load paused run; does not clear until abandon/end. */
  peekPausedRun: () => { run: RunState; nextInstanceSeq: number } | null;
  /** Clear active run after resume into the game store or abandon. */
  clearPausedRun: () => void;
  /** Award XP from waves cleared; clear active run. Returns xp gained. */
  endRun: (wavesCleared: number) => { xpGained: number; meta: PersistedMetaV1 };
  tryUnlockSkill: (skillId: SkillId) => { ok: true } | { ok: false; reason: string };
  /** Mark units encountered/purchased in Codex. */
  revealCodex: (unitIds: string[]) => void;
  /** Test / debug helper. */
  replaceMeta: (meta: PersistedMetaV1) => void;
  resetMeta: () => void;
};

export function createMetaStore(
  storage: Storage | null = typeof localStorage !== "undefined" ? localStorage : null,
): MetaStore {
  let meta = loadMeta(storage);
  const listeners = new Set<Listener>();

  const emit = () => {
    for (const l of listeners) l();
  };

  const setMeta = (next: PersistedMetaV1) => {
    meta = next;
    saveMeta(meta, storage);
    emit();
  };

  return {
    getMeta: () => meta,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    hasPausedRun: () => hasActiveRun(storage),

    pauseRun: (run, nextInstanceSeq) => {
      saveActiveRun(run, nextInstanceSeq, storage);
      emit();
    },

    peekPausedRun: () => {
      const saved = loadActiveRun(storage);
      if (!saved) return null;
      return { run: saved.run, nextInstanceSeq: saved.nextInstanceSeq };
    },

    clearPausedRun: () => {
      clearActiveRun(storage);
      emit();
    },

    endRun: (wavesCleared) => {
      const { meta: next, xpGained } = awardRunXp(meta, wavesCleared);
      clearActiveRun(storage);
      setMeta(next);
      return { xpGained, meta: next };
    },

    tryUnlockSkill: (skillId) => {
      const result = unlockSkill(meta, skillId);
      if (!result.ok) return result;
      setMeta(result.meta);
      return { ok: true };
    },

    revealCodex: (unitIds) => {
      const { meta: next, changed } = unlockCodexEntries(meta, unitIds);
      if (changed) setMeta(next);
    },

    replaceMeta: (next) => {
      setMeta(next);
    },

    resetMeta: () => {
      clearActiveRun(storage);
      setMeta(freshMeta());
    },
  };
}

export const metaStore = createMetaStore();
