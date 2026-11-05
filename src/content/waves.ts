import type { WaveDef } from "../core/types";

/**
 * Procedural placeholder waves (balance pass).
 * Early game softened for phone play; mid game still pressures merges;
 * endless adds count gently (HP scale is applied on spawn separately).
 * Boss every 10th wave.
 */
export function buildWaveDef(waveNumber: number): WaveDef {
  const n = Math.max(1, Math.floor(waveNumber));
  const isBossWave = n % 10 === 0;
  const entries: WaveDef["entries"] = [];

  if (isBossWave) {
    entries.push({ creepId: "creep_boss", count: 1, spawnDelayMs: 0 });
    entries.push({
      creepId: "creep_grunt",
      count: 3 + Math.floor(n / 12),
      spawnDelayMs: 1000,
    });
    return { waveNumber: n, entries };
  }

  // Early (1–5): lean packs so 1–2 towers + gold feel fair
  if (n <= 5) {
    entries.push({
      creepId: "creep_grunt",
      count: 3 + Math.floor(n * 0.4),
      spawnDelayMs: 520,
    });
    entries.push({
      creepId: "creep_runner",
      count: 1 + Math.floor(n / 3),
      spawnDelayMs: 360,
    });
    if (n >= 4) {
      entries.push({
        creepId: "creep_swarm",
        count: 2 + Math.floor(n / 3),
        spawnDelayMs: 220,
      });
    }
    return { waveNumber: n, entries };
  }

  // Mid / late count curve (softer than prior 0.6×n grunts)
  const gruntCount = 5 + Math.floor(n * 0.4);
  const runnerCount = 2 + Math.floor(n / 4);
  entries.push({ creepId: "creep_grunt", count: gruntCount, spawnDelayMs: 480 });
  entries.push({
    creepId: "creep_runner",
    count: runnerCount,
    spawnDelayMs: 300,
  });

  if (n >= 4) {
    entries.push({
      creepId: "creep_swarm",
      count: 3 + Math.floor(n / 3),
      spawnDelayMs: 200,
    });
  }
  if (n >= 7) {
    entries.push({
      creepId: "creep_tank",
      count: 1 + Math.floor((n - 7) / 5),
      spawnDelayMs: 1200,
    });
  }

  return { waveNumber: n, entries };
}

/**
 * Multiplier on catalog maxHp for a given wave.
 * Mild early/mid; extra after WAVE_HP_ENDLESS_START for endless fairness.
 */
export function waveHpMultiplier(
  waveNumber: number,
  perWave = 0.035,
  endlessExtra = 0.025,
  endlessStart = 40,
): number {
  const n = Math.max(1, Math.floor(waveNumber));
  const early = (n - 1) * perWave;
  const late = Math.max(0, n - endlessStart) * endlessExtra;
  return 1 + early + late;
}
