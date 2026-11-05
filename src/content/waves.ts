import type { WaveDef } from "../core/types";

/**
 * Procedural placeholder waves.
 * Boss every 10th wave. Escalates count/HP mix with wave number.
 */
export function buildWaveDef(waveNumber: number): WaveDef {
  const n = Math.max(1, Math.floor(waveNumber));
  const isBossWave = n % 10 === 0;
  const entries: WaveDef["entries"] = [];

  if (isBossWave) {
    entries.push({ creepId: "creep_boss", count: 1, spawnDelayMs: 0 });
    entries.push({
      creepId: "creep_grunt",
      count: 4 + Math.floor(n / 10),
      spawnDelayMs: 900,
    });
    return { waveNumber: n, entries };
  }

  const gruntCount = 4 + Math.floor(n * 0.6);
  const runnerCount = 2 + Math.floor(n / 3);
  entries.push({ creepId: "creep_grunt", count: gruntCount, spawnDelayMs: 450 });
  entries.push({ creepId: "creep_runner", count: runnerCount, spawnDelayMs: 280 });

  if (n >= 4) {
    entries.push({
      creepId: "creep_swarm",
      count: 3 + Math.floor(n / 2),
      spawnDelayMs: 180,
    });
  }
  if (n >= 6) {
    entries.push({
      creepId: "creep_tank",
      count: 1 + Math.floor((n - 6) / 4),
      spawnDelayMs: 1100,
    });
  }

  return { waveNumber: n, entries };
}
