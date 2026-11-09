/**
 * Sprite catalog — maps content ids → recipe ids + fallback chains.
 * Content PRs can add units without art; resolve falls back to role/era kits.
 */

import { UNIT_DEFS, getUnitDef } from "../../content/units";
import { ERA_BOSS_DEFS } from "../../content/eraBosses";
import { unitRole, type UnitRole } from "../unitRole";
import type { SpriteAnim, SpriteKind } from "./types";
import { UNIQUE_UNIT_IDS } from "./recipes/uniqueUnits";
import { UNIQUE_BOSS_IDS } from "./recipes/bosses";

/** Known handcrafted unit recipe ids (full Eras 1–5 roster). */
export const UNIQUE_UNIT_SPRITES = new Set(UNIQUE_UNIT_IDS);

/** Known creep recipe ids. */
export const UNIQUE_CREEP_SPRITES = new Set([
  "creep_runner",
  "creep_grunt",
  "creep_tank",
  "creep_swarm",
  "creep_boss",
]);

/** Named era-boss recipe ids. */
export const UNIQUE_BOSS_SPRITES = new Set(UNIQUE_BOSS_IDS);

export function frameKey(kind: SpriteKind, id: string, anim: SpriteAnim): string {
  return `${kind}:${id}:${anim}`;
}

export function roleEraKey(role: UnitRole, era: number): string {
  const e = Math.min(5, Math.max(1, Math.floor(era)));
  return `role:${role}:era:${e}`;
}

/**
 * Ordered candidate recipe ids for a unit draw.
 * First hit in the atlas wins; empty → procedural silhouette fallback.
 */
export function unitSpriteCandidates(
  defId: string,
  anim: SpriteAnim,
  eraHint?: number,
): { recipeId: string; anim: SpriteAnim }[] {
  const def = getUnitDef(defId);
  const era = (eraHint ?? def?.era ?? 1) as 1 | 2 | 3 | 4 | 5;
  const role = unitRole(defId, def?.tags);
  const out: { recipeId: string; anim: SpriteAnim }[] = [];

  const push = (recipeId: string, a: SpriteAnim) => {
    out.push({ recipeId, anim: a });
  };

  // Exact unique sheet
  if (UNIQUE_UNIT_SPRITES.has(defId)) {
    push(defId, anim);
    if (anim === "fire") push(defId, "idle");
  }

  // Role + era tinted kit
  push(roleEraKey(role, era), anim);
  if (anim === "fire") push(roleEraKey(role, era), "idle");

  // Soften to same role era 1 kit if a future era kit is missing
  if (era !== 1) {
    push(roleEraKey(role, 1), anim);
    if (anim === "fire") push(roleEraKey(role, 1), "idle");
  }

  // Last-resort generic kit
  push(roleEraKey("generic", era), "idle");

  return out;
}

/**
 * Ordered candidate recipe ids for a creep / era-boss draw.
 */
export function creepSpriteCandidates(
  defId: string,
  isBoss = false,
  eraBossId?: string | null,
): { recipeId: string; anim: SpriteAnim }[] {
  const out: { recipeId: string; anim: SpriteAnim }[] = [];
  if (eraBossId && UNIQUE_BOSS_SPRITES.has(eraBossId)) {
    out.push({ recipeId: eraBossId, anim: "idle" });
  }
  if (UNIQUE_BOSS_SPRITES.has(defId)) {
    out.push({ recipeId: defId, anim: "idle" });
  }
  if (UNIQUE_CREEP_SPRITES.has(defId)) {
    out.push({ recipeId: defId, anim: "idle" });
  }
  if (isBoss || defId.includes("boss")) {
    out.push({ recipeId: "creep_boss", anim: "idle" });
  }
  out.push({ recipeId: "creep_grunt", anim: "idle" });
  out.push({ recipeId: "creep:generic", anim: "idle" });
  return out;
}

/** Coverage report helper — which units ship unique vs role-kit art. */
export function unitArtCoverage(defId: string): "unique" | "role-kit" | "fallback" {
  if (UNIQUE_UNIT_SPRITES.has(defId)) return "unique";
  const def = getUnitDef(defId);
  if (def) return "role-kit";
  return "fallback";
}

export function creepArtCoverage(defId: string): "unique" | "fallback" {
  if (UNIQUE_CREEP_SPRITES.has(defId) || UNIQUE_BOSS_SPRITES.has(defId)) {
    return "unique";
  }
  return "fallback";
}

/** Assert catalog content ids all have unique atlas entries (tests). */
export function rosterUniqueCoverage(): {
  missingUnits: string[];
  missingBosses: string[];
} {
  const missingUnits = UNIT_DEFS.map((u) => u.id).filter(
    (id) => !UNIQUE_UNIT_SPRITES.has(id),
  );
  const missingBosses = ERA_BOSS_DEFS.map((b) => b.id).filter(
    (id) => !UNIQUE_BOSS_SPRITES.has(id),
  );
  return { missingUnits, missingBosses };
}
