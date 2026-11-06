import { getBuffChipDef } from "../content/buffChips";
import { getEraConfig } from "../content/eras";
import { getUnitDef } from "../content/units";
import {
  chipAoeBonus,
  chipDamageMultiplier,
  chipHealPulseAmount,
  chipLifestealFraction,
  chipPierceExtra,
} from "./buffEffects";
import { effectiveStats } from "./stats";
import type {
  BuffChipInstance,
  RunState,
  TargetingMode,
  UnitInstance,
} from "./types";

export type InspectBuffChip = {
  instanceId: string;
  name: string;
  starLevel: number;
  effect: string;
};

export type UnitInspectData = {
  instanceId: string;
  name: string;
  era: 1 | 2 | 3 | 4 | 5;
  eraName: string;
  starLevel: number;
  targeting: TargetingMode;
  stats: {
    damage: number;
    attackSpeed: number;
    range: number;
    aoeRadius: number;
  };
  buffs: InspectBuffChip[];
  /** Short combat modifier lines (chip-driven). */
  modifiers: string[];
};

function shortEraName(era: 1 | 2 | 3 | 4 | 5): string {
  const full = getEraConfig(era).name;
  return full.split("/")[0]?.trim() ?? full;
}

function buildModifiers(
  unit: UnitInstance,
  chips: BuffChipInstance[],
  baseAoe: number,
): string[] {
  const mods: string[] = [];
  const dmgMult = chipDamageMultiplier(unit, chips);
  if (dmgMult > 1.001) {
    mods.push(`+${Math.round((dmgMult - 1) * 100)}% dmg`);
  }
  const pierce = chipPierceExtra(unit, chips);
  if (pierce > 0) mods.push(`+${pierce} pierce`);
  const life = chipLifestealFraction(unit, chips);
  if (life > 0) mods.push(`${Math.round(life * 100)}% lifesteal`);
  const pulse = chipHealPulseAmount(unit, chips);
  if (pulse > 0) mods.push(`heal pulse ${pulse}`);
  const aoeBonus = chipAoeBonus(unit, chips);
  if (aoeBonus > 0) {
    const total = baseAoe + aoeBonus;
    mods.push(`AoE ${total.toFixed(1)}`);
  }
  return mods;
}

/**
 * Pure helper: build a minimal inspect card model for a boarded (or any) unit.
 */
export function buildUnitInspectData(
  unit: UnitInstance,
  state: Pick<RunState, "chips" | "metaApplied">,
): UnitInspectData | null {
  const def = getUnitDef(unit.defId);
  if (!def) return null;
  const stats = effectiveStats(unit, state.metaApplied);
  if (!stats) return null;
  const aoe = stats.aoeRadius + chipAoeBonus(unit, state.chips);
  const dmgMult = chipDamageMultiplier(unit, state.chips);

  const buffs: InspectBuffChip[] = [];
  for (const chipId of unit.chipInstanceIds) {
    const chip = state.chips.find((c) => c.instanceId === chipId);
    if (!chip) continue;
    const chipDef = getBuffChipDef(chip.defId);
    if (!chipDef) continue;
    buffs.push({
      instanceId: chip.instanceId,
      name: chipDef.name.replace(/\s*Chip$/i, ""),
      starLevel: chip.starLevel,
      effect: chipDef.effect,
    });
  }

  return {
    instanceId: unit.instanceId,
    name: def.name,
    era: def.era,
    eraName: shortEraName(def.era),
    starLevel: unit.starLevel,
    targeting: unit.targeting,
    stats: {
      damage: Math.round(stats.damage * dmgMult * 10) / 10,
      attackSpeed: Math.round(stats.attackSpeed * 100) / 100,
      range: Math.round(stats.range * 100) / 100,
      aoeRadius: Math.round(aoe * 100) / 100,
    },
    buffs,
    modifiers: buildModifiers(unit, state.chips, stats.aoeRadius),
  };
}

/** Find a boarded unit on a tile (Canvas hit → unit). */
export function unitAtTile(
  board: UnitInstance[],
  x: number,
  y: number,
): UnitInstance | undefined {
  return board.find((u) => u.tile?.x === x && u.tile?.y === y);
}
