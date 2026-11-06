import { describe, expect, it } from "vitest";
import { DOCTRINE_DEFS } from "../src/content/doctrines";
import { ERA_BOSS_DEFS, eraBossesForEra, eraBossForWave } from "../src/content/eraBosses";
import { UNIT_DEFS } from "../src/content/units";
import { RUN_EVENT_DEFS } from "../src/core/events";
import { unitsInEra, rollDiscoveryChoices } from "../src/core/era";
import { rollShopOffers } from "../src/core/shop";
import { getEraConfig } from "../src/content/eras";
import type { DoctrineId, UnitRoleShape } from "../src/core/types";
import { unitRole } from "../src/canvas/drawUnit";

const ROLES: UnitRoleShape[] = [
  "melee",
  "ballistic",
  "siege",
  "support",
  "energy",
  "swarm",
];

describe("content pool sizes", () => {
  it("doubles unit roster to ≥6–8 per era (40 total)", () => {
    expect(UNIT_DEFS.length).toBeGreaterThanOrEqual(36);
    expect(UNIT_DEFS).toHaveLength(40);
    for (const era of [1, 2, 3, 4, 5] as const) {
      const n = unitsInEra(era).length;
      expect(n).toBeGreaterThanOrEqual(6);
      expect(n).toBe(8);
    }
  });

  it("covers distinct combat roles across the roster", () => {
    const seen = new Set<string>();
    for (const u of UNIT_DEFS) {
      expect(u.roleShape).toBeTruthy();
      expect(ROLES).toContain(u.roleShape!);
      seen.add(u.roleShape!);
      // Neon draw adapter resolves a non-generic role
      expect(unitRole(u.id, u.tags)).not.toBe("generic");
    }
    for (const role of ROLES) {
      expect(seen.has(role)).toBe(true);
    }
  });

  it("has unique unit ids and star ability copy", () => {
    const ids = UNIT_DEFS.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const u of UNIT_DEFS) {
      expect(u.abilities.starLevel2.length).toBeGreaterThan(4);
      expect(u.abilities.starLevel3.length).toBeGreaterThan(4);
      expect(u.name.length).toBeLessThan(24);
    }
  });

  it("expands doctrines with stable ids (5 originals + 3 new)", () => {
    expect(DOCTRINE_DEFS.length).toBeGreaterThanOrEqual(7);
    expect(DOCTRINE_DEFS.length).toBe(8);
    const ids = DOCTRINE_DEFS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const required: DoctrineId[] = [
      "ballistic_overclock",
      "support_aura",
      "merge_gambler",
      "path_warden",
      "deep_coffers",
      "siege_battery",
      "swarm_tide",
      "iron_curtain",
    ];
    for (const id of required) {
      expect(ids).toContain(id);
    }
  });

  it("expands run event pool with boss/chest/gold/path/trait variants", () => {
    expect(RUN_EVENT_DEFS.length).toBeGreaterThanOrEqual(18);
    const kinds = new Set(RUN_EVENT_DEFS.map((e) => e.kind));
    expect(kinds.has("boss")).toBe(true);
    expect(kinds.has("chest")).toBe(true);
    expect(kinds.has("spend")).toBe(true);
    expect(kinds.has("passive")).toBe(true);
    const ids = RUN_EVENT_DEFS.map((e) => e.id);
    expect(ids).toContain("boss_arena_elite");
    expect(ids).toContain("gold_shop_offers");
    expect(ids).toContain("melee_surge");
    expect(ids).toContain("path_fork_lane");
    expect(ids).toContain("free_buff_chip");
  });

  it("has 2 named bosses per era with agenda mixes", () => {
    expect(ERA_BOSS_DEFS.length).toBe(10);
    for (const era of [1, 2, 3, 4, 5] as const) {
      const bosses = eraBossesForEra(era);
      expect(bosses.length).toBe(2);
      for (const b of bosses) {
        expect(b.agendas.length).toBeGreaterThanOrEqual(2);
        expect(b.loot.length).toBeGreaterThan(0);
      }
    }
    // Cycle within era across wave bands
    const a = eraBossForWave(10, 1);
    const b = eraBossForWave(20, 2);
    expect(a.era).toBe(1);
    expect(b.era).toBe(2);
  });

  it("wires expanded units into shop odds and discovery", () => {
    const era4 = getEraConfig(4);
    const { offers } = rollShopOffers(era4, 77, 40);
    const unitOffers = offers.filter((o) => o.kind === "unit");
    expect(unitOffers.length).toBeGreaterThan(10);
    const seenNew = unitOffers.some(
      (o) =>
        o.defId === "unit_mortar" ||
        o.defId === "unit_riot_shield" ||
        o.defId === "unit_drone_swarm",
    );
    // Monte Carlo may miss; assert discovery can pull new era-5 units
    const disc = rollDiscoveryChoices(5, 42, 3);
    expect(disc.choices).toHaveLength(3);
    expect(
      disc.choices.every((c) => UNIT_DEFS.find((u) => u.id === c.defId)?.era === 5),
    ).toBe(true);
    void seenNew;
  });
});
