/**
 * Hand-crafted unique idle/fire sheets for the full unit roster (Eras 1–5).
 * Silhouette-first, era-tinted, selective cyan muzzle on fire.
 */

import type { SpriteAnim, SpriteRecipe } from "../types";
import {
  clear,
  cxcy,
  eraFill,
  fillStroke,
  muzzleFlash,
  paintBarrel,
  paintEnergyDiamond,
  paintShieldPlate,
  paintSiegeBase,
  paintSupportDisc,
  paintSwarmBlobs,
  paintTorso,
} from "./helpers";

type Era = 1 | 2 | 3 | 4 | 5;
type PaintFn = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  colors: ReturnType<typeof eraFill>,
  fire: boolean,
) => void;

function unit(
  id: string,
  era: Era,
  drawScale: number,
  paint: PaintFn,
): SpriteRecipe {
  return {
    id,
    kind: "unit",
    anims: ["idle", "fire"],
    drawScale,
    paint(ctx, bakePx, anim: SpriteAnim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      paint(ctx, cx, cy, s, eraFill(era), anim === "fire");
    },
  };
}

// —— Era 1 ——
const era1: SpriteRecipe[] = [
  unit("unit_slinger", 1, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx, cy, s, c.fill, c.edge, { w: 0.3, h: 0.32 });
    ctx.beginPath();
    ctx.arc(cx - s * 0.06, cy + s * 0.04, s * 0.15, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.2);
    const stretch = fire ? 1.2 : 1;
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.1, cy - s * 0.08);
    ctx.quadraticCurveTo(
      cx + s * 0.52 * stretch,
      cy - s * 0.48 * stretch,
      cx + s * 0.64 * stretch,
      cy - s * 0.04,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * 0.64 * stretch, cy - s * 0.04, s * (fire ? 0.12 : 0.1), 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
    muzzleFlash(ctx, cx + s * 0.74 * stretch, cy, s * 0.1, fire ? "fire" : "idle");
  }),
  unit("unit_spearman", 1, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintShieldPlate(ctx, cx, cy, s, c.fill, c.edge, c.shade);
    const thrust = fire ? s * 0.2 : 0;
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.08, cy);
    ctx.lineTo(cx + s * 0.58 + thrust, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy - s * 0.1);
    ctx.lineTo(cx + s * 0.74 + thrust, cy);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.1);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.2);
  }),
  unit("unit_tribe_drummer", 1, 0.78, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy, s, c.fill, c.edge, c.tip, fire);
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.06, s * 0.28, s * 0.2, 0, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.3);
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.08, s * 0.26, s * 0.1, 0, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
    const lift = fire ? -s * 0.2 : -s * 0.06;
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy - s * 0.05);
    ctx.lineTo(cx + s * 0.44, cy + lift);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * 0.44, cy + lift, s * 0.08, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
  }),
  unit("unit_boulder_roll", 1, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy, s, c.fill, c.edge);
    const roll = fire ? s * 0.16 : 0;
    ctx.beginPath();
    ctx.arc(cx + s * 0.1 + roll, cy - s * 0.24, s * 0.3, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.55);
    ctx.beginPath();
    ctx.arc(cx + roll, cy - s * 0.32, s * 0.1, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
    if (fire) muzzleFlash(ctx, cx + s * 0.48 + roll, cy - s * 0.18, s * 0.12, "fire");
  }),
  unit("unit_clubber", 1, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.04, cy, s, c.fill, c.edge, { w: 0.28, h: 0.36 });
    const swing = fire ? -0.35 : -0.12;
    ctx.save();
    ctx.translate(cx + s * 0.12, cy - s * 0.05);
    ctx.rotate(swing);
    ctx.fillStyle = c.shade;
    ctx.fillRect(0, -s * 0.06, s * 0.55, s * 0.12);
    ctx.beginPath();
    ctx.arc(s * 0.58, 0, s * 0.16, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.2);
    ctx.restore();
  }),
  unit("unit_net_hunter", 1, 0.78, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx, cy, s, c.fill, c.edge);
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.6;
    const reach = fire ? 0.7 : 0.52;
    ctx.beginPath();
    ctx.arc(cx + s * 0.2, cy - s * 0.05, s * reach, -0.6, 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.15, cy - s * 0.35);
    ctx.lineTo(cx + s * (0.15 + reach * 0.85), cy - s * 0.45);
    ctx.moveTo(cx + s * 0.15, cy + s * 0.25);
    ctx.lineTo(cx + s * (0.15 + reach * 0.85), cy + s * 0.35);
    ctx.stroke();
    if (fire) muzzleFlash(ctx, cx + s * 0.72, cy, s * 0.09, "fire");
  }),
  unit("unit_torch_pack", 1, 0.76, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s, c.fill, c.edge, fire, c.tip);
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy - s * 0.35);
    ctx.lineTo(cx + s * 0.32, cy - s * 0.55);
    ctx.lineTo(cx + s * 0.08, cy - s * 0.5);
    ctx.closePath();
    fillStroke(ctx, fire ? "#FF8A4A" : c.tip, c.edge, 1);
  }),
  unit("unit_bone_shaman", 1, 0.78, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s, c.fill, c.shade, fire);
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.55, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - s * 0.18, cy - s * 0.28, s * 0.07, 0, Math.PI * 2);
    ctx.arc(cx + s * 0.18, cy - s * 0.28, s * 0.07, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
  }),
];

// —— Era 2 ——
const era2: SpriteRecipe[] = [
  unit("unit_archer", 2, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.06, cy, s, c.fill, c.edge, { w: 0.26, h: 0.34 });
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + s * 0.08, cy, s * 0.42, -1.2, 1.2);
    ctx.stroke();
    const draw = fire ? 0.18 : 0;
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.08, cy - s * 0.4);
    ctx.lineTo(cx - s * 0.05 - draw, cy);
    ctx.lineTo(cx + s * 0.08, cy + s * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.02, cy);
    ctx.lineTo(cx + s * (0.55 + draw), cy);
    ctx.stroke();
    if (fire) muzzleFlash(ctx, cx + s * 0.62, cy, s * 0.08, "fire");
  }),
  unit("unit_knight", 2, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintShieldPlate(ctx, cx, cy, s, c.fill, c.edge, c.shade);
    // Helm crest
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.08, cy - s * 0.52);
    ctx.lineTo(cx + s * 0.05, cy - s * 0.72);
    ctx.lineTo(cx + s * 0.16, cy - s * 0.48);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1);
    const thrust = fire ? s * 0.16 : 0;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.22, cy - s * 0.08);
    ctx.lineTo(cx + s * 0.68 + thrust, cy);
    ctx.lineTo(cx + s * 0.22, cy + s * 0.08);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.15);
  }),
  unit("unit_catapult", 2, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy, s, c.fill, c.edge);
    const arm = fire ? -0.55 : -0.25;
    ctx.save();
    ctx.translate(cx - s * 0.05, cy + s * 0.05);
    ctx.rotate(arm);
    ctx.fillStyle = c.shade;
    ctx.fillRect(0, -s * 0.05, s * 0.7, s * 0.1);
    ctx.beginPath();
    ctx.arc(s * 0.72, 0, s * 0.14, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.2);
    ctx.restore();
    if (fire) muzzleFlash(ctx, cx + s * 0.55, cy - s * 0.35, s * 0.12, "fire");
  }),
  unit("unit_monk", 2, 0.76, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy, s, c.fill, c.edge, c.tip, fire);
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.28);
    ctx.lineTo(cx + s * 0.18, cy + s * 0.12);
    ctx.lineTo(cx - s * 0.18, cy + s * 0.12);
    ctx.closePath();
    fillStroke(ctx, c.shade, c.edge, 1.2);
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, s * (fire ? 0.48 : 0.4), 0, Math.PI * 2);
    ctx.stroke();
  }),
  unit("unit_pikeman", 2, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.1, cy, s, c.fill, c.edge, { w: 0.24, h: 0.36 });
    const thrust = fire ? s * 0.22 : 0;
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, cy + s * 0.05);
    ctx.lineTo(cx + s * 0.72 + thrust, cy - s * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.55 + thrust, cy - s * 0.18);
    ctx.lineTo(cx + s * 0.82 + thrust, cy - s * 0.08);
    ctx.lineTo(cx + s * 0.55 + thrust, cy + s * 0.02);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.1);
  }),
  unit("unit_crossbow", 2, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.08, cy, s, c.fill, c.edge);
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.05, cy - s * 0.32);
    ctx.lineTo(cx + s * 0.35, cy - s * 0.32);
    ctx.moveTo(cx - s * 0.05, cy + s * 0.32);
    ctx.lineTo(cx + s * 0.35, cy + s * 0.32);
    ctx.moveTo(cx + s * 0.15, cy - s * 0.32);
    ctx.lineTo(cx + s * 0.15, cy + s * 0.32);
    ctx.stroke();
    const bolt = fire ? 0.58 : 0.42;
    paintBarrel(ctx, cx + s * 0.05, cy, s, c.shade, c.edge, bolt, 0.12);
    muzzleFlash(ctx, cx + s * (0.05 + bolt), cy, s * 0.1, fire ? "fire" : "idle");
  }),
  unit("unit_war_hounds", 2, 0.76, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s * 0.95, c.fill, c.edge, false);
    // Ear tips
    for (const ox of [-0.22, 0.18]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * ox, cy - s * 0.35);
      ctx.lineTo(cx + s * (ox + 0.08), cy - s * 0.55);
      ctx.lineTo(cx + s * (ox + 0.14), cy - s * 0.32);
      ctx.closePath();
      fillStroke(ctx, c.tip, c.edge, 1);
    }
    if (fire) muzzleFlash(ctx, cx + s * 0.4, cy - s * 0.05, s * 0.08, "fire");
  }),
  unit("unit_banner_bearer", 2, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy + s * 0.08, s * 0.9, c.fill, c.edge, c.tip, fire);
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.05, cy + s * 0.35);
    ctx.lineTo(cx - s * 0.05, cy - s * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.05, cy - s * 0.55);
    ctx.lineTo(cx + s * 0.42, cy - s * 0.42);
    ctx.lineTo(cx - s * 0.05, cy - s * 0.28);
    ctx.closePath();
    fillStroke(ctx, fire ? c.tip : c.shade, c.edge, 1.2);
  }),
];

// —— Era 3 ——
const era3: SpriteRecipe[] = [
  unit("unit_musket", 3, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.1, cy, s, c.fill, c.edge);
    const len = fire ? 0.62 : 0.5;
    paintBarrel(ctx, cx - s * 0.02, cy - s * 0.02, s, c.shade, c.edge, len, 0.14);
    ctx.beginPath();
    ctx.rect(cx - s * 0.18, cy + s * 0.08, s * 0.22, s * 0.18);
    fillStroke(ctx, c.tip, c.edge, 1);
    muzzleFlash(ctx, cx - s * 0.02 + s * len, cy - s * 0.02, s * 0.11, fire ? "fire" : "idle");
  }),
  unit("unit_cannon", 3, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy, s, c.fill, c.edge);
    const len = fire ? 0.7 : 0.55;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.15, cy - s * 0.12);
    ctx.lineTo(cx + s * len, cy - s * 0.06);
    ctx.lineTo(cx + s * len, cy + s * 0.14);
    ctx.lineTo(cx - s * 0.15, cy + s * 0.18);
    ctx.closePath();
    fillStroke(ctx, c.shade, c.edge, 1.4);
    ctx.beginPath();
    ctx.arc(cx - s * 0.28, cy + s * 0.28, s * 0.14, 0, Math.PI * 2);
    ctx.arc(cx + s * 0.22, cy + s * 0.28, s * 0.14, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.1);
    muzzleFlash(ctx, cx + s * len, cy + s * 0.04, s * 0.13, fire ? "fire" : "idle");
  }),
  unit("unit_gatling", 3, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.12, cy, s, c.fill, c.edge, { w: 0.28, h: 0.3 });
    for (let i = 0; i < 3; i++) {
      const y = cy - s * 0.14 + i * s * 0.14;
      paintBarrel(ctx, cx - s * 0.02, y, s, c.shade, c.edge, fire ? 0.55 : 0.42, 0.08);
    }
    muzzleFlash(ctx, cx + s * 0.52, cy, s * 0.12, fire ? "fire" : "idle");
  }),
  unit("unit_medic_steam", 3, 0.76, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy, s, c.fill, c.edge, c.tip, fire);
    ctx.beginPath();
    ctx.rect(cx - s * 0.18, cy - s * 0.14, s * 0.36, s * 0.28);
    fillStroke(ctx, c.shade, c.edge, 1.2);
    // Steam puff
    ctx.globalAlpha = fire ? 0.55 : 0.28;
    ctx.beginPath();
    ctx.arc(cx + s * 0.28, cy - s * 0.32, s * 0.1, 0, Math.PI * 2);
    ctx.arc(cx + s * 0.4, cy - s * 0.42, s * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = c.tip;
    ctx.fill();
    ctx.globalAlpha = 1;
  }),
  unit("unit_steam_knight", 3, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintShieldPlate(ctx, cx, cy, s, c.fill, c.edge, c.shade);
    ctx.beginPath();
    ctx.rect(cx - s * 0.12, cy - s * 0.12, s * 0.2, s * 0.24);
    fillStroke(ctx, c.tip, c.edge, 1);
    const smash = fire ? s * 0.18 : 0;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy - s * 0.12);
    ctx.lineTo(cx + s * 0.55 + smash, cy);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.12);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.2);
  }),
  unit("unit_sapper", 3, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.04, s * 0.92, c.fill, c.edge);
    ctx.beginPath();
    ctx.arc(cx + s * 0.08, cy - s * 0.18, s * 0.22, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.3);
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.08, cy - s * 0.18);
    ctx.lineTo(cx + s * 0.08, cy - s * 0.42);
    ctx.strokeStyle = fire ? "#2EE6FF" : c.tip;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (fire) muzzleFlash(ctx, cx + s * 0.08, cy - s * 0.45, s * 0.1, "fire");
  }),
  unit("unit_flare_gunner", 3, 0.78, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s * 0.92, c.fill, c.shade, false);
    paintBarrel(ctx, cx + s * 0.05, cy - s * 0.18, s, c.tip, c.edge, 0.4, 0.1);
    ctx.beginPath();
    ctx.arc(cx + s * (fire ? 0.55 : 0.48), cy - s * 0.18, s * 0.1, 0, Math.PI * 2);
    fillStroke(ctx, fire ? "#FFB347" : c.tip, c.edge, 1);
    if (fire) muzzleFlash(ctx, cx + s * 0.62, cy - s * 0.18, s * 0.1, "fire");
  }),
  unit("unit_coal_beetles", 3, 0.74, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s, c.fill, c.edge, fire, c.tip);
    for (const [ox, oy] of [
      [-0.2, -0.22],
      [0.22, -0.16],
    ] as const) {
      ctx.beginPath();
      ctx.ellipse(cx + s * ox, cy + s * oy, s * 0.12, s * 0.08, 0.4, 0, Math.PI * 2);
      fillStroke(ctx, c.shade, c.edge, 1);
    }
  }),
];

// —— Era 4 ——
const era4: SpriteRecipe[] = [
  unit("unit_m16_soldier", 4, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.1, cy, s, c.fill, c.edge, { w: 0.26, h: 0.34 });
    // Vest plate
    ctx.beginPath();
    ctx.rect(cx - s * 0.18, cy - s * 0.12, s * 0.22, s * 0.28);
    fillStroke(ctx, c.shade, c.edge, 1);
    const len = fire ? 0.58 : 0.48;
    paintBarrel(ctx, cx, cy - s * 0.02, s, c.tip, c.edge, len, 0.12);
    muzzleFlash(ctx, cx + s * len, cy - s * 0.02, s * 0.1, fire ? "fire" : "idle");
  }),
  unit("unit_sniper", 4, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.14, cy, s, c.fill, c.edge, { w: 0.24, h: 0.32 });
    paintBarrel(ctx, cx - s * 0.05, cy, s, c.shade, c.edge, fire ? 0.72 : 0.62, 0.1);
    ctx.beginPath();
    ctx.rect(cx + s * 0.05, cy - s * 0.16, s * 0.16, s * 0.1);
    fillStroke(ctx, c.tip, c.edge, 1);
    muzzleFlash(ctx, cx + s * 0.65, cy, s * 0.09, fire ? "fire" : "idle");
  }),
  unit("unit_rpg", 4, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.06, s * 0.9, c.fill, c.edge);
    const len = fire ? 0.68 : 0.55;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, cy - s * 0.1);
    ctx.lineTo(cx + s * len, cy - s * 0.16);
    ctx.lineTo(cx + s * len, cy + s * 0.08);
    ctx.lineTo(cx - s * 0.2, cy + s * 0.14);
    ctx.closePath();
    fillStroke(ctx, c.shade, c.edge, 1.4);
    ctx.beginPath();
    ctx.arc(cx + s * len, cy - s * 0.04, s * 0.12, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
    muzzleFlash(ctx, cx + s * len + s * 0.08, cy - s * 0.04, s * 0.12, fire ? "fire" : "idle");
  }),
  unit("unit_drone_spotter", 4, 0.76, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy + s * 0.1, s * 0.85, c.fill, c.edge, c.tip, fire);
    // Rotor arms
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 1.8;
    for (const a of [0.4, 2.0, 3.6, 5.2]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.15);
      ctx.lineTo(cx + Math.cos(a) * s * 0.42, cy - s * 0.15 + Math.sin(a) * s * 0.42);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.15, s * 0.12, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
  }),
  unit("unit_riot_shield", 4, 0.82, (ctx, cx, cy, s, c, fire) => {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.32, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.28, cy - s * 0.46);
    ctx.lineTo(cx + s * 0.34, cy + s * 0.46);
    ctx.lineTo(cx - s * 0.34, cy + s * 0.5);
    ctx.closePath();
    fillStroke(ctx, c.fill, c.edge, 1.7);
    ctx.beginPath();
    ctx.rect(cx - s * 0.18, cy - s * 0.2, s * 0.3, s * 0.4);
    fillStroke(ctx, c.shade, c.edge, 1.1);
    if (fire) {
      ctx.strokeStyle = "#2EE6FF";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - s * 0.22, cy - s * 0.24, s * 0.38, s * 0.48);
      ctx.globalAlpha = 1;
    }
  }),
  unit("unit_mortar", 4, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.08, s * 0.88, c.fill, c.edge);
    ctx.save();
    ctx.translate(cx - s * 0.05, cy + s * 0.05);
    ctx.rotate(fire ? -1.05 : -0.85);
    paintBarrel(ctx, 0, 0, s, c.shade, c.edge, 0.55, 0.16);
    ctx.restore();
    if (fire) muzzleFlash(ctx, cx + s * 0.35, cy - s * 0.4, s * 0.11, "fire");
  }),
  unit("unit_ew_jammer", 4, 0.78, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s, c.fill, c.shade, fire);
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.4;
    for (const r of [0.45, 0.58]) {
      ctx.globalAlpha = fire ? 0.55 : 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, s * r, -0.8, 0.8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }),
  unit("unit_drone_swarm", 4, 0.74, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s, c.fill, c.edge, fire, "#2EE6FF");
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.35, cy);
    ctx.lineTo(cx + s * 0.35, cy);
    ctx.moveTo(cx, cy - s * 0.3);
    ctx.lineTo(cx, cy + s * 0.3);
    ctx.stroke();
  }),
];

// —— Era 5 ——
const era5: SpriteRecipe[] = [
  unit("unit_laser_grid", 5, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s, c.fill, c.shade, fire);
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = fire ? 0.85 : 0.45;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.4, cy - s * 0.2);
    ctx.lineTo(cx + s * 0.4, cy - s * 0.2);
    ctx.moveTo(cx - s * 0.4, cy + s * 0.2);
    ctx.lineTo(cx + s * 0.4, cy + s * 0.2);
    ctx.moveTo(cx - s * 0.2, cy - s * 0.4);
    ctx.lineTo(cx - s * 0.2, cy + s * 0.4);
    ctx.moveTo(cx + s * 0.2, cy - s * 0.4);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }),
  unit("unit_nano_swarm", 5, 0.74, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s, c.fill, c.edge, fire, "#2EE6FF");
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, s * (fire ? 0.58 : 0.48), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }),
  unit("unit_shield_bot", 5, 0.78, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy, s, c.fill, c.edge, c.tip, fire);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, cy - s * 0.08);
    ctx.lineTo(cx, cy - s * 0.28);
    ctx.lineTo(cx + s * 0.22, cy - s * 0.08);
    ctx.lineTo(cx + s * 0.18, cy + s * 0.22);
    ctx.lineTo(cx - s * 0.18, cy + s * 0.22);
    ctx.closePath();
    fillStroke(ctx, c.shade, "#2EE6FF", 1.3);
  }),
  unit("unit_rail_turret", 5, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.06, s, c.fill, c.edge);
    const len = fire ? 0.72 : 0.58;
    paintBarrel(ctx, cx - s * 0.1, cy - s * 0.08, s, c.shade, "#2EE6FF", len, 0.14);
    ctx.beginPath();
    ctx.arc(cx - s * 0.15, cy + s * 0.18, s * 0.16, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.1);
    if (fire) {
      ctx.strokeStyle = "#2EE6FF";
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.1 + s * len, cy - s * 0.08);
      ctx.lineTo(cx - s * 0.1 + s * len + s * 0.25, cy - s * 0.08);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }),
  unit("unit_plasma_blade", 5, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.08, cy, s, c.fill, c.edge);
    ctx.save();
    ctx.translate(cx + s * 0.1, cy);
    ctx.rotate(fire ? -0.35 : -0.1);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.08);
    ctx.lineTo(s * 0.62, 0);
    ctx.lineTo(0, s * 0.08);
    ctx.closePath();
    fillStroke(ctx, "#2EE6FF", c.edge, 1.2);
    ctx.restore();
    if (fire) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#2EE6FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + s * 0.2, cy, s * 0.5, -0.8, 0.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }),
  unit("unit_orbit_laser", 5, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s * 0.85, c.fill, c.shade, false);
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = fire ? 0.7 : 0.35;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.55, s * 0.22, -0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * 0.45, cy - s * 0.2, s * 0.1, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, "#2EE6FF", 1);
    ctx.globalAlpha = 1;
    if (fire) muzzleFlash(ctx, cx + s * 0.55, cy - s * 0.2, s * 0.1, "fire");
  }),
  unit("unit_hack_node", 5, 0.76, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy, s, c.fill, c.edge, c.tip, fire);
    ctx.fillStyle = c.shade;
    ctx.fillRect(cx - s * 0.16, cy - s * 0.16, s * 0.32, s * 0.32);
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1.3;
    ctx.strokeRect(cx - s * 0.16, cy - s * 0.16, s * 0.32, s * 0.32);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.08, cy);
    ctx.lineTo(cx + s * 0.08, cy);
    ctx.moveTo(cx, cy - s * 0.08);
    ctx.lineTo(cx, cy + s * 0.08);
    ctx.stroke();
  }),
  unit("unit_pixel_mites", 5, 0.74, (ctx, cx, cy, s, c, fire) => {
    const cells = [
      [0, 0],
      [-0.28, -0.16],
      [0.26, -0.2],
      [0.18, 0.24],
      [-0.24, 0.22],
      [0.02, -0.34],
    ] as const;
    for (const [bx, by] of cells) {
      ctx.beginPath();
      ctx.rect(cx + bx * s - s * 0.1, cy + by * s - s * 0.1, s * 0.2, s * 0.2);
      fillStroke(ctx, c.fill, c.edge, 1);
    }
    ctx.beginPath();
    ctx.rect(cx - s * 0.06, cy - s * 0.06, s * 0.12, s * 0.12);
    fillStroke(ctx, fire ? "#FF2EC8" : c.tip, c.edge, 1);
    if (fire) muzzleFlash(ctx, cx + s * 0.36, cy - s * 0.12, s * 0.08, "fire");
  }),
];

export function buildUniqueUnitRecipes(): SpriteRecipe[] {
  return [...era1, ...era2, ...era3, ...era4, ...era5];
}

export const UNIQUE_UNIT_IDS = buildUniqueUnitRecipes().map((r) => r.id);
