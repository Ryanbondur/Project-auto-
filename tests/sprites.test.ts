/**
 * Sprite catalog / fallback tests — no GPU, no canvas bake required.
 */
import { describe, expect, it } from "vitest";
import { UNIT_DEFS } from "../src/content/units";
import { CREEP_DEFS } from "../src/content/creeps";
import { ERA_BOSS_DEFS } from "../src/content/eraBosses";
import {
  creepArtCoverage,
  creepSpriteCandidates,
  ensureSpriteAtlas,
  hasRecipe,
  listRecipeIds,
  resetSpriteAtlasForTests,
  resolveCreepRecipeId,
  resolveUnitRecipeId,
  rosterUniqueCoverage,
  UNIQUE_BOSS_SPRITES,
  UNIQUE_CREEP_SPRITES,
  UNIQUE_UNIT_SPRITES,
  unitArtCoverage,
  unitSpriteCandidates,
} from "../src/canvas/sprites";

describe("sprite catalog", () => {
  it("covers every catalog unit with a unique sprite", () => {
    for (const u of UNIT_DEFS) {
      expect(UNIQUE_UNIT_SPRITES.has(u.id), u.id).toBe(true);
      expect(unitArtCoverage(u.id), u.id).toBe("unique");
    }
    const { missingUnits } = rosterUniqueCoverage();
    expect(missingUnits).toEqual([]);
  });

  it("covers common creeps + catalog boss uniquely", () => {
    for (const id of [
      "creep_runner",
      "creep_grunt",
      "creep_tank",
      "creep_swarm",
      "creep_boss",
    ]) {
      expect(UNIQUE_CREEP_SPRITES.has(id)).toBe(true);
      expect(creepArtCoverage(id)).toBe("unique");
    }
  });

  it("covers every named era boss uniquely", () => {
    for (const b of ERA_BOSS_DEFS) {
      expect(UNIQUE_BOSS_SPRITES.has(b.id), b.id).toBe(true);
      expect(creepArtCoverage(b.id), b.id).toBe("unique");
    }
    const { missingBosses } = rosterUniqueCoverage();
    expect(missingBosses).toEqual([]);
  });

  it("resolves every catalog unit to its unique recipe", () => {
    resetSpriteAtlasForTests();
    ensureSpriteAtlas();
    for (const u of UNIT_DEFS) {
      const recipe = resolveUnitRecipeId(u.id, "idle", u.era);
      expect(recipe, u.id).toBe(u.id);
      expect(hasRecipe(recipe!)).toBe(true);
      const fire = resolveUnitRecipeId(u.id, "fire", u.era);
      expect(fire, `${u.id} fire`).toBe(u.id);
    }
  });

  it("resolves every catalog creep to a recipe", () => {
    resetSpriteAtlasForTests();
    ensureSpriteAtlas();
    for (const c of CREEP_DEFS) {
      const recipe = resolveCreepRecipeId(c.id, c.isBoss);
      expect(recipe, c.id).toBe(c.id);
      expect(hasRecipe(recipe!)).toBe(true);
    }
  });

  it("resolves era bosses via eraBossId while defId stays creep_boss", () => {
    resetSpriteAtlasForTests();
    ensureSpriteAtlas();
    for (const b of ERA_BOSS_DEFS) {
      const recipe = resolveCreepRecipeId("creep_boss", true, b.id);
      expect(recipe, b.id).toBe(b.id);
      expect(hasRecipe(recipe!)).toBe(true);
    }
  });

  it("unknown unit falls back to role/generic kit without throwing", () => {
    resetSpriteAtlasForTests();
    ensureSpriteAtlas();
    const recipe = resolveUnitRecipeId("unit_brand_new_content", "idle", 3);
    expect(recipe).toBeTruthy();
    expect(recipe!.startsWith("role:")).toBe(true);
    expect(unitArtCoverage("unit_brand_new_content")).toBe("fallback");
  });

  it("unknown creep falls back to grunt/generic", () => {
    const candidates = creepSpriteCandidates("creep_future_elite", false);
    expect(candidates.some((c) => c.recipeId === "creep_grunt")).toBe(true);
    expect(resolveCreepRecipeId("creep_future_elite")).toBeTruthy();
  });

  it("unit candidates prefer unique then role:era", () => {
    const c = unitSpriteCandidates("unit_slinger", "fire", 1);
    expect(c[0]).toEqual({ recipeId: "unit_slinger", anim: "fire" });
    expect(c.some((x) => x.recipeId === "role:ballistic:era:1")).toBe(true);
  });

  it("lists baked recipe ids including era kits, bosses, projectiles", () => {
    resetSpriteAtlasForTests();
    const ids = listRecipeIds();
    expect(ids).toContain("unit_slinger");
    expect(ids).toContain("unit_rail_turret");
    expect(ids).toContain("creep_boss");
    expect(ids).toContain("boss_glitch_sovereign");
    expect(ids).toContain("role:siege:era:4");
    expect(ids).toContain("proj_ballistic");
    expect(ids).toContain("fx_hit_magenta");
  });
});
