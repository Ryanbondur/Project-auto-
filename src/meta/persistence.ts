import { cloneDefaultPath } from "../content/map";
import type { MetaState, RunState, SkillId } from "../core/types";

/**
 * Persistence uses the standard `localStorage` API — works in desktop browsers,
 * Mobile Safari tabs, and iOS Home Screen / standalone PWAs.
 *
 * Progress is **per device + per browser profile** (and typically per Home Screen
 * web app origin). It does not sync across phones or between Safari tabs and a
 * separately installed Home Screen icon on older iOS; treat the Home Screen app
 * as the canonical playtest install once added.
 *
 * Private browsing / storage quota failures are swallowed so the session still
 * runs in memory for that launch.
 */

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

/** Backfill fields added after Phase 5 so older paused runs still resume. */
function normalizeLoadedRun(run: RunState): RunState {
  const gambit = run.gambit ?? {
    usesSpent: 0,
    usedThisRun: false,
    activeGambit: null,
    freeRerollsRemaining: 0,
  };
  if (typeof gambit.usesSpent !== "number") {
    gambit.usesSpent = gambit.usedThisRun ? 1 : 0;
  }
  gambit.usedThisRun = gambit.usesSpent > 0 || Boolean(gambit.usedThisRun);
  for (const creep of run.creeps ?? []) {
    if (typeof creep.maxHp !== "number" || creep.maxHp <= 0) {
      creep.maxHp = Math.max(1, creep.hp);
    }
  }
  for (const p of run.projectiles ?? []) {
    if (typeof p.lifestealFraction !== "number") {
      p.lifestealFraction = 0;
    }
    if (typeof p.sourceUnitId !== "string") {
      p.sourceUnitId = "";
    }
  }
  for (const u of [...(run.board ?? []), ...(run.bench ?? [])]) {
    if (typeof u.damageDealtWave !== "number") u.damageDealtWave = 0;
    if (typeof u.damageDealtRun !== "number") u.damageDealtRun = 0;
  }
  if (typeof run.healPulseCooldownMs !== "number") {
    run.healPulseCooldownMs = 4000;
  }
  const modifiers = run.modifiers ?? {
    boardSlotsBonus: 0,
    ballisticDamageBonus: 0,
    meleeDamageBonus: 0,
    supportAsBonus: 0,
    interestBonusNextPayout: 0,
    nextWaveHpMult: 1,
    freeRerolls: 0,
    shopOfferBonusThisPrep: 0,
    pathSlow: null,
    traits: [],
    leakDamageReduction: 0,
    shopDisabledThisPrep: false,
    pathFork: null,
  };
  if (typeof modifiers.boardSlotsBonus !== "number") modifiers.boardSlotsBonus = 0;
  if (typeof modifiers.ballisticDamageBonus !== "number") {
    modifiers.ballisticDamageBonus = 0;
  }
  if (typeof modifiers.meleeDamageBonus !== "number") {
    modifiers.meleeDamageBonus = 0;
  }
  if (typeof modifiers.supportAsBonus !== "number") {
    modifiers.supportAsBonus = 0;
  }
  if (typeof modifiers.interestBonusNextPayout !== "number") {
    modifiers.interestBonusNextPayout = 0;
  }
  if (typeof modifiers.nextWaveHpMult !== "number") modifiers.nextWaveHpMult = 1;
  if (typeof modifiers.freeRerolls !== "number") modifiers.freeRerolls = 0;
  if (typeof modifiers.shopOfferBonusThisPrep !== "number") {
    modifiers.shopOfferBonusThisPrep = 0;
  }
  if (modifiers.pathSlow && typeof modifiers.pathSlow.pathIndex !== "number") {
    modifiers.pathSlow = null;
  }
  if (!Array.isArray(modifiers.traits)) modifiers.traits = [];
  if (typeof modifiers.leakDamageReduction !== "number") {
    modifiers.leakDamageReduction = 0;
  }
  if (typeof modifiers.shopDisabledThisPrep !== "boolean") {
    modifiers.shopDisabledThisPrep = false;
  }
  if (modifiers.pathFork && typeof modifiers.pathFork.pathIndex !== "number") {
    modifiers.pathFork = null;
  }
  const eventChoice = run.eventChoice ?? null;
  const arena = run.arena ?? null;
  const autoMergeEnabled =
    typeof run.autoMergeEnabled === "boolean" ? run.autoMergeEnabled : true;
  if (run.waveRuntime && typeof run.waveRuntime.eventHpMult !== "number") {
    run.waveRuntime.eventHpMult = 1;
  }
  for (const creep of run.creeps ?? []) {
    if (!Array.isArray(creep.agendas)) creep.agendas = [];
    if (typeof creep.shieldHp !== "number") creep.shieldHp = 0;
    if (typeof creep.regenAccMs !== "number") creep.regenAccMs = 0;
    if (typeof creep.hexCooldownMs !== "number") creep.hexCooldownMs = 0;
    if (typeof creep.isBossCreep !== "boolean") {
      creep.isBossCreep = Boolean(creep.defId === "creep_boss");
    }
  }
  const doctrineId = run.doctrineId ?? null;
  const path =
    Array.isArray(run.path) && run.path.length > 0
      ? run.path
      : cloneDefaultPath();
  const draftDuel = run.draftDuel ?? null;
  const draftDuelCompletedEra =
    typeof run.draftDuelCompletedEra === "number" ? run.draftDuelCompletedEra : 0;
  const activeDraftCounter = run.activeDraftCounter ?? null;
  const pendingEraBoss = run.pendingEraBoss ?? null;
  const combatElapsedMs =
    typeof run.combatElapsedMs === "number" ? run.combatElapsedMs : 0;
  const feedback = Array.isArray(run.feedback) ? run.feedback : [];
  return {
    ...run,
    gambit,
    modifiers,
    eventChoice,
    arena,
    autoMergeEnabled,
    doctrineId,
    path,
    draftDuel,
    draftDuelCompletedEra,
    activeDraftCounter,
    pendingEraBoss,
    combatElapsedMs,
    feedback,
  };
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
      run: normalizeLoadedRun(parsed.run),
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
