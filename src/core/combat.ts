import { MAP } from "../content/map";
import { getCreepDef } from "../content/creeps";
import { getUnitDef } from "../content/units";
import { BASE_HP_HEAL_CAP } from "./constants";
import {
  HEAL_PULSE_INTERVAL_MS,
  chipAoeBonus,
  chipDamageMultiplier,
  chipHealPulseAmount,
  chipLifestealFraction,
  chipPierceExtra,
} from "./buffEffects";
import type {
  CreepInstance,
  Projectile,
  RunState,
  UnitInstance,
} from "./types";
import {
  creepWorldPos,
  moveCreepAlongPath,
  sabotageDivertOffset,
  sabotageSpeedMult,
} from "./pathing";
import { applyLeak } from "./leak";
import { selectTarget } from "./targeting";
import { effectiveStats } from "./stats";

export { HEAL_PULSE_INTERVAL_MS };

/** Default projectile flight speed (tiles / second) — readable travel, not hitscan. */
export const PROJECTILE_SPEED = 5.5;

function armorMitigation(damage: number, armor: number): number {
  return Math.max(1, damage - Math.max(0, armor) * 0.5);
}

function healBase(state: RunState, amount: number): void {
  if (amount <= 0) return;
  state.baseHp = Math.min(BASE_HP_HEAL_CAP, state.baseHp + amount);
}

/**
 * Apply damage; returns total raw HP removed (pre-floor) for lifesteal accounting.
 */
function applyDamageToCreep(
  creeps: CreepInstance[],
  creepId: string,
  damage: number,
  aoeRadius: number,
  impactPos: { x: number; y: number },
): number {
  let dealtTotal = 0;
  for (const creep of creeps) {
    if (!creep.alive || creep.hp <= 0) continue;
    const def = getCreepDef(creep.defId);
    if (!def) continue;
    const pos = creepWorldPos(creep);
    const dist = Math.hypot(pos.x - impactPos.x, pos.y - impactPos.y);
    const hitPrimary = creep.instanceId === creepId;
    const hitAoe = aoeRadius > 0 && dist <= aoeRadius;
    if (!hitPrimary && !hitAoe) continue;
    const dealt = armorMitigation(damage, def.armor);
    const before = creep.hp;
    creep.hp -= dealt;
    dealtTotal += Math.min(before, dealt);
    if (creep.hp <= 0) {
      creep.hp = 0;
      creep.alive = false;
    }
  }
  return dealtTotal;
}

function applyPierce(
  creeps: CreepInstance[],
  primaryId: string,
  damage: number,
  pierceExtra: number,
): number {
  if (pierceExtra <= 0) return 0;
  let dealt = 0;
  const ordered = creeps
    .filter((c) => c.alive && c.hp > 0)
    .sort((a, b) => a.pathIndex + a.pathT - (b.pathIndex + b.pathT));
  const primaryIdx = ordered.findIndex((c) => c.instanceId === primaryId);
  const start = primaryIdx >= 0 ? primaryIdx + 1 : 0;
  for (let i = start; i < ordered.length && i < start + pierceExtra; i++) {
    const secondary = ordered[i]!;
    const spos = creepWorldPos(secondary);
    dealt += applyDamageToCreep(
      creeps,
      secondary.instanceId,
      damage * 0.7,
      0,
      spos,
    );
  }
  return dealt;
}

/** Visual lofted position: linear lerp + parabolic arc in y. */
export function projectileDrawPos(p: Projectile): { x: number; y: number } {
  const t = Math.min(1, Math.max(0, p.progress));
  const x = p.from.x + (p.aim.x - p.from.x) * t;
  const y = p.from.y + (p.aim.y - p.from.y) * t;
  const arc = p.arcHeight * 4 * t * (1 - t);
  return { x, y: y - arc };
}

/**
 * Resolve a projectile arrival: damage + pierce + optional lifesteal from
 * the firing unit (looked up by matching board chips via projectile metadata).
 */
export function resolveProjectileHit(
  state: RunState,
  p: Projectile,
): number {
  const impact = { ...p.aim };
  let dealt = applyDamageToCreep(
    state.creeps,
    p.toCreepId,
    p.damage,
    p.aoeRadius,
    { x: impact.x - 0.5, y: impact.y - 0.5 },
  );
  dealt += applyPierce(state.creeps, p.toCreepId, p.damage, p.pierceExtra);
  return dealt;
}

/**
 * Advance in-flight projectiles toward live (or last) aim points.
 * Damage resolves only when progress reaches 1 (arrival), not on fire.
 */
export function advanceProjectiles(state: RunState, dtMs: number): void {
  const dt = dtMs / 1000;
  const remaining: Projectile[] = [];

  for (const p of state.projectiles) {
    const target = state.creeps.find(
      (c) => c.instanceId === p.toCreepId && c.alive && c.hp > 0,
    );
    if (target) {
      const wp = creepWorldPos(target);
      const newAim = { x: wp.x + 0.5, y: wp.y + 0.5 };
      const aimDelta = Math.hypot(newAim.x - p.aim.x, newAim.y - p.aim.y);
      if (aimDelta > 0.35) {
        p.from = { ...p.pos };
        p.progress = 0;
      }
      p.aim = newAim;
    }

    const dx = p.aim.x - p.from.x;
    const dy = p.aim.y - p.from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) {
      p.progress = 1;
      p.pos = { ...p.aim };
    } else {
      const step = (p.speed * dt) / dist;
      p.progress = Math.min(1, p.progress + step);
      const t = p.progress;
      p.pos = {
        x: p.from.x + dx * t,
        y: p.from.y + dy * t,
      };
    }

    if (p.progress >= 1) {
      const dealt = resolveProjectileHit(state, p);
      if (p.lifestealFraction > 0 && dealt > 0) {
        healBase(state, Math.floor(dealt * p.lifestealFraction));
      }
      continue;
    }
    remaining.push(p);
  }

  state.projectiles = remaining;
}

function spawnProjectile(
  unit: UnitInstance,
  target: CreepInstance,
  damage: number,
  aoeRadius: number,
  pierceExtra: number,
  lifestealFraction: number,
  nextId: () => string,
): Projectile {
  const from = { x: unit.tile!.x + 0.5, y: unit.tile!.y + 0.5 };
  const wp = creepWorldPos(target);
  const aim = { x: wp.x + 0.5, y: wp.y + 0.5 };
  return {
    id: nextId(),
    from: { ...from },
    pos: { ...from },
    aim,
    toCreepId: target.instanceId,
    damage,
    aoeRadius,
    speed: PROJECTILE_SPEED,
    progress: 0,
    pierceExtra,
    arcHeight: aoeRadius > 0 ? 0.55 : 0.35,
    lifestealFraction,
  };
}

function tickHealPulses(state: RunState, dtMs: number): void {
  let pulseAmount = 0;
  for (const unit of state.board) {
    if (!unit.tile) continue;
    pulseAmount += chipHealPulseAmount(unit, state.chips);
  }
  if (pulseAmount <= 0) {
    state.healPulseCooldownMs = HEAL_PULSE_INTERVAL_MS;
    return;
  }
  state.healPulseCooldownMs = Math.max(0, state.healPulseCooldownMs - dtMs);
  if (state.healPulseCooldownMs > 0) return;
  healBase(state, pulseAmount);
  state.healPulseCooldownMs = HEAL_PULSE_INTERVAL_MS;
}

export type CombatTickResult = {
  leakedIds: string[];
  defeated: boolean;
  waveComplete: boolean;
};

/**
 * One dt combat step: move creeps continuously, advance projectiles,
 * fire new shots when cooldowns ready. Visuals are frame-smooth via rAF + dt.
 */
export function tickCombat(
  state: RunState,
  dtMs: number,
  nextProjectileId: () => string,
): CombatTickResult {
  const leakedIds: string[] = [];
  const clampedDt = Math.max(0, Math.min(dtMs, 50));

  // 1) Continuous creep march along path (sub-tile pathT) + sabotage
  for (let i = 0; i < state.creeps.length; i++) {
    const creep = state.creeps[i]!;
    if (!creep.alive) continue;
    const def = getCreepDef(creep.defId);
    if (!def) continue;
    const eventSlow = state.modifiers?.pathSlow?.pathIndex ?? null;
    const mult = sabotageSpeedMult(
      creep.pathIndex,
      state.pathSabotages,
      eventSlow,
    );
    const divert = sabotageDivertOffset(
      creep.pathIndex,
      creep.pathT,
      state.pathSabotages,
      MAP,
    );
    const { creep: moved, leaked } = moveCreepAlongPath(
      creep,
      def.speed,
      clampedDt,
      MAP,
      mult,
      divert,
    );
    state.creeps[i] = moved;
    if (leaked) {
      leakedIds.push(moved.instanceId);
      // Boss arena: leak signals arena fail to the store — never ends the run here.
      if (state.phase === "EVENT_ARENA") {
        moved.alive = false;
        state.creeps[i] = moved;
        return { leakedIds, defeated: false, waveComplete: false };
      }
      const leak = applyLeak(state.baseHp, def);
      state.baseHp = leak.baseHp;
      if (leak.defeated) {
        state.phase = "RUN_DEFEAT";
        state.projectiles = [];
        return { leakedIds, defeated: true, waveComplete: false };
      }
    }
  }

  // 2) Advance projectiles; hits resolve on arrival (lifesteal applied there)
  advanceProjectiles(state, clampedDt);

  // 3) Heal-pulse chips tick independently of attacks
  tickHealPulses(state, clampedDt);

  // 4) Fire boarded units when cooldown ready
  for (const unit of state.board) {
    if (!unit.tile) continue;
    unit.cooldownMs = Math.max(0, unit.cooldownMs - clampedDt);
    if (unit.cooldownMs > 0) continue;
    const stats = effectiveStats(unit, state.metaApplied);
    if (!stats || stats.attackSpeed <= 0) continue;

    const defMap = new Map<string, NonNullable<ReturnType<typeof getCreepDef>>>();
    for (const c of state.creeps) {
      const d = getCreepDef(c.defId);
      if (d) defMap.set(d.id, d);
    }
    const aoe = stats.aoeRadius + chipAoeBonus(unit, state.chips);
    const dmgMult = chipDamageMultiplier(unit, state.chips);
    const def = getUnitDef(unit.defId);
    const ballisticBonus =
      def?.tags.includes("Ballistic") && state.modifiers?.ballisticDamageBonus
        ? 1 + state.modifiers.ballisticDamageBonus
        : 1;
    const damage = stats.damage * dmgMult * ballisticBonus;
    const target = selectTarget(
      unit.targeting,
      unit.tile,
      stats.range,
      state.creeps,
      defMap,
      aoe,
    );
    unit.currentTargetId = target?.instanceId ?? null;
    if (!target) continue;

    const pierce = chipPierceExtra(unit, state.chips);
    const life = chipLifestealFraction(unit, state.chips);
    state.projectiles.push(
      spawnProjectile(
        unit,
        target,
        damage,
        aoe,
        pierce,
        life,
        nextProjectileId,
      ),
    );
    unit.cooldownMs = 1000 / stats.attackSpeed;
  }

  const anyAlive = state.creeps.some((c) => c.alive && c.hp > 0);
  const waveComplete =
    state.waveRuntime !== null &&
    state.waveRuntime.allSpawned &&
    !anyAlive &&
    state.projectiles.length === 0;

  return { leakedIds, defeated: false, waveComplete };
}

export function boardHasUnits(state: RunState): boolean {
  return state.board.some((u) => u.tile && getUnitDef(u.defId));
}
