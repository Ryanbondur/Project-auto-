/** Shared paint helpers for minimal-premium neon sprites. */

import { shadeHex, theme, tintHex } from "../../theme";

export function clear(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.clearRect(0, 0, size, size);
}

export function cxcy(size: number): { cx: number; cy: number; s: number } {
  return { cx: size / 2, cy: size / 2, s: size * 0.42 };
}

export function fillStroke(
  ctx: CanvasRenderingContext2D,
  fill: string,
  stroke: string,
  lineW = 1.5,
): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineW;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

export function muzzleFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  anim: "idle" | "fire",
): void {
  if (anim !== "fire") return;
  ctx.save();
  ctx.fillStyle = theme.cyan;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function eraFill(era: 1 | 2 | 3 | 4 | 5): {
  fill: string;
  shade: string;
  edge: string;
  tip: string;
} {
  const fill = theme.era[era];
  return {
    fill,
    shade: shadeHex(fill, 0.32),
    edge: tintHex(fill, 0.42),
    tip: tintHex(fill, 0.28),
  };
}

export function magentaHostile(boss = false): {
  fill: string;
  shade: string;
  edge: string;
} {
  const fill = boss ? tintHex(theme.magenta, 0.08) : theme.magenta;
  return {
    fill,
    shade: shadeHex(theme.magenta, 0.35),
    edge: boss ? theme.gold : tintHex(theme.magenta, 0.32),
  };
}
