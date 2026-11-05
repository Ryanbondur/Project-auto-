import {
  DEFAULT_BENCH_CAPACITY,
  INTEREST_CAP_DEFAULT,
  INTEREST_CAP_SKILL,
  STARTING_GOLD,
  XP_PER_WAVE_CLEARED,
} from "../core/constants";
import { withVeterancy } from "../core/era";
import { ERA_CONFIGS } from "../content/eras";
import { getSkillDef, SKILL_DEFS } from "../content/skills";
import type { EraConfig, MetaState, SkillId } from "../core/types";
import type { PersistedMetaV1 } from "./persistence";

export type AppliedMetaMods = {
  startingGold: number;
  interestCap: number;
  rangeMult: number;
  mergedAsBonus: number;
  benchCapacity: number;
  eraThresholds: EraConfig[];
};

/** XP awarded at run end (defeat). Endless — no victory path. */
export function xpForWavesCleared(wavesCleared: number): number {
  return Math.max(0, Math.floor(wavesCleared)) * XP_PER_WAVE_CLEARED;
}

/** Build run modifiers from owned skills (applied only at new-run start). */
export function buildMetaApplied(skills: SkillId[]): AppliedMetaMods {
  const owned = new Set(skills);
  const eraThresholds = owned.has("veterancy")
    ? withVeterancy(ERA_CONFIGS)
    : ERA_CONFIGS.map((e) => ({ ...e, shopOdds: { ...e.shopOdds } }));

  return {
    startingGold: owned.has("deep_pockets") ? STARTING_GOLD + 5 : STARTING_GOLD,
    interestCap: owned.has("interest_rate_cap")
      ? INTEREST_CAP_SKILL
      : INTEREST_CAP_DEFAULT,
    rangeMult: owned.has("master_mason") ? 1.15 : 1,
    mergedAsBonus: owned.has("quick_assembly") ? 0.1 : 0,
    benchCapacity: owned.has("reinforcements")
      ? DEFAULT_BENCH_CAPACITY + 1
      : DEFAULT_BENCH_CAPACITY,
    eraThresholds,
  };
}

export function awardRunXp(
  meta: PersistedMetaV1,
  wavesCleared: number,
): { meta: PersistedMetaV1; xpGained: number } {
  const xpGained = xpForWavesCleared(wavesCleared);
  return {
    xpGained,
    meta: {
      ...meta,
      commanderXp: meta.commanderXp + xpGained,
    },
  };
}

/** XP already spent on unlocked skills. */
export function spentXp(meta: Pick<MetaState, "unlockedSkills">): number {
  return meta.unlockedSkills.reduce((sum, id) => {
    const def = getSkillDef(id);
    return sum + (def?.xpCost ?? 0);
  }, 0);
}

/** Unspent XP available for unlocks. */
export function availableXp(meta: PersistedMetaV1): number {
  return Math.max(0, meta.commanderXp - spentXp(meta));
}

export function canUnlockSkill(
  meta: PersistedMetaV1,
  skillId: SkillId,
): { ok: true } | { ok: false; reason: string } {
  if (meta.unlockedSkills.includes(skillId)) {
    return { ok: false, reason: "already_unlocked" };
  }
  const def = getSkillDef(skillId);
  if (!def) return { ok: false, reason: "unknown_skill" };
  if (availableXp(meta) < def.xpCost) {
    return { ok: false, reason: "insufficient_xp" };
  }
  return { ok: true };
}

export function unlockSkill(
  meta: PersistedMetaV1,
  skillId: SkillId,
): { ok: true; meta: PersistedMetaV1 } | { ok: false; reason: string } {
  const check = canUnlockSkill(meta, skillId);
  if (!check.ok) return check;
  return {
    ok: true,
    meta: {
      ...meta,
      unlockedSkills: [...meta.unlockedSkills, skillId],
    },
  };
}

/** Merge unit ids into codex; returns whether anything changed. */
export function unlockCodexEntries(
  meta: PersistedMetaV1,
  unitIds: string[],
): { meta: PersistedMetaV1; changed: boolean } {
  const set = new Set(meta.codexUnlocked);
  let changed = false;
  for (const id of unitIds) {
    if (!id || set.has(id)) continue;
    set.add(id);
    changed = true;
  }
  if (!changed) return { meta, changed: false };
  return {
    changed: true,
    meta: {
      ...meta,
      codexUnlocked: [...set].sort(),
    },
  };
}

export function skillUnlockOrder(): SkillId[] {
  return SKILL_DEFS.map((s) => s.id);
}
