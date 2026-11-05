import type { MetaState, RunState, SkillId } from "../core/types";

/** localStorage key for Commander meta (architecture §8). */
export const META_STORAGE_KEY = "atd.meta.v1";

/** localStorage key for the single paused / active run (design-decisions). */
export const ACTIVE_RUN_STORAGE_KEY = "atd.run.v1";

export type PersistedMetaV1 = MetaState;

export type PersistedActiveRunV1 = {
  version: 1;
  run: RunState;
  /** Preserve instance id sequence across pause/resume. */
  nextInstanceSeq: number;
};

export function freshMeta(): PersistedMetaV1 {
  return {
    version: 1,
    commanderXp: 0,
    unlockedSkills: [],
    codexUnlocked: [],
  };
}

function isSkillId(value: unknown): value is SkillId {
  return (
    value === "deep_pockets" ||
    value === "interest_rate_cap" ||
    value === "master_mason" ||
    value === "quick_assembly" ||
    value === "veterancy" ||
    value === "reinforcements"
  );
}

function sanitizeMeta(raw: unknown): PersistedMetaV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) return null;
  if (typeof obj.commanderXp !== "number" || !Number.isFinite(obj.commanderXp)) {
    return null;
  }
  if (!Array.isArray(obj.unlockedSkills) || !Array.isArray(obj.codexUnlocked)) {
    return null;
  }
  const unlockedSkills = obj.unlockedSkills.filter(isSkillId);
  const codexUnlocked = obj.codexUnlocked.filter(
    (id): id is string => typeof id === "string",
  );
  return {
    version: 1,
    commanderXp: Math.max(0, Math.floor(obj.commanderXp)),
    unlockedSkills,
    codexUnlocked: [...new Set(codexUnlocked)],
  };
}

/** Load meta; missing/invalid → fresh defaults. */
export function loadMeta(
  storage: Pick<Storage, "getItem"> | null = defaultStorage(),
): PersistedMetaV1 {
  if (!storage) return freshMeta();
  try {
    const raw = storage.getItem(META_STORAGE_KEY);
    if (!raw) return freshMeta();
    const parsed = sanitizeMeta(JSON.parse(raw) as unknown);
    return parsed ?? freshMeta();
  } catch {
    return freshMeta();
  }
}

export function saveMeta(
  meta: PersistedMetaV1,
  storage: Pick<Storage, "setItem"> | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Quota / private mode — ignore; in-memory meta still works this session.
  }
}

export function loadActiveRun(
  storage: Pick<Storage, "getItem"> | null = defaultStorage(),
): PersistedActiveRunV1 | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ACTIVE_RUN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedActiveRunV1;
    if (parsed?.version !== 1 || !parsed.run || typeof parsed.run !== "object") {
      return null;
    }
    if (
      typeof parsed.nextInstanceSeq !== "number" ||
      !Number.isFinite(parsed.nextInstanceSeq)
    ) {
      return null;
    }
    return {
      version: 1,
      run: parsed.run,
      nextInstanceSeq: Math.max(1, Math.floor(parsed.nextInstanceSeq)),
    };
  } catch {
    return null;
  }
}

export function saveActiveRun(
  run: RunState,
  nextInstanceSeq: number,
  storage: Pick<Storage, "setItem"> | null = defaultStorage(),
): void {
  if (!storage) return;
  const payload: PersistedActiveRunV1 = {
    version: 1,
    run,
    nextInstanceSeq: Math.max(1, Math.floor(nextInstanceSeq)),
  };
  try {
    storage.setItem(ACTIVE_RUN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearActiveRun(
  storage: Pick<Storage, "removeItem"> | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(ACTIVE_RUN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasActiveRun(
  storage: Pick<Storage, "getItem"> | null = defaultStorage(),
): boolean {
  return loadActiveRun(storage) !== null;
}

function defaultStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}
