import type { SkillId } from "../core/types";

export type SkillDef = {
  id: SkillId;
  name: string;
  /** XP spend to unlock (architecture §8 default thresholds). */
  xpCost: number;
  description: string;
  effectSummary: string;
};

/**
 * Six Commander skills in unlock order.
 * Costs: 100 / 200 / 350 / 550 / 800 / 1100 (architecture default).
 */
export const SKILL_DEFS: SkillDef[] = [
  {
    id: "deep_pockets",
    name: "Deep Pockets",
    xpCost: 100,
    description: "Start each run with extra gold in your coffers.",
    effectSummary: "Start gold 10 → 15",
  },
  {
    id: "interest_rate_cap",
    name: "Interest Rate Cap",
    xpCost: 200,
    description: "Bankers trust a seasoned commander — higher interest ceiling.",
    effectSummary: "Interest cap 5 → 8",
  },
  {
    id: "master_mason",
    name: "Master Mason",
    xpCost: 350,
    description: "Better sightlines from every tower perch.",
    effectSummary: "+15% attack range for all units",
  },
  {
    id: "quick_assembly",
    name: "Quick Assembly",
    xpCost: 550,
    description: "Merged units come online faster.",
    effectSummary: "Merged / 2★+ units +10% attack speed",
  },
  {
    id: "veterancy",
    name: "Veterancy",
    xpCost: 800,
    description: "Era pressure arrives one wave earlier each band.",
    effectSummary: "Each era band −1 wave (thresholds shift earlier)",
  },
  {
    id: "reinforcements",
    name: "Reinforcements",
    xpCost: 1100,
    description: "One more reserve slot for the bench.",
    effectSummary: "Bench size 5 → 6",
  },
];

export function getSkillDef(id: SkillId): SkillDef | undefined {
  return SKILL_DEFS.find((s) => s.id === id);
}
