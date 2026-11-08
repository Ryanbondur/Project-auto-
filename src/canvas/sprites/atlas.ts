/**
 * Runtime sprite atlas — bakes recipe canvases once, resolves with fallbacks.
 * No GPU / WebGL. Safe in headless Chromium; node tests hit resolve only.
 */

import { creepSpriteCandidates, frameKey, unitSpriteCandidates } from "./catalog";
import { buildBossRecipes } from "./recipes/bosses";
import { buildCreepRecipes } from "./recipes/creeps";
import { buildProjectileRecipes } from "./recipes/projectiles";
import { buildUnitRecipes } from "./recipes/units";
import {
  SPRITE_BAKE_SCALE,
  SPRITE_LOGICAL_SIZE,
  type BakedFrame,
  type SpriteAnim,
  type SpriteRecipe,
} from "./types";

const bakePx = SPRITE_LOGICAL_SIZE * SPRITE_BAKE_SCALE;

type AtlasState = {
  ready: boolean;
  frames: Map<string, BakedFrame>;
  recipes: Map<string, SpriteRecipe>;
};

const state: AtlasState = {
  ready: false,
  frames: new Map(),
  recipes: new Map(),
};

function canBake(): boolean {
  return typeof document !== "undefined" && typeof document.createElement === "function";
}

function bakeRecipe(recipe: SpriteRecipe): void {
  for (const anim of recipe.anims) {
    const canvas = document.createElement("canvas");
    canvas.width = bakePx;
    canvas.height = bakePx;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    recipe.paint(ctx, bakePx, anim);
    const key = frameKey(recipe.kind, recipe.id, anim);
    state.frames.set(key, {
      key,
      source: canvas,
      sx: 0,
      sy: 0,
      sw: bakePx,
      sh: bakePx,
      drawScale: recipe.drawScale,
    });
  }
}

function allRecipes(): SpriteRecipe[] {
  return [
    ...buildUnitRecipes(),
    ...buildCreepRecipes(),
    ...buildBossRecipes(),
    ...buildProjectileRecipes(),
  ];
}

/** Idempotent — call from first board paint or app boot. */
export function ensureSpriteAtlas(): void {
  if (state.ready) return;
  const recipes = allRecipes();
  for (const r of recipes) state.recipes.set(r.id, r);
  if (canBake()) {
    for (const r of recipes) bakeRecipe(r);
  }
  state.ready = true;
}

/** Test / debug: force re-bake (browser only). */
export function resetSpriteAtlasForTests(): void {
  state.ready = false;
  state.frames.clear();
  state.recipes.clear();
}

export function getBakedFrame(key: string): BakedFrame | undefined {
  ensureSpriteAtlas();
  return state.frames.get(key);
}

export function hasRecipe(id: string): boolean {
  ensureSpriteAtlas();
  return state.recipes.has(id);
}

/**
 * First drawable frame for a unit, following role/era fallbacks.
 * Returns null when canvas bake is unavailable (node tests) or no recipe matches.
 */
export function resolveUnitFrame(
  defId: string,
  anim: SpriteAnim,
  eraHint?: number,
): BakedFrame | null {
  ensureSpriteAtlas();
  for (const c of unitSpriteCandidates(defId, anim, eraHint)) {
    const frame = state.frames.get(frameKey("unit", c.recipeId, c.anim));
    if (frame?.source) return frame;
  }
  return null;
}

/** First drawable creep / era-boss frame; null → procedural silhouette. */
export function resolveCreepFrame(
  defId: string,
  isBoss = false,
  eraBossId?: string | null,
): BakedFrame | null {
  ensureSpriteAtlas();
  for (const c of creepSpriteCandidates(defId, isBoss, eraBossId)) {
    const frame = state.frames.get(frameKey("creep", c.recipeId, c.anim));
    if (frame?.source) return frame;
  }
  return null;
}

/** Projectile / FX frame by recipe id. */
export function resolveFxFrame(
  recipeId: string,
  anim: SpriteAnim = "idle",
  kind: "projectile" | "fx" = "projectile",
): BakedFrame | null {
  ensureSpriteAtlas();
  const frame = state.frames.get(frameKey(kind, recipeId, anim));
  if (frame?.source) return frame;
  if (anim === "fire") {
    const idle = state.frames.get(frameKey(kind, recipeId, "idle"));
    if (idle?.source) return idle;
  }
  return null;
}

/** Pure coverage helper for tests — does a recipe exist for this candidate? */
export function resolveUnitRecipeId(
  defId: string,
  anim: SpriteAnim,
  eraHint?: number,
): string | null {
  ensureSpriteAtlas();
  for (const c of unitSpriteCandidates(defId, anim, eraHint)) {
    if (state.recipes.has(c.recipeId)) return c.recipeId;
  }
  return null;
}

export function resolveCreepRecipeId(
  defId: string,
  isBoss = false,
  eraBossId?: string | null,
): string | null {
  ensureSpriteAtlas();
  for (const c of creepSpriteCandidates(defId, isBoss, eraBossId)) {
    if (state.recipes.has(c.recipeId)) return c.recipeId;
  }
  return null;
}

/** Draw a baked frame centered at (cx, cy) facing `rotation` radians. */
export function drawBakedFrame(
  ctx: CanvasRenderingContext2D,
  frame: BakedFrame,
  cx: number,
  cy: number,
  tileSize: number,
  rotation = 0,
  scaleMul = 1,
): void {
  if (!frame.source) return;
  const size = tileSize * frame.drawScale * scaleMul;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.drawImage(
    frame.source,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    -size / 2,
    -size / 2,
    size,
    size,
  );
  ctx.restore();
}

export function listRecipeIds(): string[] {
  ensureSpriteAtlas();
  return [...state.recipes.keys()].sort();
}
