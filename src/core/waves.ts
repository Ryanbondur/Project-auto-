import { MAP } from "../content/map";
import { getCreepDef } from "../content/creeps";
import { eraBossForWave } from "../content/eraBosses";
import { buildWaveDef, waveHpMultiplier } from "../content/waves";
import {
  WAVE_HP_ENDLESS_START,
  WAVE_HP_SCALE_ENDLESS_EXTRA,
  WAVE_HP_SCALE_PER_WAVE,
} from "./constants";
import {
  initAgendaRuntime,
  rollCreepAgendas,
} from "./creepAgendas";
import type { CreepInstance, EraBossId, WaveRuntime } from "./types";

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

export type SpawnContext = {
  waveNumber: number;
  era: 1 | 2 | 3 | 4 | 5;
  path: { x: number; y: number }[];
  eventHpMult?: number;
  rngSeed: number;
  pendingEraBoss?: EraBossId | null;
  onEraBossSpawned?: (bossId: EraBossId) => void;
};

function makeBaseCreep(
  id: string,
  defId: string,
  maxHp: number,
  start: { x: number; y: number },
): CreepInstance {
  return {
    instanceId: id,
    defId,
    hp: maxHp,
    maxHp,
    pathIndex: 0,
    pathT: 0,
    x: start.x,
    y: start.y,
    alive: true,
    agendas: [],
    shieldHp: 0,
    regenAccMs: 0,
    hexCooldownMs: 0,
    isBossCreep: false,
  };
}

/**
 * Spawn due creeps. Prefer SpawnContext; legacy `(waveNumber, eventHpMult)`
 * still works for older tests.
 */
export function spawnDueCreeps(
  runtime: WaveRuntime,
  creeps: CreepInstance[],
  nextId: () => string,
  dtMs: number,
  ctxOrWave: SpawnContext | number = 1,
  legacyEventHpMult = 1,
): void {
  runtime.elapsedMs += dtMs;

  const context: SpawnContext =
    typeof ctxOrWave === "number"
      ? {
          waveNumber: ctxOrWave,
          era: 1,
          path: MAP.path,
          eventHpMult: legacyEventHpMult,
          rngSeed: ctxOrWave * 17,
        }
      : ctxOrWave;

  const hpMult =
    waveHpMultiplier(
      context.waveNumber,
      WAVE_HP_SCALE_PER_WAVE,
      WAVE_HP_SCALE_ENDLESS_EXTRA,
      WAVE_HP_ENDLESS_START,
    ) * Math.max(0.1, context.eventHpMult ?? runtime.eventHpMult ?? 1);

  const start = context.path[0] ?? { x: 0, y: 0 };

  while (runtime.spawnQueue.length > 0) {
    const next = runtime.spawnQueue[0]!;
    if (next.spawnAtMs > runtime.elapsedMs) break;
    runtime.spawnQueue.shift();

    if (next.creepId === "creep_boss") {
      const boss = eraBossForWave(context.waveNumber, context.era);
      const maxHp = Math.max(1, Math.round(boss.maxHp * hpMult));
      const creep = makeBaseCreep(nextId(), "creep_boss", maxHp, start);
      creep.isBossCreep = true;
      creep.displayName = boss.name;
      creep.bossMechanic = boss.mechanic;
      initAgendaRuntime(creep, [...boss.agendas]);
      creeps.push(creep);
      context.onEraBossSpawned?.(boss.id);
      continue;
    }

    const def = getCreepDef(next.creepId);
    if (!def) continue;
    const maxHp = Math.max(1, Math.round(def.maxHp * hpMult));
    const creep = makeBaseCreep(nextId(), def.id, maxHp, start);
    creep.isBossCreep = def.isBoss;
    const agendas = rollCreepAgendas(
      context.waveNumber,
      context.era,
      (context.rngSeed + creeps.length * 31 + Math.floor(runtime.elapsedMs)) >>>
        0,
      def.isBoss,
    );
    initAgendaRuntime(creep, agendas);
    creeps.push(creep);
  }
  if (runtime.spawnQueue.length === 0) {
    runtime.allSpawned = true;
  }
}
