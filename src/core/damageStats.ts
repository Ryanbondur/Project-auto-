import { getUnitDef } from "../content/units";
import type { UnitInstance } from "./types";

export type DamageScope = "wave" | "run";

export type DamageRankEntry = {
  instanceId: string;
  name: string;
  starLevel: number;
  damage: number;
};

/** Compact HUD number: 1250 → 1.3k, 12000 → 12k. */
export function formatDamageShort(n: number): string {
  const v = Math.max(0, Math.floor(n));
  if (v < 1000) return String(v);
  if (v < 10_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (v < 1_000_000) return `${Math.round(v / 1000)}k`;
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function damageFor(unit: UnitInstance, scope: DamageScope): number {
  return scope === "wave" ? unit.damageDealtWave : unit.damageDealtRun;
}

/**
 * Rank boarded units by damage dealt (desc). Units with 0 damage still appear
 * so the DPS panel can show an empty board truthfully.
 */
export function rankDamageDealt(
  board: UnitInstance[],
  scope: DamageScope,
): DamageRankEntry[] {
  const entries: DamageRankEntry[] = [];
  for (const unit of board) {
    if (!unit.tile) continue;
    const def = getUnitDef(unit.defId);
    entries.push({
      instanceId: unit.instanceId,
      name: def?.name ?? unit.defId,
      starLevel: unit.starLevel,
      damage: damageFor(unit, scope),
    });
  }
  entries.sort((a, b) => b.damage - a.damage || a.name.localeCompare(b.name));
  return entries;
}

/** Add dealt HP damage onto the firing unit instance (wave + run). */
export function attributeDamage(
  board: UnitInstance[],
  sourceUnitId: string,
  dealt: number,
): void {
  if (dealt <= 0) return;
  const unit = board.find((u) => u.instanceId === sourceUnitId);
  if (!unit) return;
  unit.damageDealtWave += dealt;
  unit.damageDealtRun += dealt;
}

/** Reset per-wave counters on Ready / wave start. */
export function resetWaveDamage(units: UnitInstance[]): void {
  for (const u of units) {
    u.damageDealtWave = 0;
  }
}
