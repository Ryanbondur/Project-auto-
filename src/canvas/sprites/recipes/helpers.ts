/** Shared paint helpers for minimal-premium neon sprites. */

import { shadeHex, theme, tintHex } from "../../theme";
import type { SpriteAnim } from "../types";

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
  anim: SpriteAnim,
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

/** Soft impact tick — selective cyan/magenta bloom for hit FX frames. */
export function impactBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  strength = 0.55,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = strength;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = strength * 0.35;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.85, 0, Math.PI * 2);
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

/** Compact torso poly used by many unique units. */
export function paintTorso(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fill: string,
  edge: string,
  opts?: { w?: number; h?: number; skew?: number },
): void {
  const w = opts?.w ?? 0.3;
  const h = opts?.h ?? 0.34;
  const skew = opts?.skew ?? 0.04;
  ctx.beginPath();
  ctx.moveTo(cx - s * w, cy - s * h);
  ctx.lineTo(cx + s * (w - skew), cy - s * (h + 0.02));
  ctx.lineTo(cx + s * (w + 0.04), cy + s * h);
  ctx.lineTo(cx - s * (w + 0.06), cy + s * h);
  ctx.closePath();
  fillStroke(ctx, fill, edge, 1.55);
}

export function paintShieldPlate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fill: string,
  edge: string,
  shade: string,
): void {
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.28, cy - s * 0.48);
  ctx.lineTo(cx + s * 0.22, cy - s * 0.4);
  ctx.lineTo(cx + s * 0.34, cy);
  ctx.lineTo(cx + s * 0.22, cy + s * 0.4);
  ctx.lineTo(cx - s * 0.28, cy + s * 0.48);
  ctx.lineTo(cx - s * 0.42, cy);
  ctx.closePath();
  fillStroke(ctx, fill, edge, 1.7);
  ctx.beginPath();
  ctx.arc(cx - s * 0.04, cy, s * 0.12, 0, Math.PI * 2);
  fillStroke(ctx, shade, edge, 1);
}

export function paintBarrel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  shade: string,
  edge: string,
  length: number,
  thick = 0.18,
): void {
  ctx.fillStyle = shade;
  ctx.fillRect(cx, cy - s * (thick / 2), s * length, s * thick);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(cx, cy - s * (thick / 2), s * length, s * thick);
}

export function paintSupportDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fill: string,
  edge: string,
  tip: string,
  fire: boolean,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2);
  fillStroke(ctx, fill, edge, 1.55);
  ctx.strokeStyle = tip;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.16, cy);
  ctx.lineTo(cx + s * 0.16, cy);
  ctx.moveTo(cx, cy - s * 0.16);
  ctx.lineTo(cx, cy + s * 0.16);
  ctx.stroke();
  ctx.strokeStyle = `rgba(46, 230, 255, ${fire ? 0.28 : 0.14})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, s * (0.52 + (fire ? 0.06 : 0)), 0, Math.PI * 2);
  ctx.stroke();
}

export function paintEnergyDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fill: string,
  shade: string,
  fire: boolean,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.5);
  ctx.lineTo(cx + s * 0.36, cy);
  ctx.lineTo(cx, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.36, cy);
  ctx.closePath();
  fillStroke(ctx, fill, "#2EE6FF", 1.6);
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.22);
  ctx.lineTo(cx + s * 0.16, cy);
  ctx.lineTo(cx, cy + s * 0.22);
  ctx.lineTo(cx - s * 0.16, cy);
  ctx.closePath();
  fillStroke(ctx, shade, tintHex(fill, 0.4), 1);
  if (fire) {
    ctx.strokeStyle = "#2EE6FF";
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.36, cy);
    ctx.lineTo(cx + s * 0.66, cy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function paintSwarmBlobs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fill: string,
  edge: string,
  fire: boolean,
  accent?: string,
): void {
  const blobs = [
    [0, 0, 0.28],
    [-0.28, -0.18, 0.16],
    [0.26, -0.14, 0.15],
    [0.1, 0.26, 0.14],
    [-0.2, 0.2, 0.13],
  ] as const;
  for (const [bx, by, br] of blobs) {
    ctx.beginPath();
    ctx.arc(cx + bx * s, cy + by * s, br * s, 0, Math.PI * 2);
    fillStroke(ctx, fill, edge, 1.1);
  }
  if (accent) {
    ctx.beginPath();
    ctx.arc(cx + s * 0.08, cy - s * 0.06, s * 0.08, 0, Math.PI * 2);
    fillStroke(ctx, accent, edge, 1);
  }
  if (fire) muzzleFlash(ctx, cx + s * 0.36, cy - s * 0.1, s * 0.08, "fire");
}

export function paintSiegeBase(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fill: string,
  edge: string,
): void {
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.52, cy + s * 0.36);
  ctx.lineTo(cx - s * 0.38, cy - s * 0.18);
  ctx.lineTo(cx + s * 0.2, cy - s * 0.22);
  ctx.lineTo(cx + s * 0.48, cy + s * 0.36);
  ctx.closePath();
  fillStroke(ctx, fill, edge, 1.65);
}
