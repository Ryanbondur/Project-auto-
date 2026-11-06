/**
 * Creep sprite recipes — common roster + boss.
 * Flat magenta hostiles; glow/glitch reserved for boss at draw time.
 */

import type { SpriteRecipe } from "../types";
import { clear, cxcy, fillStroke, magentaHostile } from "./helpers";

function runner(): SpriteRecipe {
  return {
    id: "creep_runner",
    kind: "creep",
    anims: ["idle"],
    drawScale: 0.52,
    paint(ctx, bakePx) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge } = magentaHostile();
      // Elongated speed diamond
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 1.05);
      ctx.lineTo(cx + s * 0.42, cy);
      ctx.lineTo(cx, cy + s * 1.05);
      ctx.lineTo(cx - s * 0.42, cy);
      ctx.closePath();
      fillStroke(ctx, fill, edge, 1.4);
      // Core eye
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.15, s * 0.12, 0, Math.PI * 2);
      fillStroke(ctx, shade, edge, 1);
    },
  };
}

function grunt(): SpriteRecipe {
  return {
    id: "creep_grunt",
    kind: "creep",
    anims: ["idle"],
    drawScale: 0.58,
    paint(ctx, bakePx) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge } = magentaHostile();
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const px = cx + Math.cos(a) * s * 0.85;
        const py = cy + Math.sin(a) * s * 0.85;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      fillStroke(ctx, fill, edge, 1.4);
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.08, s * 0.16, 0, Math.PI * 2);
      fillStroke(ctx, shade, edge, 1);
    },
  };
}

function tank(): SpriteRecipe {
  return {
    id: "creep_tank",
    kind: "creep",
    anims: ["idle"],
    drawScale: 0.68,
    paint(ctx, bakePx) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge } = magentaHostile();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.9, cy + s * 0.55);
      ctx.lineTo(cx - s * 0.68, cy - s * 0.42);
      ctx.lineTo(cx + s * 0.68, cy - s * 0.42);
      ctx.lineTo(cx + s * 0.9, cy + s * 0.55);
      ctx.closePath();
      fillStroke(ctx, fill, edge, 1.6);
      // Armor plate
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.45, cy - s * 0.15);
      ctx.lineTo(cx + s * 0.45, cy - s * 0.15);
      ctx.lineTo(cx + s * 0.35, cy + s * 0.22);
      ctx.lineTo(cx - s * 0.35, cy + s * 0.22);
      ctx.closePath();
      fillStroke(ctx, shade, edge, 1.2);
    },
  };
}

function swarm(): SpriteRecipe {
  return {
    id: "creep_swarm",
    kind: "creep",
    anims: ["idle"],
    drawScale: 0.42,
    paint(ctx, bakePx) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, edge } = magentaHostile();
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.95);
      ctx.lineTo(cx + s * 0.85, cy + s * 0.7);
      ctx.lineTo(cx - s * 0.85, cy + s * 0.7);
      ctx.closePath();
      fillStroke(ctx, fill, edge, 1.2);
      // Tiny sibling pip
      ctx.beginPath();
      ctx.arc(cx + s * 0.55, cy + s * 0.15, s * 0.18, 0, Math.PI * 2);
      fillStroke(ctx, fill, edge, 1);
    },
  };
}

function boss(): SpriteRecipe {
  return {
    id: "creep_boss",
    kind: "creep",
    anims: ["idle"],
    drawScale: 0.88,
    paint(ctx, bakePx) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge } = magentaHostile(true);
      // Hex body
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
      // Inner corrupt core
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = cx + Math.cos(a) * s * 0.42;
        const py = cy + Math.sin(a) * s * 0.42;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      fillStroke(ctx, shade, "#2EE6FF", 1.3);
      // Eye
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.14, 0, Math.PI * 2);
      fillStroke(ctx, "#2EE6FF", edge, 1);
    },
  };
}

/** Generic hostile fallback for unknown creep ids. */
function genericHostile(): SpriteRecipe {
  return {
    id: "creep:generic",
    kind: "creep",
    anims: ["idle"],
    drawScale: 0.55,
    paint(ctx, bakePx) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, edge } = magentaHostile();
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.7, 0, Math.PI * 2);
      fillStroke(ctx, fill, edge, 1.4);
    },
  };
}

export function buildCreepRecipes(): SpriteRecipe[] {
  return [runner(), grunt(), tank(), swarm(), boss(), genericHostile()];
}
