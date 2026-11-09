/**
 * Hand-crafted unique idle/fire sheets for the full unit roster (Eras 1–5).
 * Bold silhouettes for phone tiles; fire frames lean + extend weapons.
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
  paintGroundShadow,
  paintHead,
  paintShieldPlate,
  paintSiegeBase,
  paintSupportDisc,
  paintSwarmBlobs,
  paintTorso,
  withFirePose,
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
      const fire = anim === "fire";
      const colors = eraFill(era);
      paintGroundShadow(ctx, cx, cy, s, fire);
      withFirePose(ctx, cx, cy, fire, () => {
        paint(ctx, cx, cy, s, colors, fire);
      });
    },
  };
}

// —— Era 1 ——
const era1: SpriteRecipe[] = [
  unit("unit_slinger", 1, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.04, cy + s * 0.06, s, c.fill, c.edge, {
      w: 0.28,
      h: 0.3,
    });
    paintHead(ctx, cx - s * 0.02, cy - s * 0.28, s, c.tip, c.edge);
    ctx.beginPath();
    ctx.arc(cx - s * 0.1, cy + s * 0.1, s * 0.14, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.2);
    const stretch = fire ? 1.35 : 1;
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.08, cy - s * 0.05);
    ctx.quadraticCurveTo(
      cx + s * 0.55 * stretch,
      cy - s * 0.55 * stretch,
      cx + s * 0.7 * stretch,
      cy - s * 0.02,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      cx + s * 0.7 * stretch,
      cy - s * 0.02,
      s * (fire ? 0.14 : 0.11),
      0,
      Math.PI * 2,
    );
    fillStroke(ctx, c.tip, c.edge, 1.1);
    muzzleFlash(ctx, cx + s * 0.82 * stretch, cy, s * 0.12, fire ? "fire" : "idle");
  }),
  unit("unit_spearman", 1, 0.88, (ctx, cx, cy, s, c, fire) => {
    paintShieldPlate(ctx, cx - s * 0.06, cy + s * 0.04, s, c.fill, c.edge, c.shade);
    paintHead(ctx, cx - s * 0.02, cy - s * 0.42, s * 0.9, c.tip, c.edge, {
      helm: true,
    });
    const thrust = fire ? s * 0.28 : 0;
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.12, cy + s * 0.05);
    ctx.lineTo(cx + s * 0.62 + thrust, cy - s * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.28 + thrust * 0.3, cy - s * 0.12);
    ctx.lineTo(cx + s * 0.82 + thrust, cy - s * 0.02);
    ctx.lineTo(cx + s * 0.28 + thrust * 0.3, cy + s * 0.08);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.25);
  }),
  unit("unit_tribe_drummer", 1, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy + s * 0.04, s, c.fill, c.edge, c.tip, fire);
    paintHead(ctx, cx, cy - s * 0.38, s * 0.85, c.tip, c.edge);
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.1, s * 0.3, s * 0.22, 0, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.35);
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.05, s * 0.28, s * 0.12, 0, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.1);
    const lift = fire ? -s * 0.28 : -s * 0.08;
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.22, cy);
    ctx.lineTo(cx + s * 0.48, cy + lift);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * 0.48, cy + lift, s * 0.1, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
    if (fire) {
      ctx.strokeStyle = "rgba(46, 230, 255, 0.4)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
  }),
  unit("unit_boulder_roll", 1, 0.9, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.06, s, c.fill, c.edge);
    const roll = fire ? s * 0.22 : 0;
    ctx.beginPath();
    ctx.arc(cx + s * 0.08 + roll, cy - s * 0.28, s * 0.34, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.7);
    ctx.beginPath();
    ctx.arc(cx - s * 0.05 + roll, cy - s * 0.38, s * 0.12, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1);
    // Cracks
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx + roll, cy - s * 0.4);
    ctx.lineTo(cx + s * 0.12 + roll, cy - s * 0.18);
    ctx.stroke();
    if (fire) muzzleFlash(ctx, cx + s * 0.55 + roll, cy - s * 0.2, s * 0.14, "fire");
  }),
  unit("unit_clubber", 1, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.08, cy + s * 0.05, s, c.fill, c.edge, {
      w: 0.3,
      h: 0.34,
    });
    paintHead(ctx, cx - s * 0.06, cy - s * 0.3, s, c.tip, c.edge);
    const swing = fire ? -0.55 : -0.15;
    ctx.save();
    ctx.translate(cx + s * 0.1, cy);
    ctx.rotate(swing);
    ctx.fillStyle = c.shade;
    ctx.fillRect(0, -s * 0.07, s * 0.58, s * 0.14);
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, -s * 0.07, s * 0.58, s * 0.14);
    ctx.beginPath();
    ctx.arc(s * 0.65, 0, s * 0.2, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.3);
    ctx.restore();
    if (fire) {
      ctx.strokeStyle = "rgba(46, 230, 255, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + s * 0.15, cy, s * 0.55, -1.1, 0.2);
      ctx.stroke();
    }
  }),
  unit("unit_net_hunter", 1, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.06, cy + s * 0.04, s, c.fill, c.edge);
    paintHead(ctx, cx - s * 0.04, cy - s * 0.3, s * 0.9, c.tip, c.edge);
    const reach = fire ? 0.82 : 0.55;
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx + s * 0.15, cy, s * reach, -0.7, 0.7);
    ctx.stroke();
    // Net mesh
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) {
      const a = -0.45 + i * 0.45;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.15, cy);
      ctx.lineTo(
        cx + s * 0.15 + Math.cos(a) * s * reach,
        cy + Math.sin(a) * s * reach,
      );
      ctx.stroke();
    }
    if (fire) muzzleFlash(ctx, cx + s * 0.78, cy, s * 0.1, "fire");
  }),
  unit("unit_torch_pack", 1, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy + s * 0.04, s, c.fill, c.edge, false, c.tip);
    const torchY = fire ? -s * 0.62 : -s * 0.48;
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.18, cy - s * 0.1);
    ctx.lineTo(cx + s * 0.28, cy + torchY + s * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy + torchY);
    ctx.lineTo(cx + s * 0.38, cy + torchY - s * 0.22);
    ctx.lineTo(cx + s * 0.12, cy + torchY - s * 0.18);
    ctx.closePath();
    fillStroke(ctx, fire ? "#FF8A4A" : c.tip, c.edge, 1.1);
    if (fire) muzzleFlash(ctx, cx + s * 0.28, cy + torchY - s * 0.2, s * 0.12, "fire");
  }),
  unit("unit_bone_shaman", 1, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s, c.fill, c.shade, fire);
    paintHead(ctx, cx, cy - s * 0.08, s * 0.7, c.tip, c.edge);
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, s * (fire ? 0.62 : 0.52), 0.15, Math.PI - 0.15);
    ctx.stroke();
    // Bone horns
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * s * 0.12, cy - s * 0.22);
      ctx.lineTo(cx + sx * s * 0.28, cy - s * 0.48);
      ctx.lineTo(cx + sx * s * 0.08, cy - s * 0.32);
      ctx.closePath();
      fillStroke(ctx, c.tip, c.edge, 1);
    }
  }),
];

// —— Era 2 ——
const era2: SpriteRecipe[] = [
  unit("unit_archer", 2, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.1, cy + s * 0.04, s, c.fill, c.edge, {
      w: 0.24,
      h: 0.32,
    });
    paintHead(ctx, cx - s * 0.08, cy - s * 0.3, s * 0.9, c.tip, c.edge);
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.arc(cx + s * 0.05, cy, s * 0.48, -1.25, 1.25);
    ctx.stroke();
    const draw = fire ? 0.28 : 0.05;
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.05, cy - s * 0.46);
    ctx.lineTo(cx - s * 0.12 - draw, cy);
    ctx.lineTo(cx + s * 0.05, cy + s * 0.46);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.08, cy);
    ctx.lineTo(cx + s * (0.62 + draw), cy);
    ctx.stroke();
    // Fletching
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.35, cy - s * 0.08);
    ctx.lineTo(cx + s * 0.28, cy);
    ctx.lineTo(cx + s * 0.35, cy + s * 0.08);
    ctx.stroke();
    if (fire) muzzleFlash(ctx, cx + s * 0.72, cy, s * 0.1, "fire");
  }),
  unit("unit_knight", 2, 0.88, (ctx, cx, cy, s, c, fire) => {
    paintShieldPlate(ctx, cx - s * 0.04, cy + s * 0.04, s, c.fill, c.edge, c.shade);
    paintHead(ctx, cx, cy - s * 0.42, s, c.tip, c.edge, {
      helm: true,
      crest: c.tip,
    });
    const thrust = fire ? s * 0.24 : 0;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.22, cy - s * 0.1);
    ctx.lineTo(cx + s * 0.72 + thrust, cy);
    ctx.lineTo(cx + s * 0.22, cy + s * 0.1);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.2);
    // Cross on shield
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.18, cy);
    ctx.lineTo(cx + s * 0.12, cy);
    ctx.moveTo(cx - s * 0.03, cy - s * 0.18);
    ctx.lineTo(cx - s * 0.03, cy + s * 0.18);
    ctx.stroke();
  }),
  unit("unit_catapult", 2, 0.9, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.08, s, c.fill, c.edge);
    // Wheels
    for (const ox of [-0.28, 0.22]) {
      ctx.beginPath();
      ctx.arc(cx + s * ox, cy + s * 0.38, s * 0.14, 0, Math.PI * 2);
      fillStroke(ctx, c.shade, c.edge, 1.2);
    }
    const arm = fire ? -0.85 : -0.35;
    ctx.save();
    ctx.translate(cx - s * 0.08, cy + s * 0.02);
    ctx.rotate(arm);
    ctx.fillStyle = c.shade;
    ctx.fillRect(0, -s * 0.06, s * 0.75, s * 0.12);
    ctx.beginPath();
    ctx.arc(s * 0.8, 0, s * 0.16, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.25);
    ctx.restore();
    if (fire) muzzleFlash(ctx, cx + s * 0.5, cy - s * 0.45, s * 0.14, "fire");
  }),
  unit("unit_monk", 2, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy + s * 0.06, s, c.fill, c.edge, c.tip, fire);
    paintHead(ctx, cx, cy - s * 0.28, s * 0.85, c.tip, c.edge);
    // Robe triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.12);
    ctx.lineTo(cx + s * 0.22, cy + s * 0.28);
    ctx.lineTo(cx - s * 0.22, cy + s * 0.28);
    ctx.closePath();
    fillStroke(ctx, c.shade, c.edge, 1.25);
    ctx.strokeStyle = fire ? "#2EE6FF" : c.tip;
    ctx.lineWidth = 1.7;
    ctx.globalAlpha = fire ? 0.7 : 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, s * (fire ? 0.58 : 0.45), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }),
  unit("unit_pikeman", 2, 0.88, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.14, cy + s * 0.04, s, c.fill, c.edge, {
      w: 0.22,
      h: 0.34,
    });
    paintHead(ctx, cx - s * 0.12, cy - s * 0.3, s * 0.85, c.tip, c.edge, {
      helm: true,
    });
    const thrust = fire ? s * 0.32 : 0;
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.25, cy + s * 0.1);
    ctx.lineTo(cx + s * 0.78 + thrust, cy - s * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.58 + thrust, cy - s * 0.24);
    ctx.lineTo(cx + s * 0.9 + thrust, cy - s * 0.12);
    ctx.lineTo(cx + s * 0.58 + thrust, cy);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.15);
  }),
  unit("unit_crossbow", 2, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.12, cy + s * 0.04, s, c.fill, c.edge);
    paintHead(ctx, cx - s * 0.1, cy - s * 0.28, s * 0.85, c.tip, c.edge);
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.08, cy - s * 0.36);
    ctx.lineTo(cx + s * 0.4, cy - s * 0.36);
    ctx.moveTo(cx - s * 0.08, cy + s * 0.36);
    ctx.lineTo(cx + s * 0.4, cy + s * 0.36);
    ctx.moveTo(cx + s * 0.16, cy - s * 0.36);
    ctx.lineTo(cx + s * 0.16, cy + s * 0.36);
    ctx.stroke();
    const bolt = fire ? 0.68 : 0.45;
    paintBarrel(ctx, cx, cy, s, c.shade, c.edge, bolt, 0.12);
    muzzleFlash(ctx, cx + s * bolt, cy, s * 0.11, fire ? "fire" : "idle");
  }),
  unit("unit_war_hounds", 2, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy + s * 0.04, s, c.fill, c.edge, false);
    for (const ox of [-0.26, 0.2]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * ox, cy - s * 0.32);
      ctx.lineTo(cx + s * (ox + 0.1), cy - s * 0.58);
      ctx.lineTo(cx + s * (ox + 0.16), cy - s * 0.28);
      ctx.closePath();
      fillStroke(ctx, c.tip, c.edge, 1);
    }
    // Snout
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy);
    ctx.lineTo(cx + s * 0.48, cy + s * 0.04);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.12);
    ctx.closePath();
    fillStroke(ctx, c.shade, c.edge, 1);
    if (fire) muzzleFlash(ctx, cx + s * 0.52, cy, s * 0.1, "fire");
  }),
  unit("unit_banner_bearer", 2, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy + s * 0.12, s * 0.88, c.fill, c.edge, c.tip, fire);
    paintHead(ctx, cx - s * 0.08, cy - s * 0.18, s * 0.8, c.tip, c.edge);
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.02, cy + s * 0.35);
    ctx.lineTo(cx + s * 0.02, cy - s * 0.62);
    ctx.stroke();
    const flap = fire ? 0.5 : 0.4;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.02, cy - s * 0.62);
    ctx.lineTo(cx + s * flap, cy - s * 0.48);
    ctx.lineTo(cx + s * 0.02, cy - s * 0.3);
    ctx.closePath();
    fillStroke(ctx, fire ? c.tip : c.shade, c.edge, 1.25);
  }),
];

// —— Era 3 ——
const era3: SpriteRecipe[] = [
  unit("unit_musket", 3, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.14, cy + s * 0.04, s, c.fill, c.edge);
    paintHead(ctx, cx - s * 0.12, cy - s * 0.28, s * 0.85, c.tip, c.edge, {
      helm: true,
    });
    const len = fire ? 0.72 : 0.52;
    paintBarrel(ctx, cx - s * 0.02, cy - s * 0.04, s, c.shade, c.edge, len, 0.15);
    ctx.beginPath();
    ctx.rect(cx - s * 0.22, cy + s * 0.1, s * 0.24, s * 0.2);
    fillStroke(ctx, c.tip, c.edge, 1);
    muzzleFlash(ctx, cx - s * 0.02 + s * len, cy - s * 0.04, s * 0.13, fire ? "fire" : "idle");
  }),
  unit("unit_cannon", 3, 0.9, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.08, s, c.fill, c.edge);
    const len = fire ? 0.78 : 0.58;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.18, cy - s * 0.14);
    ctx.lineTo(cx + s * len, cy - s * 0.08);
    ctx.lineTo(cx + s * len, cy + s * 0.16);
    ctx.lineTo(cx - s * 0.18, cy + s * 0.2);
    ctx.closePath();
    fillStroke(ctx, c.shade, c.edge, 1.5);
    for (const ox of [-0.3, 0.2]) {
      ctx.beginPath();
      ctx.arc(cx + s * ox, cy + s * 0.36, s * 0.15, 0, Math.PI * 2);
      fillStroke(ctx, c.tip, c.edge, 1.15);
    }
    muzzleFlash(ctx, cx + s * len, cy + s * 0.04, s * 0.15, fire ? "fire" : "idle");
  }),
  unit("unit_gatling", 3, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.16, cy + s * 0.04, s, c.fill, c.edge, {
      w: 0.28,
      h: 0.3,
    });
    paintHead(ctx, cx - s * 0.14, cy - s * 0.26, s * 0.8, c.tip, c.edge);
    for (let i = 0; i < 4; i++) {
      const y = cy - s * 0.18 + i * s * 0.12;
      paintBarrel(ctx, cx - s * 0.02, y, s, c.shade, c.edge, fire ? 0.6 : 0.44, 0.07);
    }
    muzzleFlash(ctx, cx + s * 0.55, cy, s * 0.14, fire ? "fire" : "idle");
  }),
  unit("unit_medic_steam", 3, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy + s * 0.04, s, c.fill, c.edge, c.tip, fire);
    paintHead(ctx, cx - s * 0.08, cy - s * 0.22, s * 0.75, c.tip, c.edge);
    ctx.beginPath();
    ctx.rect(cx - s * 0.2, cy - s * 0.12, s * 0.4, s * 0.3);
    fillStroke(ctx, c.shade, c.edge, 1.25);
    // Cross
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.1, cy + s * 0.02);
    ctx.lineTo(cx + s * 0.1, cy + s * 0.02);
    ctx.moveTo(cx, cy - s * 0.08);
    ctx.lineTo(cx, cy + s * 0.12);
    ctx.stroke();
    ctx.globalAlpha = fire ? 0.6 : 0.3;
    ctx.fillStyle = c.tip;
    ctx.beginPath();
    ctx.arc(cx + s * 0.32, cy - s * 0.35, s * 0.1, 0, Math.PI * 2);
    ctx.arc(cx + s * 0.44, cy - s * 0.48, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }),
  unit("unit_steam_knight", 3, 0.88, (ctx, cx, cy, s, c, fire) => {
    paintShieldPlate(ctx, cx - s * 0.04, cy + s * 0.04, s, c.fill, c.edge, c.shade);
    paintHead(ctx, cx, cy - s * 0.4, s, c.tip, c.edge, { helm: true });
    ctx.beginPath();
    ctx.rect(cx - s * 0.14, cy - s * 0.1, s * 0.22, s * 0.26);
    fillStroke(ctx, c.tip, c.edge, 1.1);
    const smash = fire ? s * 0.26 : 0;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy - s * 0.14);
    ctx.lineTo(cx + s * 0.6 + smash, cy);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.14);
    ctx.closePath();
    fillStroke(ctx, c.tip, c.edge, 1.25);
    if (fire) muzzleFlash(ctx, cx + s * 0.7, cy, s * 0.12, "fire");
  }),
  unit("unit_sapper", 3, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.08, s * 0.92, c.fill, c.edge);
    paintHead(ctx, cx - s * 0.15, cy - s * 0.15, s * 0.7, c.tip, c.edge, {
      helm: true,
    });
    ctx.beginPath();
    ctx.arc(cx + s * 0.12, cy - s * 0.2, s * 0.24, 0, Math.PI * 2);
    fillStroke(ctx, c.shade, c.edge, 1.35);
    ctx.strokeStyle = fire ? "#2EE6FF" : c.tip;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.12, cy - s * 0.2);
    ctx.lineTo(cx + s * 0.12, cy - s * (fire ? 0.55 : 0.42));
    ctx.stroke();
    if (fire) muzzleFlash(ctx, cx + s * 0.12, cy - s * 0.58, s * 0.12, "fire");
  }),
  unit("unit_flare_gunner", 3, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx - s * 0.06, cy, s * 0.9, c.fill, c.shade, false);
    paintHead(ctx, cx - s * 0.06, cy - s * 0.05, s * 0.65, c.tip, c.edge);
    paintBarrel(ctx, cx + s * 0.08, cy - s * 0.2, s, c.tip, c.edge, 0.45, 0.11);
    ctx.beginPath();
    ctx.arc(cx + s * (fire ? 0.62 : 0.52), cy - s * 0.2, s * 0.12, 0, Math.PI * 2);
    fillStroke(ctx, fire ? "#FFB347" : c.tip, c.edge, 1.1);
    if (fire) {
      muzzleFlash(ctx, cx + s * 0.7, cy - s * 0.2, s * 0.12, "fire");
      ctx.strokeStyle = "rgba(255, 179, 71, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + s * 0.55, cy - s * 0.2, s * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
  }),
  unit("unit_coal_beetles", 3, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s, c.fill, c.edge, fire, c.tip);
    for (const [ox, oy] of [
      [-0.22, -0.24],
      [0.24, -0.18],
      [0.05, 0.28],
    ] as const) {
      ctx.beginPath();
      ctx.ellipse(cx + s * ox, cy + s * oy, s * 0.14, s * 0.09, 0.35, 0, Math.PI * 2);
      fillStroke(ctx, c.shade, c.edge, 1);
    }
  }),
];

// —— Era 4 ——
const era4: SpriteRecipe[] = [
  unit("unit_m16_soldier", 4, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.14, cy + s * 0.04, s, c.fill, c.edge, {
      w: 0.26,
      h: 0.32,
    });
    paintHead(ctx, cx - s * 0.12, cy - s * 0.28, s * 0.85, c.tip, c.edge, {
      helm: true,
    });
    ctx.beginPath();
    ctx.rect(cx - s * 0.2, cy - s * 0.1, s * 0.24, s * 0.3);
    fillStroke(ctx, c.shade, c.edge, 1.1);
    const len = fire ? 0.66 : 0.5;
    paintBarrel(ctx, cx, cy - s * 0.02, s, c.tip, c.edge, len, 0.12);
    // Mag
    ctx.beginPath();
    ctx.rect(cx + s * 0.08, cy + s * 0.08, s * 0.1, s * 0.16);
    fillStroke(ctx, c.shade, c.edge, 1);
    muzzleFlash(ctx, cx + s * len, cy - s * 0.02, s * 0.11, fire ? "fire" : "idle");
  }),
  unit("unit_sniper", 4, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.18, cy + s * 0.04, s, c.fill, c.edge, {
      w: 0.22,
      h: 0.3,
    });
    paintHead(ctx, cx - s * 0.16, cy - s * 0.26, s * 0.8, c.tip, c.edge, {
      helm: true,
    });
    paintBarrel(ctx, cx - s * 0.05, cy, s, c.shade, c.edge, fire ? 0.8 : 0.65, 0.1);
    ctx.beginPath();
    ctx.rect(cx + s * 0.08, cy - s * 0.18, s * 0.18, s * 0.12);
    fillStroke(ctx, c.tip, c.edge, 1.1);
    // Bipod
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.35, cy + s * 0.05);
    ctx.lineTo(cx + s * 0.28, cy + s * 0.28);
    ctx.moveTo(cx + s * 0.35, cy + s * 0.05);
    ctx.lineTo(cx + s * 0.45, cy + s * 0.28);
    ctx.stroke();
    muzzleFlash(ctx, cx + s * 0.72, cy, s * 0.1, fire ? "fire" : "idle");
  }),
  unit("unit_rpg", 4, 0.9, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.1, s * 0.9, c.fill, c.edge);
    paintHead(ctx, cx - s * 0.2, cy - s * 0.12, s * 0.7, c.tip, c.edge, {
      helm: true,
    });
    const len = fire ? 0.75 : 0.58;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, cy - s * 0.12);
    ctx.lineTo(cx + s * len, cy - s * 0.18);
    ctx.lineTo(cx + s * len, cy + s * 0.1);
    ctx.lineTo(cx - s * 0.22, cy + s * 0.16);
    ctx.closePath();
    fillStroke(ctx, c.shade, c.edge, 1.45);
    ctx.beginPath();
    ctx.arc(cx + s * len, cy - s * 0.04, s * 0.14, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.1);
    muzzleFlash(ctx, cx + s * len + s * 0.1, cy - s * 0.04, s * 0.14, fire ? "fire" : "idle");
  }),
  unit("unit_drone_spotter", 4, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy + s * 0.16, s * 0.82, c.fill, c.edge, c.tip, fire);
    ctx.strokeStyle = c.shade;
    ctx.lineWidth = 2;
    for (const a of [0.35, 1.9, 3.5, 5.1]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.18);
      ctx.lineTo(
        cx + Math.cos(a) * s * 0.48,
        cy - s * 0.18 + Math.sin(a) * s * 0.48,
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.18, s * 0.16, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.2);
    // Camera eye
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.18, s * 0.06, 0, Math.PI * 2);
    fillStroke(ctx, fire ? "#2EE6FF" : c.shade, c.edge, 1);
  }),
  unit("unit_riot_shield", 4, 0.88, (ctx, cx, cy, s, c, fire) => {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.34, cy - s * 0.52);
    ctx.lineTo(cx + s * 0.3, cy - s * 0.48);
    ctx.lineTo(cx + s * 0.36, cy + s * 0.48);
    ctx.lineTo(cx - s * 0.36, cy + s * 0.52);
    ctx.closePath();
    fillStroke(ctx, c.fill, c.edge, 1.8);
    ctx.beginPath();
    ctx.rect(cx - s * 0.2, cy - s * 0.22, s * 0.32, s * 0.44);
    fillStroke(ctx, c.shade, c.edge, 1.15);
    paintHead(ctx, cx - s * 0.22, cy - s * 0.05, s * 0.65, c.tip, c.edge, {
      helm: true,
    });
    if (fire) {
      ctx.strokeStyle = "#2EE6FF";
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(cx - s * 0.26, cy - s * 0.28, s * 0.44, s * 0.56);
      ctx.globalAlpha = 1;
    }
  }),
  unit("unit_mortar", 4, 0.88, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.12, s * 0.88, c.fill, c.edge);
    ctx.save();
    ctx.translate(cx - s * 0.05, cy + s * 0.02);
    ctx.rotate(fire ? -1.15 : -0.9);
    paintBarrel(ctx, 0, 0, s, c.shade, c.edge, 0.6, 0.18);
    ctx.restore();
    // Bipod
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.1);
    ctx.lineTo(cx - s * 0.28, cy + s * 0.38);
    ctx.moveTo(cx, cy + s * 0.1);
    ctx.lineTo(cx + s * 0.22, cy + s * 0.38);
    ctx.stroke();
    if (fire) muzzleFlash(ctx, cx + s * 0.38, cy - s * 0.48, s * 0.13, "fire");
  }),
  unit("unit_ew_jammer", 4, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s, c.fill, c.shade, fire);
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.6;
    for (const r of [0.42, 0.58, 0.72]) {
      ctx.globalAlpha = fire ? 0.6 : 0.28;
      ctx.beginPath();
      ctx.arc(cx, cy, s * r, -0.9, 0.9);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Antenna
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.2);
    ctx.lineTo(cx, cy - s * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.58, s * 0.07, 0, Math.PI * 2);
    fillStroke(ctx, fire ? "#2EE6FF" : c.tip, c.edge, 1);
  }),
  unit("unit_drone_swarm", 4, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s, c.fill, c.edge, fire, "#2EE6FF");
    ctx.strokeStyle = c.tip;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.4, cy);
    ctx.lineTo(cx + s * 0.4, cy);
    ctx.moveTo(cx, cy - s * 0.35);
    ctx.lineTo(cx, cy + s * 0.35);
    ctx.stroke();
  }),
];

// —— Era 5 ——
const era5: SpriteRecipe[] = [
  unit("unit_laser_grid", 5, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s, c.fill, c.shade, fire);
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = fire ? 0.9 : 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.45, cy - s * 0.22);
    ctx.lineTo(cx + s * 0.45, cy - s * 0.22);
    ctx.moveTo(cx - s * 0.45, cy + s * 0.22);
    ctx.lineTo(cx + s * 0.45, cy + s * 0.22);
    ctx.moveTo(cx - s * 0.22, cy - s * 0.45);
    ctx.lineTo(cx - s * 0.22, cy + s * 0.45);
    ctx.moveTo(cx + s * 0.22, cy - s * 0.45);
    ctx.lineTo(cx + s * 0.22, cy + s * 0.45);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (fire) {
      ctx.strokeStyle = "#2EE6FF";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.36, cy);
      ctx.lineTo(cx + s * 0.75, cy);
      ctx.stroke();
    }
  }),
  unit("unit_nano_swarm", 5, 0.8, (ctx, cx, cy, s, c, fire) => {
    paintSwarmBlobs(ctx, cx, cy, s, c.fill, c.edge, fire, "#2EE6FF");
    ctx.globalAlpha = fire ? 0.55 : 0.35;
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, s * (fire ? 0.65 : 0.5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }),
  unit("unit_shield_bot", 5, 0.84, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy, s, c.fill, c.edge, c.tip, fire);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.24, cy - s * 0.1);
    ctx.lineTo(cx, cy - s * 0.32);
    ctx.lineTo(cx + s * 0.24, cy - s * 0.1);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.26);
    ctx.lineTo(cx - s * 0.2, cy + s * 0.26);
    ctx.closePath();
    fillStroke(ctx, c.shade, "#2EE6FF", 1.4);
    // Visor
    ctx.beginPath();
    ctx.rect(cx - s * 0.12, cy - s * 0.08, s * 0.24, s * 0.08);
    fillStroke(ctx, fire ? "#2EE6FF" : c.tip, c.edge, 1);
  }),
  unit("unit_rail_turret", 5, 0.9, (ctx, cx, cy, s, c, fire) => {
    paintSiegeBase(ctx, cx, cy + s * 0.1, s, c.fill, c.edge);
    const len = fire ? 0.8 : 0.62;
    paintBarrel(ctx, cx - s * 0.12, cy - s * 0.1, s, c.shade, "#2EE6FF", len, 0.15);
    ctx.beginPath();
    ctx.arc(cx - s * 0.18, cy + s * 0.22, s * 0.18, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, c.edge, 1.15);
    if (fire) {
      ctx.strokeStyle = "#2EE6FF";
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.12 + s * len, cy - s * 0.1);
      ctx.lineTo(cx - s * 0.12 + s * len + s * 0.32, cy - s * 0.1);
      ctx.stroke();
      ctx.globalAlpha = 1;
      muzzleFlash(ctx, cx - s * 0.12 + s * len + s * 0.1, cy - s * 0.1, s * 0.1, "fire");
    }
  }),
  unit("unit_plasma_blade", 5, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintTorso(ctx, cx - s * 0.12, cy + s * 0.04, s, c.fill, c.edge);
    paintHead(ctx, cx - s * 0.1, cy - s * 0.28, s * 0.8, c.tip, c.edge);
    ctx.save();
    ctx.translate(cx + s * 0.08, cy);
    ctx.rotate(fire ? -0.5 : -0.12);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1);
    ctx.lineTo(s * 0.7, 0);
    ctx.lineTo(0, s * 0.1);
    ctx.closePath();
    fillStroke(ctx, "#2EE6FF", c.edge, 1.3);
    ctx.restore();
    if (fire) {
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = "#2EE6FF";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx + s * 0.15, cy, s * 0.58, -1.0, 0.55);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }),
  unit("unit_orbit_laser", 5, 0.86, (ctx, cx, cy, s, c, fire) => {
    paintEnergyDiamond(ctx, cx, cy, s * 0.82, c.fill, c.shade, false);
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1.7;
    ctx.globalAlpha = fire ? 0.75 : 0.4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.6, s * 0.24, -0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.45, s * 0.18, 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx + s * 0.48, cy - s * 0.22, s * 0.12, 0, Math.PI * 2);
    fillStroke(ctx, c.tip, "#2EE6FF", 1.1);
    if (fire) muzzleFlash(ctx, cx + s * 0.6, cy - s * 0.22, s * 0.12, "fire");
  }),
  unit("unit_hack_node", 5, 0.82, (ctx, cx, cy, s, c, fire) => {
    paintSupportDisc(ctx, cx, cy, s, c.fill, c.edge, c.tip, fire);
    ctx.fillStyle = c.shade;
    ctx.fillRect(cx - s * 0.18, cy - s * 0.18, s * 0.36, s * 0.36);
    ctx.strokeStyle = "#2EE6FF";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - s * 0.18, cy - s * 0.18, s * 0.36, s * 0.36);
    // Binary ticks
    ctx.fillStyle = fire ? "#2EE6FF" : c.tip;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(cx - s * 0.12 + i * s * 0.1, cy - s * 0.06, s * 0.05, s * 0.12);
    }
  }),
  unit("unit_pixel_mites", 5, 0.8, (ctx, cx, cy, s, c, fire) => {
    const cells = [
      [0, 0],
      [-0.3, -0.18],
      [0.28, -0.22],
      [0.2, 0.26],
      [-0.26, 0.24],
      [0.02, -0.38],
      [-0.12, 0.05],
    ] as const;
    for (const [bx, by] of cells) {
      ctx.beginPath();
      ctx.rect(cx + bx * s - s * 0.11, cy + by * s - s * 0.11, s * 0.22, s * 0.22);
      fillStroke(ctx, c.fill, c.edge, 1);
    }
    ctx.beginPath();
    ctx.rect(cx - s * 0.08, cy - s * 0.08, s * 0.16, s * 0.16);
    fillStroke(ctx, fire ? "#FF2EC8" : c.tip, c.edge, 1.1);
    if (fire) muzzleFlash(ctx, cx + s * 0.4, cy - s * 0.15, s * 0.1, "fire");
  }),
];

export function buildUniqueUnitRecipes(): SpriteRecipe[] {
  return [...era1, ...era2, ...era3, ...era4, ...era5];
}

export const UNIQUE_UNIT_IDS = buildUniqueUnitRecipes().map((r) => r.id);
