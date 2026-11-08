/**
 * Projectile streak + sparse hit FX recipes.
 * Families: ballistic (cyan), aoe/siege (magenta), energy (cyan beam), melee (slash tick).
 */

import { theme } from "../../theme";
import type { SpriteRecipe } from "../types";
import { clear, cxcy, impactBloom } from "./helpers";

function streak(
  id: string,
  color: string,
  trail: string,
  thick: number,
): SpriteRecipe {
  return {
    id,
    kind: "projectile",
    anims: ["idle", "fire"],
    drawScale: 0.55,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const head = anim === "fire" ? 1.15 : 1;
      ctx.strokeStyle = trail;
      ctx.lineWidth = thick;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.85, cy);
      ctx.lineTo(cx + s * 0.35, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + s * 0.45, cy, s * 0.16 * head, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (anim === "fire") {
        impactBloom(ctx, cx + s * 0.45, cy, s * 0.22, color, 0.45);
      }
    },
  };
}

function energyBeam(): SpriteRecipe {
  return {
    id: "proj_energy",
    kind: "projectile",
    anims: ["idle", "fire"],
    drawScale: 0.6,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      ctx.strokeStyle = "rgba(46, 230, 255, 0.55)";
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.9, cy);
      ctx.lineTo(cx + s * 0.55, cy);
      ctx.stroke();
      ctx.strokeStyle = theme.cyan;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.7, cy);
      ctx.lineTo(cx + s * 0.55, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.35, cy - s * 0.18);
      ctx.lineTo(cx + s * 0.7, cy);
      ctx.lineTo(cx + s * 0.35, cy + s * 0.18);
      ctx.closePath();
      ctx.fillStyle = theme.cyan;
      ctx.fill();
      if (anim === "fire") {
        impactBloom(ctx, cx + s * 0.65, cy, s * 0.2, theme.cyan, 0.5);
      }
    },
  };
}

function meleeSlash(): SpriteRecipe {
  return {
    id: "proj_melee",
    kind: "projectile",
    anims: ["idle", "fire"],
    drawScale: 0.48,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      ctx.strokeStyle = theme.cyan;
      ctx.globalAlpha = anim === "fire" ? 0.85 : 0.55;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.55, -0.9, 0.7);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx + s * 0.35, cy - s * 0.05, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = theme.cyan;
      ctx.fill();
    },
  };
}

function hitCyan(): SpriteRecipe {
  return {
    id: "fx_hit_cyan",
    kind: "fx",
    anims: ["idle", "fire"],
    drawScale: 0.7,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const t = anim === "fire" ? 1 : 0.7;
      ctx.strokeStyle = theme.cyan;
      ctx.globalAlpha = 0.55 * t;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, s * (0.35 + 0.2 * t), 0, Math.PI * 2);
      ctx.stroke();
      impactBloom(ctx, cx, cy, s * 0.18 * t, theme.cyan, 0.55 * t);
      ctx.globalAlpha = 1;
    },
  };
}

function hitMagenta(): SpriteRecipe {
  return {
    id: "fx_hit_magenta",
    kind: "fx",
    anims: ["idle", "fire"],
    drawScale: 0.75,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const t = anim === "fire" ? 1 : 0.7;
      ctx.strokeStyle = theme.magenta;
      ctx.globalAlpha = 0.5 * t;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(cx, cy, s * (0.4 + 0.22 * t), 0, Math.PI * 2);
      ctx.stroke();
      impactBloom(ctx, cx, cy, s * 0.2 * t, theme.magenta, 0.5 * t);
      // Sparse spark ticks
      ctx.globalAlpha = 0.65 * t;
      for (const a of [0.3, 1.5, 2.8, 4.2]) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * s * 0.35, cy + Math.sin(a) * s * 0.35);
        ctx.lineTo(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  };
}

export function buildProjectileRecipes(): SpriteRecipe[] {
  return [
    streak("proj_ballistic", theme.cyan, "rgba(46, 230, 255, 0.5)", 2),
    streak("proj_aoe", theme.magenta, "rgba(255, 46, 200, 0.45)", 2.4),
    energyBeam(),
    meleeSlash(),
    hitCyan(),
    hitMagenta(),
  ];
}

export type ProjectileFamily = "ballistic" | "aoe" | "energy" | "melee";

export function projectileRecipeId(family: ProjectileFamily): string {
  switch (family) {
    case "aoe":
      return "proj_aoe";
    case "energy":
      return "proj_energy";
    case "melee":
      return "proj_melee";
    default:
      return "proj_ballistic";
  }
}

export function hitFxRecipeId(family: ProjectileFamily): string {
  return family === "aoe" ? "fx_hit_magenta" : "fx_hit_cyan";
}
