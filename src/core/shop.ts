import { SHOP_SIZE } from "./constants";
import { UNIT_DEFS, getUnitDef } from "../content/units";
import { BUFF_CHIP_DEFS, getBuffChipDef } from "../content/buffChips";
import { PATH_SABOTAGE_DEFS, getPathSabotageDef } from "../content/pathSabotage";
import { createRng } from "./rng";
import type { EraConfig, ShopOffer, ShopOfferKind, ShopState } from "./types";

function unitsForEra(era: 1 | 2 | 3 | 4 | 5) {
  return UNIT_DEFS.filter((u) => u.era === era);
}

function pickWeightedEra(
  odds: EraConfig["shopOdds"],
  rand: () => number,
): 1 | 2 | 3 | 4 | 5 {
  const entries = (
    [
      { era: 1 as const, w: odds.era1 },
      { era: 2 as const, w: odds.era2 },
      { era: 3 as const, w: odds.era3 },
      { era: 4 as const, w: odds.era4 },
      { era: 5 as const, w: odds.era5 },
    ] as { era: 1 | 2 | 3 | 4 | 5; w: number }[]
  ).filter((e) => e.w > 0);

  if (entries.length === 0) return 1;
  const total = entries.reduce((s, e) => s + e.w, 0);
  let roll = rand() * total;
  for (const e of entries) {
    roll -= e.w;
    if (roll <= 0) return e.era;
  }
  return entries[entries.length - 1]!.era;
}

function pickUnitOffer(
  eraConfig: EraConfig,
  rand: () => number,
  slotIndex: number,
): ShopOffer {
  const era = pickWeightedEra(eraConfig.shopOdds, rand);
  let pool = unitsForEra(era);
  if (pool.length === 0) pool = unitsForEra(1);
  if (pool.length === 0) pool = UNIT_DEFS;
  const def = pool[Math.floor(rand() * pool.length)] ?? UNIT_DEFS[0]!;
  return {
    slotIndex,
    kind: "unit",
    defId: def.id,
    cost: def.cost,
    purchased: false,
  };
}

/**
 * Roll shop offers. Phase 2: mostly units; ~15% chance a slot is a buff chip;
 * ~3% chance path sabotage (rare). Flat era-1 pool is fine until Phase 4 weighting
 * is playtested — still uses eraConfig.shopOdds when provided.
 */
export function rollShopOffers(
  eraConfig: EraConfig,
  seed: number,
  size: number = SHOP_SIZE,
): { offers: ShopOffer[]; nextSeed: number } {
  const rand = createRng(seed);
  const offers: ShopOffer[] = [];

  for (let i = 0; i < size; i++) {
    const roll = rand();
    let kind: ShopOfferKind = "unit";
    if (roll < 0.03 && PATH_SABOTAGE_DEFS.length > 0) {
      kind = "path_sabotage";
    } else if (roll < 0.18 && BUFF_CHIP_DEFS.length > 0) {
      kind = "buff_chip";
    }

    if (kind === "buff_chip") {
      const def =
        BUFF_CHIP_DEFS[Math.floor(rand() * BUFF_CHIP_DEFS.length)] ??
        BUFF_CHIP_DEFS[0]!;
      offers.push({
        slotIndex: i,
        kind: "buff_chip",
        defId: def.id,
        cost: def.cost,
        purchased: false,
      });
    } else if (kind === "path_sabotage") {
      const def =
        PATH_SABOTAGE_DEFS[Math.floor(rand() * PATH_SABOTAGE_DEFS.length)] ??
        PATH_SABOTAGE_DEFS[0]!;
      offers.push({
        slotIndex: i,
        kind: "path_sabotage",
        defId: def.id,
        cost: def.cost,
        purchased: false,
      });
    } else {
      offers.push(pickUnitOffer(eraConfig, rand, i));
    }
  }

  // Advance seed with one more draw so successive rolls diverge
  const nextSeed = (seed + 1 + Math.floor(rand() * 1e9)) >>> 0;
  return { offers, nextSeed };
}

export function createShopState(
  eraConfig: EraConfig,
  seed: number,
): { shop: ShopState; nextSeed: number } {
  const { offers, nextSeed } = rollShopOffers(eraConfig, seed);
  return {
    shop: { offers, rerollCost: 1 },
    nextSeed,
  };
}

export function offerLabel(offer: ShopOffer): string {
  if (offer.kind === "unit") {
    return getUnitDef(offer.defId)?.name ?? offer.defId;
  }
  if (offer.kind === "buff_chip") {
    return getBuffChipDef(offer.defId)?.name ?? offer.defId;
  }
  return getPathSabotageDef(offer.defId)?.name ?? offer.defId;
}
