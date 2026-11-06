/**
 * Sprite catalog / fallback tests — no GPU, no canvas bake required.
 */
import { describe, expect, it } from "vitest";
import { UNIT_DEFS } from "../src/content/units";
import { CREEP_DEFS } from "../src/content/creeps";
import {
  creepArtCoverage,
  creepSpriteCandidates,
  ensureSpriteAtlas,
  hasRecipe,
  listRecipeIds,
  resetSpriteAtlasForTests,
  resolveCreepRecipeId,
  resolveUnitRecipeId,
  UNIQUE_CREEP_SPRITES,
  UNIQUE_UNIT_SPRITES,
  unitArtCoverage,
  unitSpriteCandidates,
} from "../src/canvas/sprites";

describe("sprite catalog", () => {
  it("covers Era 1 roster with unique sprites", () => {
    for (const id of [
      "unit_slinger",
      "unit_spearman",
      "unit_tribe_drummer",
      "unit_boulder_roll",
    ]) {
      expect(UNIQUE_UNIT_SPRITES.has(id)).toBe(true);
      expect(unitArtCoverage(id)).toBe("unique");
    }
  });

  it("covers common creeps + boss uniquely", () => {
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

  it("resolves every catalog unit to a recipe (role/era fallback)", () => {
    resetSpriteAtlasForTests();
    ensureSpriteAtlas();
    for (const u of UNIT_DEFS) {
      const recipe = resolveUnitRecipeId(u.id, "idle", u.era);
      expect(recipe, u.id).toBeTruthy();
      expect(hasRecipe(recipe!)).toBe(true);
      const fire = resolveUnitRecipeId(u.id, "fire", u.era);
      expect(fire, `${u.id} fire`).toBeTruthy();
    }
  });

  it("resolves every catalog creep to a recipe", () => {
    resetSpriteAtlasForTests();
    ensureSpriteAtlas();
    for (const c of CREEP_DEFS) {
      const recipe = resolveCreepRecipeId(c.id, c.isBoss);
      expect(recipe, c.id).toBeTruthy();
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

  it("lists baked recipe ids including era kits", () => {
    resetSpriteAtlasForTests();
    const ids = listRecipeIds();
    expect(ids).toContain("unit_slinger");
    expect(ids).toContain("creep_boss");
    expect(ids).toContain("role:siege:era:4");
  });
});
