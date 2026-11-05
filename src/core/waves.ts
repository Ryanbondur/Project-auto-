import { MAP } from "../content/map";
import { getCreepDef } from "../content/creeps";
import { buildWaveDef, waveHpMultiplier } from "../content/waves";
import {
  WAVE_HP_ENDLESS_START,
  WAVE_HP_SCALE_ENDLESS_EXTRA,
  WAVE_HP_SCALE_PER_WAVE,
} from "./constants";
import type { CreepInstance, WaveRuntime } from "./types";

export function planWaveRuntime(
  waveNumber: number,
  eventHpMult = 1,
): WaveRuntime {
  const def = buildWaveDef(waveNumber);
  const spawnQueue: WaveRuntime["spawnQueue"] = [];
  let t = 0;
  for (const entry of def.entries) {
    for (let i = 0; i < entry.count; i++) {
      spawnQueue.push({ creepId: entry.creepId, spawnAtMs: t });
      t += entry.spawnDelayMs;
    }
  }
  spawnQueue.sort((a, b) => a.spawnAtMs - b.spawnAtMs);
  return {
    spawnQueue,
    elapsedMs: 0,
    allSpawned: spawnQueue.length === 0,
    eventHpMult: Math.max(0.1, eventHpMult),
  };
}

export function spawnDueCreeps(
  runtime: WaveRuntime,
  creeps: CreepInstance[],
  nextId: () => string,
  dtMs: number,
  waveNumber = 1,
  /** Extra HP multiplier from run events (e.g. 0.9 = −10%). */
  eventHpMult = 1,
): void {
  runtime.elapsedMs += dtMs;
  const hpMult =
    waveHpMultiplier(
      waveNumber,
      WAVE_HP_SCALE_PER_WAVE,
      WAVE_HP_SCALE_ENDLESS_EXTRA,
      WAVE_HP_ENDLESS_START,
    ) * Math.max(0.1, eventHpMult);
  while (runtime.spawnQueue.length > 0) {
    const next = runtime.spawnQueue[0]!;
    if (next.spawnAtMs > runtime.elapsedMs) break;
    runtime.spawnQueue.shift();
    const def = getCreepDef(next.creepId);
    if (!def) continue;
    const start = MAP.path[0] ?? { x: 0, y: 0 };
    const maxHp = Math.max(1, Math.round(def.maxHp * hpMult));
    creeps.push({
      instanceId: nextId(),
      defId: def.id,
      hp: maxHp,
      maxHp,
      pathIndex: 0,
      pathT: 0,
      x: start.x,
      y: start.y,
      alive: true,
    });
  }
  if (runtime.spawnQueue.length === 0) {
    runtime.allSpawned = true;
  }
}
