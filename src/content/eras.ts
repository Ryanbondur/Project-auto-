import type { EraConfig } from "../core/types";

/** Canon era table from master-spec.md */
export const ERA_CONFIGS: EraConfig[] = [
  {
    era: 1,
    name: "Primitive / Ancient",
    waveRange: [1, 10],
    maxBoardSlots: 5,
    shopOdds: { era1: 1.0, era2: 0.0, era3: 0.0, era4: 0.0, era5: 0.0 },
  },
  {
    era: 2,
    name: "Medieval / Feudal",
    waveRange: [11, 20],
    maxBoardSlots: 6,
    shopOdds: { era1: 0.3, era2: 0.7, era3: 0.0, era4: 0.0, era5: 0.0 },
  },
  {
    era: 3,
    name: "Industrial / Steam",
    waveRange: [21, 30],
    maxBoardSlots: 7,
    shopOdds: { era1: 0.1, era2: 0.3, era3: 0.6, era4: 0.0, era5: 0.0 },
  },
  {
    era: 4,
    name: "Modern Warfare",
    waveRange: [31, 40],
    maxBoardSlots: 8,
    shopOdds: { era1: 0.0, era2: 0.1, era3: 0.3, era4: 0.6, era5: 0.0 },
  },
  {
    era: 5,
    name: "Futuristic / Cyber",
    waveRange: [41, 100],
    maxBoardSlots: 9,
    shopOdds: { era1: 0.0, era2: 0.0, era3: 0.1, era4: 0.3, era5: 0.6 },
  },
];

export function getEraConfig(era: 1 | 2 | 3 | 4 | 5): EraConfig {
  const found = ERA_CONFIGS.find((e) => e.era === era);
  if (!found) throw new Error(`Unknown era: ${era}`);
  return found;
}
