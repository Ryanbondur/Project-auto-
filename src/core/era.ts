import { UNIT_DEFS } from "../content/units";
import { createRng } from "./rng";
import type { EraConfig } from "./types";

export type EraId = 1 | 2 | 3 | 4 | 5;

export type DiscoveryChoice = {
  defId: string;
  /** Always 2★ for Era Discovery rewards. */
  starLevel: 2;
};

export type DiscoveryState = {
  /** Newly unlocked era the player is entering. */
  newEra: EraId;
  choices: DiscoveryChoice[];
};

/** Resolve which era a wave number belongs to from a (possibly Veterancy-adjusted) table. */
export function eraForWave(
  waveNumber: number,
  thresholds: EraConfig[],
): EraId {
  const sorted = [...thresholds].sort((a, b) => a.era - b.era);
  for (const cfg of sorted) {
    const [lo, hi] = cfg.waveRange;
    if (waveNumber >= lo && waveNumber <= hi) {
      return cfg.era;
    }
  }
  // Past the last band → stay on highest configured era
  const last = sorted[sorted.length - 1];
  return last?.era ?? 1;
}

/** True when the upcoming wave belongs to a higher era than `currentEra`. */
export function shouldAdvanceEra(
  currentEra: EraId,
  nextWaveNumber: number,
  thresholds: EraConfig[],
): boolean {
  return eraForWave(nextWaveNumber, thresholds) > currentEra;
}

/**
 * Veterancy: each era band is 1 wave shorter; boundaries shift earlier by 1 per era.
 * Base [1–10],[11–20],[21–30],[31–40],[41–100]
 * →     [1–9],[10–18],[19–27],[28–36],[37–100]
 */
export function withVeterancy(configs: EraConfig[]): EraConfig[] {
  const sorted = [...configs]
    .sort((a, b) => a.era - b.era)
    .map((e) => ({ ...e, shopOdds: { ...e.shopOdds }, waveRange: [...e.waveRange] as [number, number] }));

  let start = 1;
  for (let i = 0; i < sorted.length; i++) {
    const cfg = sorted[i]!;
    const [baseLo, baseHi] = configs.find((c) => c.era === cfg.era)!.waveRange;
    const baseLen = baseHi - baseLo + 1;
    const isLast = i === sorted.length - 1;
    if (isLast) {
      cfg.waveRange = [start, baseHi];
    } else {
      const len = Math.max(1, baseLen - 1);
      cfg.waveRange = [start, start + len - 1];
      start = cfg.waveRange[1] + 1;
    }
  }
  return sorted;
}

export function unitsInEra(era: EraId) {
  return UNIT_DEFS.filter((u) => u.era === era);
}

/**
 * Roll 3 Level-2 (2★) discovery offers strictly from the newly unlocked era.
 * Prefer distinct defs; sample with replacement only when the pool has fewer than `count` units.
 */
export function rollDiscoveryChoices(
  newEra: EraId,
  seed: number,
  count = 3,
): { choices: DiscoveryChoice[]; nextSeed: number } {
  const rand = createRng(seed);
  const pool = unitsInEra(newEra);
  const choices: DiscoveryChoice[] = [];

  if (pool.length === 0) {
    const nextSeed = (seed + 1 + Math.floor(rand() * 1e9)) >>> 0;
    return { choices, nextSeed };
  }

  if (pool.length >= count) {
    const remaining = [...pool];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(rand() * remaining.length);
      const def = remaining.splice(idx, 1)[0]!;
      choices.push({ defId: def.id, starLevel: 2 });
    }
  } else {
    for (let i = 0; i < count; i++) {
      const def = pool[Math.floor(rand() * pool.length)]!;
      choices.push({ defId: def.id, starLevel: 2 });
    }
  }

  const nextSeed = (seed + 1 + Math.floor(rand() * 1e9)) >>> 0;
  return { choices, nextSeed };
}
