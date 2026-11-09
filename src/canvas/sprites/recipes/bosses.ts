/**
 * Named era-boss silhouettes — distinct from generic creep_boss.
 * Magenta hostile body + gold/cyan corrupt accents; glow applied at draw time.
 */

import type { SpriteRecipe } from "../types";
import { clear, cxcy, fillStroke, magentaHostile } from "./helpers";
import { theme } from "../../theme";

type PaintFn = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
) => void;

function boss(id: string, paint: PaintFn): SpriteRecipe {
  return {
    id,
    kind: "creep",
    anims: ["idle"],
    drawScale: 0.92,
    paint(ctx, bakePx) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      paint(ctx, cx, cy, s);
    },
  };
}

function hexShell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  r: number,
): void {
  const { fill, shade, edge } = magentaHostile(true);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + Math.cos(a) * s * r;
    const py = cy + Math.sin(a) * s * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  fillStroke(ctx, fill, edge, 2);
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.16, 0, Math.PI * 2);
  fillStroke(ctx, shade, theme.cyan, 1.2);
}

export function buildBossRecipes(): SpriteRecipe[] {
  return [
    boss("boss_path_splitter", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 1);
      // Fork glyph
      ctx.strokeStyle = theme.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.45, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + s * 0.35, cy - s * 0.32);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + s * 0.35, cy + s * 0.32);
      ctx.stroke();
    }),
    boss("boss_tribe_warlord", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 0.95);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.2, cy - s * 0.55);
      ctx.lineTo(cx, cy - s * 0.85);
      ctx.lineTo(cx + s * 0.2, cy - s * 0.55);
      ctx.closePath();
      fillStroke(ctx, theme.gold, theme.cyan, 1.2);
      ctx.beginPath();
      ctx.arc(cx - s * 0.22, cy - s * 0.05, s * 0.1, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.22, cy - s * 0.05, s * 0.1, 0, Math.PI * 2);
      fillStroke(ctx, theme.gold, theme.cyan, 1);
    }),
    boss("boss_gold_tax", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 1);
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.38, 0, Math.PI * 2);
      fillStroke(ctx, theme.gold, theme.cyan, 1.4);
      ctx.fillStyle = magentaHostile(true).shade;
      ctx.font = `bold ${Math.round(s * 0.45)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("g", cx, cy + s * 0.04);
    }),
    boss("boss_siege_saint", (ctx, cx, cy, s) => {
      const { fill, shade, edge } = magentaHostile(true);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.85, cy + s * 0.55);
      ctx.lineTo(cx - s * 0.55, cy - s * 0.55);
      ctx.lineTo(cx + s * 0.55, cy - s * 0.55);
      ctx.lineTo(cx + s * 0.85, cy + s * 0.55);
      ctx.closePath();
      fillStroke(ctx, fill, edge, 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.7);
      ctx.lineTo(cx + s * 0.28, cy - s * 0.2);
      ctx.lineTo(cx - s * 0.28, cy - s * 0.2);
      ctx.closePath();
      fillStroke(ctx, theme.gold, theme.cyan, 1.3);
      ctx.beginPath();
      ctx.rect(cx - s * 0.22, cy - s * 0.1, s * 0.44, s * 0.4);
      fillStroke(ctx, shade, edge, 1.2);
    }),
    boss("boss_shop_lock", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 0.95);
      ctx.beginPath();
      ctx.rect(cx - s * 0.28, cy - s * 0.05, s * 0.56, s * 0.4);
      fillStroke(ctx, theme.gold, theme.cyan, 1.3);
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.12, s * 0.2, Math.PI, 0);
      ctx.strokeStyle = theme.cyan;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }),
    boss("boss_furnace_king", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 1);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.35, cy + s * 0.2);
      ctx.lineTo(cx - s * 0.2, cy - s * 0.35);
      ctx.lineTo(cx + s * 0.2, cy - s * 0.35);
      ctx.lineTo(cx + s * 0.35, cy + s * 0.2);
      ctx.closePath();
      fillStroke(ctx, "#D4A017", theme.gold, 1.3);
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.05, s * 0.12, 0, Math.PI * 2);
      fillStroke(ctx, "#FF8A4A", theme.cyan, 1);
    }),
    boss("boss_silence_choir", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 0.95);
      ctx.strokeStyle = theme.cyan;
      ctx.lineWidth = 1.6;
      for (const r of [0.35, 0.5, 0.65]) {
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(cx, cy, s * r, -0.9, 0.9);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.12, cy - s * 0.08);
      ctx.lineTo(cx + s * 0.12, cy - s * 0.08);
      ctx.lineTo(cx + s * 0.08, cy + s * 0.16);
      ctx.lineTo(cx - s * 0.08, cy + s * 0.16);
      ctx.closePath();
      fillStroke(ctx, theme.gold, theme.cyan, 1.1);
    }),
    boss("boss_blackout", (ctx, cx, cy, s) => {
      const { fill, edge } = magentaHostile(true);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + Math.cos(a) * s;
        const py = cy + Math.sin(a) * s;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      fillStroke(ctx, fill, edge, 2);
      // Dark core
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
      fillStroke(ctx, "#0A121A", theme.cyan, 1.4);
      ctx.strokeStyle = theme.gold;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.2, cy);
      ctx.lineTo(cx + s * 0.2, cy);
      ctx.stroke();
    }),
    boss("boss_endless_tax", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 1.02);
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      fillStroke(ctx, theme.gold, theme.cyan, 1.5);
      ctx.strokeStyle = magentaHostile(true).shade;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.22, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.18, cy + s * 0.12);
      ctx.lineTo(cx + s * 0.3, cy + s * 0.22);
      ctx.stroke();
    }),
    boss("boss_glitch_sovereign", (ctx, cx, cy, s) => {
      hexShell(ctx, cx, cy, s, 1.05);
      // Glitch bars
      ctx.fillStyle = theme.cyan;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(cx - s * 0.55, cy - s * 0.35, s * 0.35, s * 0.08);
      ctx.fillRect(cx + s * 0.15, cy + s * 0.2, s * 0.4, s * 0.07);
      ctx.fillStyle = theme.gold;
      ctx.fillRect(cx - s * 0.1, cy - s * 0.05, s * 0.45, s * 0.06);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.18, 0, Math.PI * 2);
      fillStroke(ctx, theme.cyan, theme.gold, 1.3);
    }),
  ];
}

export const UNIQUE_BOSS_IDS = buildBossRecipes().map((r) => r.id);
