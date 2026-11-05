/**
 * Unit draw adapter — procedural silhouettes (art-swappable).
 * Combat stays art-blind; swap bodies / add sprite tables without touching sim.
 *
 * Future sprite hook:
 *   const frame = spriteTable[defId]?.[star]?.[anim];
 *   if (frame) drawImage(...); else drawProceduralSilhouette(...);
 */

import { getUnitDef } from "../content/units";
import { effectiveStats } from "../core/stats";
import type { CreepInstance, RunState, UnitInstance } from "../core/types";
import { creepWorldPos } from "../core/pathing";
import { eraColor, shadeHex, theme, tintHex } from "./theme";

export type DrawContext = {
  ctx: CanvasRenderingContext2D;
  tileSize: number;
  /** rAF timestamp for idle breath / attack flash. */
  timeMs: number;
};

export type UnitRole =
  | "melee"
  | "ballistic"
  | "siege"
  | "support"
  | "energy"
  | "swarm"
  | "generic";

/** Map content tags → silhouette family (sprite kits later key off defId). */
export function unitRole(defId: string, tags: string[] = []): UnitRole {
  // Prefer explicit defId overrides for distinct roster reads
  switch (defId) {
    case "unit_spearman":
    case "unit_knight":
      return "melee";
    case "unit_slinger":
    case "unit_archer":
    case "unit_musket":
    case "unit_gatling":
    case "unit_m16_soldier":
    case "unit_sniper":
      return "ballistic";
    case "unit_boulder_roll":
    case "unit_catapult":
    case "unit_cannon":
    case "unit_rpg":
    case "unit_rail_turret":
      return "siege";
    case "unit_tribe_drummer":
    case "unit_monk":
    case "unit_medic_steam":
    case "unit_drone_spotter":
    case "unit_shield_bot":
      return "support";
    case "unit_laser_grid":
      return "energy";
    case "unit_nano_swarm":
      return "swarm";
    default:
      break;
  }
  const t = tags.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes("melee"))) return "melee";
  if (t.some((x) => x.includes("siege"))) return "siege";
  if (t.some((x) => x.includes("support"))) return "support";
  if (t.some((x) => x.includes("energy"))) return "energy";
  if (t.some((x) => x.includes("swarm"))) return "swarm";
  if (t.some((x) => x.includes("ballistic"))) return "ballistic";
  return "generic";
}

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 628) / 100; // ~0..6.28
}

function targetWorld(
  unit: UnitInstance,
  creeps: CreepInstance[],
): { x: number; y: number } | null {
  if (!unit.currentTargetId || !unit.tile) return null;
  const creep = creeps.find((c) => c.instanceId === unit.currentTargetId && c.alive);
  if (!creep) return null;
  const w = creepWorldPos(creep);
  return { x: w.x + 0.5, y: w.y + 0.5 };
}

function drawStarPips(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  starLevel: number,
): void {
  const n = Math.min(Math.max(1, starLevel), 5);
  const extra = starLevel > 5 ? starLevel - 5 : 0;
  const pipR = Math.max(1.6, r * 0.11);
  const arcY = cy - r * 0.92;
  const spread = Math.min(r * 0.95, 4 + n * pipR * 1.35);
  ctx.fillStyle = theme.gold;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const px = cx - spread / 2 + t * spread;
    ctx.beginPath();
    ctx.arc(px, arcY, pipR, 0, Math.PI * 2);
    ctx.fill();
  }
  if (extra > 0) {
    ctx.fillStyle = tintHex(theme.gold, 0.35);
    ctx.font = `bold ${Math.max(8, Math.floor(r * 0.28))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`+${extra}`, cx, arcY - pipR * 2.2);
  }
}

function drawSelectRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  phone: boolean,
): void {
  ctx.save();
  ctx.strokeStyle = theme.cyan;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.cyan;
  ctx.shadowBlur = phone ? theme.selectGlowBlur : theme.selectGlowBlur + 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawRangeHint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rangePx: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(46, 230, 255, 0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function strokeBody(
  ctx: CanvasRenderingContext2D,
  fill: string,
  stroke: string,
  lineW = 1.25,
): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineW;
  ctx.stroke();
}

/** Procedural silhouettes — distinct per role; era tint carries roster identity. */
function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  role: UnitRole,
  s: number,
  fill: string,
  edge: string,
  attackFlash: number,
): void {
  const shade = shadeHex(fill, 0.28);
  const tip = tintHex(fill, 0.35);

  switch (role) {
    case "melee": {
      // Shield plate + spear tip forward (+x)
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, -s * 0.42);
      ctx.lineTo(s * 0.18, -s * 0.38);
      ctx.lineTo(s * 0.28, 0);
      ctx.lineTo(s * 0.18, s * 0.38);
      ctx.lineTo(-s * 0.22, s * 0.42);
      ctx.lineTo(-s * 0.38, 0);
      ctx.closePath();
      strokeBody(ctx, fill, edge);
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.08);
      ctx.lineTo(s * 0.55 + attackFlash * s * 0.12, 0);
      ctx.lineTo(s * 0.2, s * 0.08);
      ctx.closePath();
      strokeBody(ctx, tip, edge, 1);
      break;
    }
    case "ballistic": {
      // Compact chassis + barrel
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s * 0.28);
      ctx.lineTo(s * 0.16, -s * 0.28);
      ctx.lineTo(s * 0.2, -s * 0.2);
      ctx.lineTo(s * 0.2, s * 0.2);
      ctx.lineTo(s * 0.16, s * 0.28);
      ctx.lineTo(-s * 0.28, s * 0.28);
      ctx.lineTo(-s * 0.32, s * 0.2);
      ctx.lineTo(-s * 0.32, -s * 0.2);
      ctx.closePath();
      strokeBody(ctx, fill, edge);
      ctx.fillStyle = shade;
      ctx.fillRect(-s * 0.08, -s * 0.1, s * 0.55 + attackFlash * s * 0.1, s * 0.2);
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.strokeRect(-s * 0.08, -s * 0.1, s * 0.55 + attackFlash * s * 0.1, s * 0.2);
      if (attackFlash > 0.2) {
        ctx.fillStyle = theme.cyan;
        ctx.beginPath();
        ctx.arc(s * 0.52 + attackFlash * s * 0.15, 0, s * 0.1 * attackFlash, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "siege": {
      // Wide base + short barrel
      ctx.beginPath();
      ctx.moveTo(-s * 0.48, s * 0.32);
      ctx.lineTo(-s * 0.38, -s * 0.18);
      ctx.lineTo(s * 0.22, -s * 0.22);
      ctx.lineTo(s * 0.42, s * 0.32);
      ctx.closePath();
      strokeBody(ctx, fill, edge);
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(s * 0.05, -s * 0.12);
      ctx.lineTo(s * 0.58 + attackFlash * s * 0.08, -s * 0.04);
      ctx.lineTo(s * 0.58 + attackFlash * s * 0.08, s * 0.1);
      ctx.lineTo(s * 0.05, s * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = edge;
      ctx.stroke();
      if (attackFlash > 0.15) {
        ctx.fillStyle = "rgba(46, 230, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(s * 0.62, 0.02 * s, s * 0.12 * attackFlash, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "support": {
      // Soft disc + inner cross pip
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
      strokeBody(ctx, fill, edge);
      ctx.strokeStyle = tintHex(edge, 0.2);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, 0);
      ctx.lineTo(s * 0.16, 0);
      ctx.moveTo(0, -s * 0.16);
      ctx.lineTo(0, s * 0.16);
      ctx.stroke();
      // Quiet aura breath ring
      ctx.strokeStyle = `rgba(46, 230, 255, ${0.12 + attackFlash * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.52 + attackFlash * 0.06), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "energy": {
      // Angular diamond — cyber accent
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.48);
      ctx.lineTo(s * 0.36, 0);
      ctx.lineTo(0, s * 0.48);
      ctx.lineTo(-s * 0.36, 0);
      ctx.closePath();
      strokeBody(ctx, fill, theme.cyan);
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.22);
      ctx.lineTo(s * 0.16, 0);
      ctx.lineTo(0, s * 0.22);
      ctx.lineTo(-s * 0.16, 0);
      ctx.closePath();
      ctx.fill();
      if (attackFlash > 0.2) {
        ctx.strokeStyle = theme.cyan;
        ctx.globalAlpha = attackFlash;
        ctx.beginPath();
        ctx.moveTo(s * 0.36, 0);
        ctx.lineTo(s * 0.62, 0);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "swarm": {
      const blobs = [
        [0, 0, 0.28],
        [-0.28, -0.18, 0.16],
        [0.26, -0.14, 0.15],
        [0.1, 0.26, 0.14],
        [-0.2, 0.2, 0.13],
      ] as const;
      for (const [bx, by, br] of blobs) {
        ctx.beginPath();
        ctx.arc(bx * s, by * s, br * s, 0, Math.PI * 2);
        strokeBody(ctx, fill, edge, 1);
      }
      break;
    }
    default: {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.3);
      ctx.lineTo(s * 0.3, -s * 0.3);
      ctx.lineTo(s * 0.34, s * 0.3);
      ctx.lineTo(-s * 0.34, s * 0.3);
      ctx.closePath();
      strokeBody(ctx, fill, edge);
      break;
    }
  }
}

/**
 * Thin unit adapter. Nameplates stay off-canvas (shop/bench only).
 * Range ring only while selected.
 */
export function drawUnit(
  dc: DrawContext,
  unit: UnitInstance,
  state: RunState,
): void {
  if (!unit.tile) return;
  const def = getUnitDef(unit.defId);
  const { ctx, tileSize, timeMs } = dc;
  const cx = (unit.tile.x + 0.5) * tileSize;
  const cy = (unit.tile.y + 0.5) * tileSize;

  const era = (def?.era ?? 1) as 1 | 2 | 3 | 4 | 5;
  const fill = eraColor(era);
  const edge = tintHex(fill, 0.45);
  const role = unitRole(unit.defId, def?.tags);
  const selected = state.selectedInstanceId === unit.instanceId;

  // Size budget ≤ ~0.85 tile; star weight adds a hair of ring scale
  const starBoost = 1 + Math.min(unit.starLevel - 1, 4) * 0.025;
  const base = tileSize * 0.72 * starBoost;
  const phase = hashPhase(unit.instanceId);
  const breath = 1 + 0.028 * Math.sin(timeMs * 0.0032 + phase);

  // Attack pose: cooldown just reset → near full period
  const atkSpeed = def?.stats.attackSpeed ?? 1;
  const period = 1000 / Math.max(0.05, atkSpeed);
  const justFired = unit.cooldownMs > period * 0.72;
  const attackFlash = justFired
    ? Math.min(1, (unit.cooldownMs - period * 0.72) / (period * 0.28))
    : 0;

  const aim = targetWorld(unit, state.creeps);
  let facing = -Math.PI / 2; // default up-ish idle
  if (aim) {
    facing = Math.atan2(aim.y * tileSize - cy, aim.x * tileSize - cx);
  } else if (justFired) {
    facing = 0; // slight forward lean when flashing without target
  }

  if (selected) {
    const stats = effectiveStats(unit, state.metaApplied);
    if (stats) drawRangeHint(ctx, cx, cy, stats.range * tileSize);
    drawSelectRing(ctx, cx, cy, base * 0.48 * breath, tileSize <= 52);
  }

  // Higher stars: slightly heavier outline ring under body
  if (unit.starLevel >= 2) {
    ctx.save();
    ctx.strokeStyle = `rgba(240, 193, 74, ${0.18 + Math.min(unit.starLevel, 5) * 0.05})`;
    ctx.lineWidth = 1 + Math.min(unit.starLevel, 4) * 0.25;
    ctx.beginPath();
    ctx.arc(cx, cy, base * 0.5 * breath, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(facing);
  ctx.scale(breath, breath);
  drawSilhouette(ctx, role, base * 0.5, fill, edge, attackFlash);
  ctx.restore();

  drawStarPips(ctx, cx, cy, base * 0.5, unit.starLevel);
}
