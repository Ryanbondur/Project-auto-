import { describe, expect, it } from "vitest";
import { getEraConfig } from "../src/content/eras";
import { UNIT_DEFS } from "../src/content/units";
import { createRng } from "../src/core/rng";
import { pickWeightedEra, rollShopOffers } from "../src/core/shop";

describe("era-weighted shop odds", () => {
  it("skips zero-weight eras", () => {
    const rand = createRng(1);
    const era1 = getEraConfig(1).shopOdds;
    for (let i = 0; i < 40; i++) {
      expect(pickWeightedEra(era1, rand)).toBe(1);
    }
  });

  it("matches era-2 weights within tolerance (Monte Carlo)", () => {
    const odds = getEraConfig(2).shopOdds;
    const rand = createRng(99);
    const n = 8000;
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let i = 0; i < n; i++) {
      counts[pickWeightedEra(odds, rand)]! += 1;
    }
    const p1 = counts[1]! / n;
    const p2 = counts[2]! / n;
    expect(p1).toBeGreaterThan(0.26);
    expect(p1).toBeLessThan(0.34);
    expect(p2).toBeGreaterThan(0.66);
    expect(p2).toBeLessThan(0.74);
    expect(counts[3]).toBe(0);
  });

  it("rolls unit offers only from eras with positive weight", () => {
    const era = getEraConfig(4);
    const { offers } = rollShopOffers(era, 4242, 60);
    const unitOffers = offers.filter((o) => o.kind === "unit");
    expect(unitOffers.length).toBeGreaterThan(20);
    for (const offer of unitOffers) {
      const def = UNIT_DEFS.find((u) => u.id === offer.defId);
      expect(def).toBeTruthy();
      // Era 4 odds: e2 0.1, e3 0.3, e4 0.6 — never e1/e5
      expect([2, 3, 4]).toContain(def!.era);
    }
  });
});
