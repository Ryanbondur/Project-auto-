import { TILE_SIZE_PX } from "../core/constants";
import { MAP, isPathTile } from "../content/map";
import { ERA_HUE, getUnitDef } from "../content/units";
import type { CreepInstance, RunState, UnitInstance } from "../core/types";

export type DrawContext = {
  ctx: CanvasRenderingContext2D;
  tileSize: number;
};

/** Thin adapters so art can replace stubs later without rewriting combat. */

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

  // Path outline for readability
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

export function drawUnit(dc: DrawContext, unit: UnitInstance): void {
  if (!unit.tile) return;
  const def = getUnitDef(unit.defId);
  const { ctx, tileSize } = dc;
  const cx = unit.tile.x * tileSize + tileSize / 2;
  const cy = unit.tile.y * tileSize + tileSize / 2;
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
  ctx.fillText("★".repeat(unit.starLevel), cx, cy + tileSize * 0.18);
}

export function drawCreep(dc: DrawContext, creep: CreepInstance): void {
  if (!creep.alive) return;
  const { ctx, tileSize } = dc;
  // Phase 1: creeps unused; adapter ready for Phase 3
  const waypoint = MAP.path[creep.pathIndex] ?? MAP.path[0];
  if (!waypoint) return;
  const next = MAP.path[creep.pathIndex + 1] ?? waypoint;
  const x = waypoint.x + (next.x - waypoint.x) * creep.pathT;
  const y = waypoint.y + (next.y - waypoint.y) * creep.pathT;
  const cx = x * tileSize + tileSize / 2;
  const cy = y * tileSize + tileSize / 2;
  const r = tileSize * 0.28;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#c45c4a";
  ctx.fill();
  ctx.strokeStyle = "#f0d0c8";
  ctx.stroke();
}

export function drawProjectile(
  dc: DrawContext,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  const { ctx, tileSize } = dc;
  ctx.strokeStyle = "#f0e6a8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x * tileSize, from.y * tileSize);
  ctx.lineTo(to.x * tileSize, to.y * tileSize);
  ctx.stroke();
}

export function renderBoard(ctx: CanvasRenderingContext2D, state: RunState): void {
  const tileSize = TILE_SIZE_PX;
  const dc: DrawContext = { ctx, tileSize };
  ctx.clearRect(0, 0, MAP.width * tileSize, MAP.height * tileSize);
  drawGrid(dc);
  for (const unit of state.board) drawUnit(dc, unit);
  for (const creep of state.creeps) drawCreep(dc, creep);
  // Highlight last clicked tile
  if (state.lastTileClick) {
    const { x, y, placeable } = state.lastTileClick;
    ctx.strokeStyle = placeable ? "#7ec8ff" : "#ff7e7e";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * tileSize + 1, y * tileSize + 1, tileSize - 2, tileSize - 2);
  }
}
