import { MAP } from "../content/map";
import { getCreepDef } from "../content/creeps";
import { buildWaveDef } from "../content/waves";
import type { CreepInstance, WaveRuntime } from "./types";

export function planWaveRuntime(waveNumber: number): WaveRuntime {
  const def = buildWaveDef(waveNumber);
  const spawnQueue: WaveRuntime["spawnQueue"] = [];
  let t = 0;
  for (const entry of def.entries) {
    for (let i = 0; i < entry.count; i++) {
      spawnQueue.push({ creepId: entry.creepId, spawnAtMs: t });
      t += entry.spawnDelayMs;
    }
  }
  // Stable chronological order
  spawnQueue.sort((a, b) => a.spawnAtMs - b.spawnAtMs);
  return {
    spawnQueue,
    elapsedMs: 0,
    allSpawned: spawnQueue.length === 0,
  };
}

export function spawnDueCreeps(
  runtime: WaveRuntime,
  creeps: CreepInstance[],
  nextId: () => string,
  dtMs: number,
): void {
  runtime.elapsedMs += dtMs;
  while (runtime.spawnQueue.length > 0) {
    const next = runtime.spawnQueue[0]!;
    if (next.spawnAtMs > runtime.elapsedMs) break;
    runtime.spawnQueue.shift();
    const def = getCreepDef(next.creepId);
    if (!def) continue;
    const start = MAP.path[0] ?? { x: 0, y: 0 };
    creeps.push({
      instanceId: nextId(),
      defId: def.id,
      hp: def.maxHp,
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
