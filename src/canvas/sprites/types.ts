/**
 * Sprite atlas types — thin layer above draw adapters.
 * Combat stays art-blind; missing frames resolve via role/era fallbacks.
 */

export type SpriteAnim = "idle" | "fire";

export type SpriteKind = "unit" | "creep" | "projectile" | "fx";

/** Logical frame size in CSS pixels (drawn at tile scale). */
export const SPRITE_LOGICAL_SIZE = 64;

/** Bake scale for crisp phone retina (~2×). */
export const SPRITE_BAKE_SCALE = 2;

export type SpriteFrameKey = {
  kind: SpriteKind;
  /** Unit defId, creep/boss defId, projectile family, or fx id. */
  id: string;
  anim: SpriteAnim;
};

export type BakedFrame = {
  key: string;
  /** Canvas or ImageBitmap — drawImage compatible. */
  source: CanvasImageSource;
  /** Source rect inside atlas / canvas. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Preferred on-screen size relative to tile (≤0.85 units, ≤0.7 creeps). */
  drawScale: number;
};

export type SpriteRecipe = {
  id: string;
  kind: SpriteKind;
  anims: SpriteAnim[];
  drawScale: number;
  /**
   * Draw into a cleared square canvas (origin top-left, size = bakePx).
   * Center the silhouette; leave transparent outside the body.
   */
  paint: (
    ctx: CanvasRenderingContext2D,
    bakePx: number,
    anim: SpriteAnim,
  ) => void;
};
