import { createRng } from "./rng";
import type {
  CreepAgenda,
  CreepInstance,
  UnitInstance,
} from "./types";

/**
 * Creep agenda behaviors — roles beyond raw HP.
 *
 * Interactions (document for targeting / buff chips):
 * - **Shielded**: absorbs damage into `shieldHp` first. Pierce chips still hit
 *   the primary then pierce extras; shield applies per-creep before HP.
 *   Strongest targeting uses maxHp (ignores shield). LowestHP uses current hp
 *   only (shielded creeps look healthier until shield breaks).
 * - **Regen**: restores HP each tick (not shield). Lifesteal/heal-pulse on
 *   towers are unrelated. AoE and pierce both leave regen ticking.
 * - **Splitter**: on death, spawns 2 low-HP swarmlings behind on the path.
 *   First/Last targeting see children as new path actors. Bosses with Splitter
 *   spawn tougher children.
 * - **Siege**: toward path end (progress ≥ 0.7) gains armor and +leakDamage.
 *   Prefer First / Strongest; LowestHP is weaker vs Siege tanks.
 * - **Hex**: periodically silences the nearest boarded tower (`silencedUntilMs`).
 *   Silenced towers skip fire. Buff chips on a silenced tower do nothing until
 *   the hex expires. Support Aura doctrine still buffs neighbors of a hexed
 *   support (aura is not an attack).
 */

export const AGENDA_SHIELD_FRACTION = 0.22;
export const AGENDA_REGEN_PER_SEC = 0.04; // fraction of maxHp / sec
export const AGENDA_HEX_INTERVAL_MS = 3200;
export const AGENDA_HEX_DURATION_MS = 1400;
export const AGENDA_SIEGE_PROGRESS = 0.7;
export const AGENDA_SIEGE_ARMOR_BONUS = 3;
export const AGENDA_SIEGE_LEAK_BONUS = 1;

const ALL_AGENDAS: CreepAgenda[] = [
  "shielded",
  "regen",
  "splitter",
  "siege",
  "hex",
];

/** Escalate agenda mix with wave / era. Bosses pass explicit agendas. */
export function rollCreepAgendas(
  waveNumber: number,
  era: number,
  seed: number,
  isBoss: boolean,
): CreepAgenda[] {
  if (isBoss) return [];
  const rand = createRng(seed);
  const n = Math.max(1, Math.floor(waveNumber));
  // Early waves: rare single agenda. Mid+: up to 2. Late era: denser.
  let chance = 0.08 + n * 0.012 + era * 0.03;
  chance = Math.min(0.55, chance);
  if (rand() > chance) return [];
  const count = n >= 25 || era >= 4 ? (rand() < 0.35 ? 2 : 1) : 1;
  const pool = [...ALL_AGENDAS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

export function initAgendaRuntime(
  creep: CreepInstance,
  agendas: CreepAgenda[],
): void {
  creep.agendas = agendas;
  if (agendas.includes("shielded")) {
    creep.shieldHp = Math.max(
      1,
      Math.round(creep.maxHp * AGENDA_SHIELD_FRACTION),
    );
  } else {
    creep.shieldHp = 0;
  }
  creep.regenAccMs = 0;
  creep.hexCooldownMs = agendas.includes("hex")
    ? AGENDA_HEX_INTERVAL_MS * 0.5
    : 0;
}

/**
 * Apply damage through shield first. Returns HP damage actually dealt to hp pool.
 */
function agendasOf(creep: CreepInstance): CreepAgenda[] {
  return creep.agendas ?? [];
}

export function applyDamageWithAgendas(
  creep: CreepInstance,
  rawDamage: number,
): number {
  if (!creep.alive || rawDamage <= 0) return 0;
  let remaining = rawDamage;
  if ((creep.shieldHp ?? 0) > 0) {
    const absorb = Math.min(creep.shieldHp, remaining);
    creep.shieldHp -= absorb;
    remaining -= absorb;
  }
  if (remaining <= 0) return 0;
  const before = creep.hp;
  creep.hp -= remaining;
  if (creep.hp <= 0) {
    creep.hp = 0;
    creep.alive = false;
  }
  return Math.min(before, remaining);
}

/** Regen tick — call once per creep per combat frame. */
export function tickRegen(creep: CreepInstance, dtMs: number): void {
  if (!creep.alive || !agendasOf(creep).includes("regen")) return;
  if (creep.hp >= creep.maxHp) return;
  creep.regenAccMs += dtMs;
  const rate = creep.maxHp * AGENDA_REGEN_PER_SEC;
  const heal = (rate * creep.regenAccMs) / 1000;
  if (heal < 0.5) return;
  const whole = Math.floor(heal);
  creep.hp = Math.min(creep.maxHp, creep.hp + whole);
  creep.regenAccMs = 0;
}

/** Siege armor bonus when near path end. */
export function siegeArmorBonus(
  creep: CreepInstance,
  pathProgress01: number,
): number {
  if (!agendasOf(creep).includes("siege")) return 0;
  if (pathProgress01 < AGENDA_SIEGE_PROGRESS) return 0;
  return AGENDA_SIEGE_ARMOR_BONUS;
}

export function siegeLeakBonus(creep: CreepInstance, pathProgress01: number): number {
  if (!agendasOf(creep).includes("siege")) return 0;
  if (pathProgress01 < AGENDA_SIEGE_PROGRESS) return 0;
  return AGENDA_SIEGE_LEAK_BONUS;
}

export type HexPulseResult = {
  silencedUnitId: string | null;
};

/**
 * Hex pulse: silence nearest boarded tower briefly.
 * `nowMs` is wave elapsed or a monotonic combat clock.
 */
export function tickHex(
  creep: CreepInstance,
  dtMs: number,
  board: UnitInstance[],
  nowMs: number,
): HexPulseResult {
  if (!creep.alive || !agendasOf(creep).includes("hex")) {
    return { silencedUnitId: null };
  }
  creep.hexCooldownMs = Math.max(0, creep.hexCooldownMs - dtMs);
  if (creep.hexCooldownMs > 0) return { silencedUnitId: null };
  creep.hexCooldownMs = AGENDA_HEX_INTERVAL_MS;

  let best: UnitInstance | null = null;
  let bestDist = Infinity;
  for (const u of board) {
    if (!u.tile) continue;
    const dist = Math.hypot(u.tile.x - creep.x, u.tile.y - creep.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = u;
    }
  }
  if (!best) return { silencedUnitId: null };
  best.silencedUntilMs = nowMs + AGENDA_HEX_DURATION_MS;
  return { silencedUnitId: best.instanceId };
}

export function isUnitSilenced(unit: UnitInstance, nowMs: number): boolean {
  return (unit.silencedUntilMs ?? 0) > nowMs;
}

/** Splitter children blueprint (caller spawns). */
export function splitterChildCount(creep: CreepInstance): number {
  if (!agendasOf(creep).includes("splitter")) return 0;
  return creep.isBossCreep ? 3 : 2;
}

export function splitterChildHp(parentMaxHp: number, isBoss: boolean): number {
  return Math.max(4, Math.round(parentMaxHp * (isBoss ? 0.18 : 0.28)));
}
