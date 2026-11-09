/**
 * Sprite pipeline public API — adapters import from here.
 *
 * Layout:
 *   src/canvas/sprites/           runtime atlas + resolve
 *   src/canvas/sprites/recipes/   paint functions (procedural → cached bitmaps)
 *   public/sprites/               optional PNG drops (see README)
 */

export {
  ensureSpriteAtlas,
  resetSpriteAtlasForTests,
  resolveUnitFrame,
  resolveCreepFrame,
  resolveFxFrame,
  resolveUnitRecipeId,
  resolveCreepRecipeId,
  drawBakedFrame,
  listRecipeIds,
  getBakedFrame,
  hasRecipe,
} from "./atlas";
export {
  UNIQUE_UNIT_SPRITES,
  UNIQUE_CREEP_SPRITES,
  UNIQUE_BOSS_SPRITES,
  unitSpriteCandidates,
  creepSpriteCandidates,
  unitArtCoverage,
  creepArtCoverage,
  rosterUniqueCoverage,
  frameKey,
  roleEraKey,
} from "./catalog";
export {
  projectileRecipeId,
  hitFxRecipeId,
  type ProjectileFamily,
} from "./recipes/projectiles";
export type { SpriteAnim, BakedFrame, SpriteRecipe } from "./types";
export { SPRITE_LOGICAL_SIZE, SPRITE_BAKE_SCALE } from "./types";
export { paintUnitPortrait } from "./paintPortrait";
