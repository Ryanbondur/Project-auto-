import {
  SHOP_CHIP_CHANCE,
  SHOP_SABOTAGE_CHANCE,
  SHOP_SIZE,
} from "./constants";
import { UNIT_DEFS, getUnitDef } from "../content/units";
import { BUFF_CHIP_DEFS, getBuffChipDef } from "../content/buffChips";
import { PATH_SABOTAGE_DEFS, getPathSabotageDef } from "../content/pathSabotage";
import {
  DOCTRINE_TAG_SHOP_WEIGHT,
  doctrineChipChanceBonus,
  doctrineSabotageCost,
  doctrineShopBiasTags,
} from "./doctrine";
import { createRng } from "./rng";
import type {
  DoctrineId,
  EraConfig,
  ShopOffer,
  ShopOfferKind,
  ShopState,
} from "./types";

function unitsForEra(era: 1 | 2 | 3 | 4 | 5) {
  return UNIT_DEFS.filter((u) => u.era === era);
}

/** Pick an era bucket by shopOdds weights (zero-weight eras skipped). */
export function pickWeightedEra(
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
  biasTags: string[],
): ShopOffer {
  const era = pickWeightedEra(eraConfig.shopOdds, rand);
  let pool = unitsForEra(era);
  if (pool.length === 0) pool = unitsForEra(1);
  if (pool.length === 0) pool = UNIT_DEFS;
  let def = pool[Math.floor(rand() * pool.length)] ?? UNIT_DEFS[0]!;
  if (biasTags.length > 0 && pool.length > 0) {
    // Weighted resample: doctrine-favored tags get DOCTRINE_TAG_SHOP_WEIGHT.
    const weights = pool.map((u) =>
      u.tags.some((t) => biasTags.includes(t)) ? DOCTRINE_TAG_SHOP_WEIGHT : 1,
    );
    const total = weights.reduce((s, w) => s + w, 0);
    let roll = rand() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) {
        def = pool[i]!;
        break;
      }
    }
  }
  return {
    slotIndex,
    kind: "unit",
    defId: def.id,
    cost: def.cost,
    purchased: false,
  };
}

/**
 * Roll shop offers. Mostly units; buff chips / path sabotage at tunable rates
 * (see SHOP_CHIP_CHANCE / SHOP_SABOTAGE_CHANCE). Unit offers sample era via
 * shopOdds, then uniform unit among defs of that era.
 */
export function rollShopOffers(
  eraConfig: EraConfig,
  seed: number,
  size: number = SHOP_SIZE,
  doctrineId: DoctrineId | null = null,
): { offers: ShopOffer[]; nextSeed: number } {
  const rand = createRng(seed);
  const offers: ShopOffer[] = [];
  const chipChance = SHOP_CHIP_CHANCE + doctrineChipChanceBonus(doctrineId);
  const biasTags = doctrineShopBiasTags(doctrineId);

  for (let i = 0; i < size; i++) {
    const roll = rand();
    let kind: ShopOfferKind = "unit";
    if (roll < SHOP_SABOTAGE_CHANCE && PATH_SABOTAGE_DEFS.length > 0) {
      kind = "path_sabotage";
    } else if (
      roll < SHOP_SABOTAGE_CHANCE + chipChance &&
      BUFF_CHIP_DEFS.length > 0
    ) {
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
        cost: doctrineSabotageCost(def.cost, doctrineId),
        purchased: false,
      });
    } else {
      offers.push(pickUnitOffer(eraConfig, rand, i, biasTags));
    }
  }

  // Advance seed with one more draw so successive rolls diverge
  const nextSeed = (seed + 1 + Math.floor(rand() * 1e9)) >>> 0;
  return { offers, nextSeed };
}

export function createShopState(
  eraConfig: EraConfig,
  seed: number,
  size: number = SHOP_SIZE,
  doctrineId: DoctrineId | null = null,
): { shop: ShopState; nextSeed: number } {
  const { offers, nextSeed } = rollShopOffers(
    eraConfig,
    seed,
    size,
    doctrineId,
  );
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
