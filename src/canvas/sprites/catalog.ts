/**
 * Sprite catalog — maps content ids → recipe ids + fallback chains.
 * Content PRs can add units without art; resolve falls back to role/era kits.
 */

import { getUnitDef } from "../../content/units";
import { unitRole, type UnitRole } from "../unitRole";
import type { SpriteAnim, SpriteKind } from "./types";

/** Known handcrafted unit recipe ids (Era 1 full roster). */
export const UNIQUE_UNIT_SPRITES = new Set([
  "unit_slinger",
  "unit_spearman",
  "unit_tribe_drummer",
  "unit_boulder_roll",
]);

/** Known creep recipe ids. */
export const UNIQUE_CREEP_SPRITES = new Set([
  "creep_runner",
  "creep_grunt",
  "creep_tank",
  "creep_swarm",
  "creep_boss",
]);

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
 * Ordered candidate recipe ids for a creep draw.
 */
export function creepSpriteCandidates(
  defId: string,
  isBoss = false,
): { recipeId: string; anim: SpriteAnim }[] {
  const out: { recipeId: string; anim: SpriteAnim }[] = [];
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
  return UNIQUE_CREEP_SPRITES.has(defId) ? "unique" : "fallback";
}
