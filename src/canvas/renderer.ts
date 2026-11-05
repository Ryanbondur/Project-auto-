import { TILE_SIZE_PX } from "../core/constants";
import { MAP, isPathTile } from "../content/map";
import { getCreepDef } from "../content/creeps";
import { getPathSabotageDef } from "../content/pathSabotage";
import { ERA_HUE, getUnitDef } from "../content/units";
import { creepWorldPos } from "../core/pathing";
import { projectileDrawPos } from "../core/combat";
import type { CreepInstance, Projectile, RunState, UnitInstance } from "../core/types";

export type DrawContext = {
  ctx: CanvasRenderingContext2D;
  tileSize: number;
};

/** World (tile-unit) → canvas pixels. Art swaps stay above this. */
export function worldToPx(
  wx: number,
  wy: number,
  tileSize: number,
): { x: number; y: number } {
  return { x: wx * tileSize, y: wy * tileSize };
}

/**
 * Thin draw adapters — placeholder skins only.
 * Combat / pathing / economy never depend on these shapes.
 * Later art: replace bodies of drawUnit / drawCreep / drawProjectile;
 * keep signatures + world positions from the sim.
 */

export function drawGrid(dc: DrawContext): void {
  const { ctx, tileSize } = dc;
  const { width, height } = MAP;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x * tileSize;
      const py = y * tileSize;
      if (isPathTile(x, y)) {
        ctx.fillStyle = "#3d4a3a";
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#1e2430" : "#232a38";
      }
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);
    }
  }

  ctx.strokeStyle = "#6b8f71";
  ctx.lineWidth = 2;
  for (const p of MAP.path) {
    ctx.strokeRect(
      p.x * tileSize + 2,
      p.y * tileSize + 2,
      tileSize - 4,
      tileSize - 4,
    );
  }
}

/** Draw a placed sabotage marker (slow = amber; fork = cyan). */
export function drawSabotageMarker(
  dc: DrawContext,
  pathIndex: number,
  kind: "slow_segment" | "brief_fork" = "slow_segment",
): void {
  const tile = MAP.path[pathIndex];
  if (!tile) return;
  const { ctx, tileSize } = dc;
  const cx = tile.x * tileSize + tileSize / 2;
  const cy = tile.y * tileSize + tileSize / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, tileSize * 0.22, 0, Math.PI * 2);
  if (kind === "brief_fork") {
    ctx.fillStyle = "rgba(80, 160, 200, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "#6ec8e8";
  } else {
    ctx.fillStyle = "rgba(180, 140, 40, 0.45)";
    ctx.fill();
    ctx.strokeStyle = "#d4b84a";
  }
  ctx.stroke();
}

export function drawUnit(dc: DrawContext, unit: UnitInstance): void {
  if (!unit.tile) return;
  const def = getUnitDef(unit.defId);
  const { ctx, tileSize } = dc;
  // Sim owns tile placement; adapter only presents.
  const cx = (unit.tile.x + 0.5) * tileSize;
  const cy = (unit.tile.y + 0.5) * tileSize;
  const size = tileSize * 0.62;
  const hue = def ? ERA_HUE[def.era] : 0;

  ctx.fillStyle = `hsl(${hue} 55% 42%)`;
  ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
  ctx.strokeStyle = "#e8e6e0";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);

  ctx.fillStyle = "#f4f2ec";
  ctx.font = `bold ${Math.floor(tileSize * 0.22)}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = def?.name.slice(0, 4) ?? "?";
  ctx.fillText(label, cx, cy - 4);
  ctx.fillText("★".repeat(Math.min(unit.starLevel, 5)), cx, cy + tileSize * 0.18);
}

/**
 * Creep position comes from sim-owned `creep.x/y` (continuous tile units).
 * Never snap to integer tile centers here — art swaps keep this adapter thin.
 */
export function drawCreep(dc: DrawContext, creep: CreepInstance): void {
  if (!creep.alive) return;
  const { ctx, tileSize } = dc;
  const def = getCreepDef(creep.defId);
  const world = creepWorldPos(creep);
  const { x: cx, y: cy } = worldToPx(world.x + 0.5, world.y + 0.5, tileSize);
  const boss = def?.isBoss ?? false;
  const r = tileSize * (boss ? 0.38 : 0.26);
  const maxHp = creep.maxHp > 0 ? creep.maxHp : (def?.maxHp ?? 1);
  const hpRatio = Math.max(0, creep.hp / maxHp);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = boss ? "#8b2e3a" : "#c45c4a";
  ctx.fill();
  ctx.strokeStyle = boss ? "#f5c842" : "#f0d0c8";
  ctx.lineWidth = boss ? 2.5 : 1.5;
  ctx.stroke();

  // Tiny HP stub bar (skin only)
  const barW = r * 2;
  const barH = 3;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - barW / 2, cy - r - 8, barW, barH);
  ctx.fillStyle = hpRatio > 0.35 ? "#6b8f71" : "#c45c4a";
  ctx.fillRect(cx - barW / 2, cy - r - 8, barW * hpRatio, barH);
}

/**
 * Projectile flight position from sim (`projectileDrawPos`); canvas only strokes it.
 */
export function drawProjectile(dc: DrawContext, projectile: Projectile): void {
  const { ctx, tileSize } = dc;
  const draw = projectileDrawPos(projectile);
  const { x: cx, y: cy } = worldToPx(draw.x, draw.y, tileSize);
  const { x: fx, y: fy } = worldToPx(projectile.from.x, projectile.from.y, tileSize);

  // Short trail from recent segment (placeholder line + head dot)
  ctx.strokeStyle = "rgba(240, 230, 168, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx + (cx - fx) * Math.max(0, projectile.progress - 0.2), fy + (cy - fy) * Math.max(0, projectile.progress - 0.2));
  ctx.lineTo(cx, cy);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, tileSize * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "#f5efb0";
  ctx.fill();
  ctx.strokeStyle = "#fff6c8";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (projectile.aoeRadius > 0 && projectile.progress > 0.85) {
    ctx.beginPath();
    ctx.arc(cx, cy, projectile.aoeRadius * tileSize * projectile.progress, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(240, 200, 120, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function renderBoard(ctx: CanvasRenderingContext2D, state: RunState): void {
  const tileSize = TILE_SIZE_PX;
  const dc: DrawContext = { ctx, tileSize };
  ctx.clearRect(0, 0, MAP.width * tileSize, MAP.height * tileSize);
  drawGrid(dc);

  for (const s of state.pathSabotages) {
    if (s.placed && s.pathIndex !== null) {
      const def = getPathSabotageDef(s.defId);
      drawSabotageMarker(dc, s.pathIndex, def?.kind ?? "slow_segment");
    }
  }
  for (const unit of state.board) drawUnit(dc, unit);
  for (const creep of state.creeps) drawCreep(dc, creep);
  for (const proj of state.projectiles) drawProjectile(dc, proj);

  if (state.lastTileClick) {
    const { x, y, placeable } = state.lastTileClick;
    ctx.strokeStyle = placeable ? "#7ec8ff" : "#ff7e7e";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
  }
}
