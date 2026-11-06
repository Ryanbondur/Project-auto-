import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";
import { getCreepDef } from "../content/creeps";
import { getPathSabotageDef } from "../content/pathSabotage";
import { creepWorldPos } from "../core/pathing";
import { projectileDrawPos } from "../core/combat";
import type { CreepInstance, Projectile, RunState } from "../core/types";
import { drawUnit, type DrawContext } from "./drawUnit";
import {
  drawBakedFrame,
  ensureSpriteAtlas,
  resolveCreepFrame,
} from "./sprites";
import { shadeHex, theme, tintHex } from "./theme";

export type { DrawContext };

/** World (tile-unit) → canvas pixels. Art swaps stay above this. */
export function worldToPx(
  wx: number,
  wy: number,
  tileSize: number,
): { x: number; y: number } {
  return { x: wx * tileSize, y: wy * tileSize };
}

/**
 * Thin draw adapters — sprite atlas + neon procedural fallbacks.
 * Combat / pathing / economy never depend on these shapes.
 * Swap: recipes / PNG drops behind drawUnit / drawCreep / drawProjectile;
 * keep signatures + world positions from the sim.
 */

function pathNeighbors(
  path: { x: number; y: number }[],
  index: number,
): {
  prev: { x: number; y: number } | null;
  next: { x: number; y: number } | null;
  corner: boolean;
} {
  const cur = path[index];
  const prev = index > 0 ? path[index - 1]! : null;
  const next = index < path.length - 1 ? path[index + 1]! : null;
  let corner = false;
  if (prev && next && cur) {
    const dx0 = cur.x - prev.x;
    const dy0 = cur.y - prev.y;
    const dx1 = next.x - cur.x;
    const dy1 = next.y - cur.y;
    corner = dx0 !== dx1 || dy0 !== dy1;
  }
  return { prev, next, corner };
}

function drawChevron(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  size: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = "rgba(46, 230, 255, 0.35)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, -size * 0.3);
  ctx.lineTo(size * 0.15, 0);
  ctx.lineTo(-size * 0.35, size * 0.3);
  ctx.stroke();
  ctx.restore();
}

export function drawGrid(
  dc: DrawContext,
  path: { x: number; y: number }[] = MAP.path,
): void {
  const { ctx, tileSize } = dc;
  const { width, height } = MAP;
  const phone = tileSize <= 52;
  const lane = path.length ? path : MAP.path;

  // Quiet void field
  ctx.fillStyle = theme.bgBoard;
  ctx.fillRect(0, 0, width * tileSize, height * tileSize);

  // Optional faint square grid — kept subtle so path carries the look
  ctx.strokeStyle = theme.gridLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileSize + 0.5, 0);
    ctx.lineTo(x * tileSize + 0.5, height * tileSize);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileSize + 0.5);
    ctx.lineTo(width * tileSize, y * tileSize + 0.5);
    ctx.stroke();
  }

  // Neon lane — dim fill under selective cyan edge glow
  for (const p of lane) {
    const px = p.x * tileSize;
    const py = p.y * tileSize;
    const inset = tileSize * 0.12;
    ctx.fillStyle = shadeHex(theme.cyanDim, 0.55);
    ctx.fillRect(px + inset * 0.35, py + inset * 0.35, tileSize - inset * 0.7, tileSize - inset * 0.7);
  }

  ctx.save();
  ctx.strokeStyle = theme.cyan;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.cyan;
  ctx.shadowBlur = phone ? theme.pathGlowBlur : theme.pathGlowBlur + 2;
  for (const p of lane) {
    const inset = tileSize * 0.14;
    ctx.strokeRect(
      p.x * tileSize + inset,
      p.y * tileSize + inset,
      tileSize - inset * 2,
      tileSize - inset * 2,
    );
  }
  ctx.restore();

  // Inner dim stroke (no glow) for lane body
  ctx.strokeStyle = "rgba(26, 143, 163, 0.55)";
  ctx.lineWidth = 1;
  for (const p of lane) {
    const inset = tileSize * 0.22;
    ctx.strokeRect(
      p.x * tileSize + inset,
      p.y * tileSize + inset,
      tileSize - inset * 2,
      tileSize - inset * 2,
    );
  }

  // Sparse chevrons — corners + every N tiles (not a sticker strip)
  const N = 5;
  for (let i = 0; i < lane.length - 1; i++) {
    const { next, corner } = pathNeighbors(lane, i);
    if (!next) continue;
    if (!corner && i % N !== 0) continue;
    const cur = lane[i]!;
    const cx = (cur.x + 0.5) * tileSize;
    const cy = (cur.y + 0.5) * tileSize;
    const angle = Math.atan2(next.y - cur.y, next.x - cur.x);
    drawChevron(ctx, cx, cy, angle, tileSize * 0.28);
  }

  // Modest exit beacon (path end) — not a crystal monument
  const exit = lane[lane.length - 1];
  if (exit) {
    const ex = (exit.x + 0.5) * tileSize;
    const ey = (exit.y + 0.5) * tileSize;
    ctx.save();
    ctx.strokeStyle = theme.danger;
    ctx.fillStyle = "rgba(255, 77, 106, 0.18)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = theme.danger;
    ctx.shadowBlur = phone ? 3 : 5;
    ctx.beginPath();
    ctx.arc(ex, ey, tileSize * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Start pip — quiet cyan
  const start = lane[0];
  if (start) {
    const sx = (start.x + 0.5) * tileSize;
    const sy = (start.y + 0.5) * tileSize;
    ctx.fillStyle = "rgba(46, 230, 255, 0.35)";
    ctx.beginPath();
    ctx.arc(sx, sy, tileSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw a placed sabotage marker (slow = gold tint; fork = cyan). */
export function drawSabotageMarker(
  dc: DrawContext,
  pathIndex: number,
  kind: "slow_segment" | "brief_fork" = "slow_segment",
  path: { x: number; y: number }[] = MAP.path,
): void {
  const tile = path[pathIndex];
  if (!tile) return;
  const { ctx, tileSize } = dc;
  const cx = tile.x * tileSize + tileSize / 2;
  const cy = tile.y * tileSize + tileSize / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, tileSize * 0.2, 0, Math.PI * 2);
  if (kind === "brief_fork") {
    ctx.fillStyle = "rgba(46, 230, 255, 0.22)";
    ctx.fill();
    ctx.strokeStyle = theme.cyan;
  } else {
    ctx.fillStyle = "rgba(240, 193, 74, 0.28)";
    ctx.fill();
    ctx.strokeStyle = theme.gold;
  }
  ctx.lineWidth = 1.25;
  ctx.stroke();
}

/**
 * Creep position comes from sim-owned `creep.x/y` (continuous tile units).
 * Sprite atlas first; magenta procedural fallback. Glow reserved for bosses.
 */
export function drawCreep(dc: DrawContext, creep: CreepInstance): void {
  if (!creep.alive) return;
  ensureSpriteAtlas();
  const { ctx, tileSize, timeMs } = dc;
  const def = getCreepDef(creep.defId);
  const world = creepWorldPos(creep);
  const { x: cx, y: cy } = worldToPx(world.x + 0.5, world.y + 0.5, tileSize);
  const boss = Boolean(def?.isBoss || creep.isBossCreep);
  const id = creep.defId;
  const maxHp = creep.maxHp > 0 ? creep.maxHp : (def?.maxHp ?? 1);
  const hpRatio = Math.max(0, creep.hp / maxHp);

  // Size language for HP bar / fallback silhouettes
  let scale = 0.55;
  if (id === "creep_runner") scale = 0.48;
  else if (id === "creep_tank") scale = 0.68;
  else if (id === "creep_swarm") scale = 0.38;
  else if (id === "creep_grunt") scale = 0.55;
  if (boss) scale = 0.9;
  const r = tileSize * 0.5 * scale;

  const frame = resolveCreepFrame(creep.defId, boss);

  ctx.save();
  if (boss) {
    const g = Math.sin(timeMs * 0.02) * 1.4;
    ctx.translate(g, -g * 0.4);
    ctx.shadowColor = theme.magenta;
    ctx.shadowBlur = theme.bossGlowBlur;
  }

  if (frame) {
    drawBakedFrame(ctx, frame, cx, cy, tileSize, 0, 1);
    if (boss) {
      // Light cyan glitch ghost — selective, boss only
      ctx.globalAlpha = 0.22;
      ctx.shadowBlur = 0;
      drawBakedFrame(ctx, frame, cx - 2.5, cy + 1.5, tileSize, 0, 1);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = boss ? tintHex(theme.magenta, 0.1) : theme.magenta;
    ctx.strokeStyle = boss ? theme.gold : tintHex(theme.magenta, 0.35);
    ctx.lineWidth = boss ? 2 : 1.25;

    ctx.beginPath();
    if (id === "creep_runner") {
      ctx.moveTo(cx, cy - r * 1.15);
      ctx.lineTo(cx + r * 0.55, cy);
      ctx.lineTo(cx, cy + r * 1.15);
      ctx.lineTo(cx - r * 0.55, cy);
      ctx.closePath();
    } else if (id === "creep_tank") {
      ctx.moveTo(cx - r * 0.85, cy + r * 0.55);
      ctx.lineTo(cx - r * 0.65, cy - r * 0.45);
      ctx.lineTo(cx + r * 0.65, cy - r * 0.45);
      ctx.lineTo(cx + r * 0.85, cy + r * 0.55);
      ctx.closePath();
    } else if (id === "creep_swarm") {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.9, cy + r * 0.7);
      ctx.lineTo(cx - r * 0.9, cy + r * 0.7);
      ctx.closePath();
    } else if (boss) {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    if (boss) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = theme.cyan;
      ctx.translate(-2.5, 1.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // Thin HP bar (+ shield segment for Shielded agenda)
  const barW = Math.max(r * 1.6, tileSize * 0.35);
  const barH = 2.5;
  const barY = cy - r - 7;
  ctx.fillStyle = "rgba(7, 11, 16, 0.85)";
  ctx.fillRect(cx - barW / 2, barY, barW, barH);
  ctx.fillStyle = hpRatio > 0.35 ? theme.cyanDim : theme.danger;
  ctx.fillRect(cx - barW / 2, barY, barW * hpRatio, barH);
  if (creep.shieldHp > 0) {
    const sh = Math.min(1, creep.shieldHp / Math.max(1, maxHp * 0.22));
    ctx.fillStyle = "rgba(46, 230, 255, 0.55)";
    ctx.fillRect(cx - barW / 2, barY - 3, barW * sh, 2);
  }
  if (creep.agendas?.length) {
    const mark = creep.agendas[0]!;
    const glyph =
      mark === "shielded"
        ? "S"
        : mark === "regen"
          ? "R"
          : mark === "splitter"
            ? "X"
            : mark === "siege"
              ? "G"
              : "H";
    ctx.fillStyle = theme.textDim;
    ctx.font = `600 ${Math.max(8, tileSize * 0.18)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(glyph, cx, cy + r + 8);
  }
}

/**
 * Projectile flight — clean cyan travel; soft impact near arrival.
 * Supports unit impressiveness; does not steal focus.
 */
export function drawProjectile(dc: DrawContext, projectile: Projectile): void {
  const { ctx, tileSize } = dc;
  const draw = projectileDrawPos(projectile);
  const { x: cx, y: cy } = worldToPx(draw.x, draw.y, tileSize);
  const { x: fx, y: fy } = worldToPx(projectile.from.x, projectile.from.y, tileSize);

  const aoe = projectile.aoeRadius > 0;
  const head = aoe ? theme.magenta : theme.cyan;
  const trail = aoe ? "rgba(255, 46, 200, 0.45)" : "rgba(46, 230, 255, 0.5)";

  const tx = fx + (cx - fx) * Math.max(0, projectile.progress - 0.22);
  const ty = fy + (cy - fy) * Math.max(0, projectile.progress - 0.22);

  ctx.strokeStyle = trail;
  ctx.lineWidth = aoe ? 2.25 : 1.75;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, tileSize * (aoe ? 0.1 : 0.08), 0, Math.PI * 2);
  ctx.fillStyle = head;
  ctx.fill();

  // Soft impact — selective glow only near arrival
  if (projectile.progress > 0.82) {
    const t = (projectile.progress - 0.82) / 0.18;
    ctx.save();
    ctx.strokeStyle = head;
    ctx.globalAlpha = 0.35 * t;
    ctx.lineWidth = 1.25;
    ctx.shadowColor = head;
    ctx.shadowBlur = theme.impactGlowBlur;
    ctx.beginPath();
    ctx.arc(cx, cy, tileSize * (0.14 + 0.12 * t), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (aoe && projectile.progress > 0.85) {
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      projectile.aoeRadius * tileSize * projectile.progress * 0.85,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = "rgba(255, 46, 200, 0.28)";
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  state: RunState,
  timeMs = performance.now(),
): void {
  const tileSize = TILE_SIZE_PX;
  const dc: DrawContext = { ctx, tileSize, timeMs };
  const path = state.path?.length ? state.path : MAP.path;
  ctx.clearRect(0, 0, MAP.width * tileSize, MAP.height * tileSize);
  drawGrid(dc, path);

  for (const s of state.pathSabotages) {
    if (s.placed && s.pathIndex !== null) {
      const def = getPathSabotageDef(s.defId);
      drawSabotageMarker(dc, s.pathIndex, def?.kind ?? "slow_segment", path);
    }
  }
  if (state.modifiers?.pathFork) {
    drawSabotageMarker(dc, state.modifiers.pathFork.pathIndex, "brief_fork", path);
  }
  for (const unit of state.board) drawUnit(dc, unit, state);
  for (const creep of state.creeps) drawCreep(dc, creep);
  for (const proj of state.projectiles) drawProjectile(dc, proj);

  // Placeable hint — subtle inset on last click only (not every empty pad)
  if (state.lastTileClick) {
    const { x, y, placeable } = state.lastTileClick;
    ctx.save();
    ctx.strokeStyle = placeable ? theme.cyan : theme.danger;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    const inset = 3;
    ctx.strokeRect(
      x * tileSize + inset,
      y * tileSize + inset,
      tileSize - inset * 2,
      tileSize - inset * 2,
    );
    ctx.restore();
  }
}
