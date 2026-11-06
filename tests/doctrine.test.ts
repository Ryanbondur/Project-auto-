import { describe, expect, it } from "vitest";
import { DOCTRINE_DEFS } from "../src/content/doctrines";
import {
  DOCTRINE_COFFERS_GOLD,
  DOCTRINE_WARDEN_SLOW_WAVES,
  applyDoctrineToRun,
  doctrineBallisticAsBonus,
  doctrineChipChanceBonus,
  doctrineInterestBonus,
  doctrineMergeGold,
  doctrineSabotageCost,
} from "../src/core/doctrine";
import { createInitialRunState, createStore } from "../src/core/store";
import { rollShopOffers } from "../src/core/shop";
import { getEraConfig } from "../src/content/eras";

describe("commander doctrine", () => {
  it("catalog has 5–8 doctrines with unique ids", () => {
    expect(DOCTRINE_DEFS.length).toBeGreaterThanOrEqual(5);
    expect(DOCTRINE_DEFS.length).toBeLessThanOrEqual(8);
    expect(new Set(DOCTRINE_DEFS.map((d) => d.id)).size).toBe(DOCTRINE_DEFS.length);
  });

  it("Iron Curtain grants slot + leak brace; Siege Battery biases shop", () => {
    const state = createInitialRunState(3, [], { doctrineId: "iron_curtain" });
    expect(state.doctrineId).toBe("iron_curtain");
    expect(state.modifiers.boardSlotsBonus).toBeGreaterThanOrEqual(1);
    expect(state.modifiers.leakDamageReduction).toBeGreaterThanOrEqual(1);
    const era = getEraConfig(3);
    let siege = 0;
    let total = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { offers } = rollShopOffers(era, seed, 3, "siege_battery");
      for (const o of offers) {
        if (o.kind !== "unit") continue;
        total += 1;
        if (
          o.defId.includes("cannon") ||
          o.defId.includes("sapper") ||
          o.defId.includes("boulder") ||
          o.defId.includes("catapult") ||
          o.defId.includes("rpg") ||
          o.defId.includes("mortar") ||
          o.defId.includes("rail")
        ) {
          siege += 1;
        }
      }
    }
    expect(total).toBeGreaterThan(0);
    expect(siege / total).toBeGreaterThan(0.12);
  });

  it("applies Path Warden mid-path slow and sabotage discount", () => {
    const state = createInitialRunState(7);
    applyDoctrineToRun(state, "path_warden", 5);
    expect(state.doctrineId).toBe("path_warden");
    expect(state.modifiers.pathSlow?.pathIndex).toBe(5);
    expect(state.modifiers.pathSlow?.wavesRemaining).toBe(
      DOCTRINE_WARDEN_SLOW_WAVES,
    );
    expect(doctrineSabotageCost(4, "path_warden")).toBe(3);
    expect(doctrineSabotageCost(4, null)).toBe(4);
  });

  it("Deep Coffers grants gold + interest; Merge Gambler pays on merge", () => {
    const state = createInitialRunState(3, [], { doctrineId: "deep_coffers" });
    expect(state.doctrineId).toBe("deep_coffers");
    expect(state.gold).toBeGreaterThanOrEqual(10 + DOCTRINE_COFFERS_GOLD);
    expect(doctrineInterestBonus("deep_coffers")).toBe(1);
    expect(doctrineMergeGold("merge_gambler")).toBe(2);
    expect(doctrineChipChanceBonus("merge_gambler")).toBeGreaterThan(0);
  });

  it("Ballistic Overclock biases shop toward Ballistic tags", () => {
    const era = getEraConfig(1);
    let ballistic = 0;
    let total = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const { offers } = rollShopOffers(era, seed, 3, "ballistic_overclock");
      for (const o of offers) {
        if (o.kind !== "unit") continue;
        total += 1;
        if (
          o.defId.includes("slinger") ||
          o.defId.includes("archer") ||
          o.defId.includes("musket") ||
          o.defId.includes("gatling") ||
          o.defId.includes("m16") ||
          o.defId.includes("sniper")
        ) {
          ballistic += 1;
        }
      }
    }
    const { offers: plain } = rollShopOffers(era, 1, 3, null);
    expect(plain).toHaveLength(3);
    expect(total).toBeGreaterThan(0);
    // Biased pool should land Ballistic often in era-1 (slinger is ballistic)
    expect(ballistic / total).toBeGreaterThan(0.15);
    expect(doctrineBallisticAsBonus("ballistic_overclock")).toBeCloseTo(0.12);
  });

  it("startNewRun persists doctrine on run state", () => {
    const store = createStore(createInitialRunState(1, [], { skipCodexReveal: true }));
    store.startNewRun(99, "support_aura");
    expect(store.getState().doctrineId).toBe("support_aura");
  });
});
