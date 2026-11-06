/**
 * Unit sprite recipes — Era 1 full unique roster + role kits for eras 2–5.
 * TODO(art): handcraft unique idle/fire sheets for eras 2–5 (currently tinted role kits).
 */

import type { SpriteRecipe } from "../types";
import {
  clear,
  cxcy,
  eraFill,
  fillStroke,
  muzzleFlash,
} from "./helpers";

function era1Slinger(): SpriteRecipe {
  return {
    id: "unit_slinger",
    kind: "unit",
    anims: ["idle", "fire"],
    drawScale: 0.78,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge, tip } = eraFill(1);
      // Compact torso
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.32, cy - s * 0.28);
      ctx.lineTo(cx + s * 0.18, cy - s * 0.32);
      ctx.lineTo(cx + s * 0.28, cy + s * 0.34);
      ctx.lineTo(cx - s * 0.36, cy + s * 0.34);
      ctx.closePath();
      fillStroke(ctx, fill, edge, 1.6);
      // Sling pouch
      ctx.beginPath();
      ctx.arc(cx - s * 0.08, cy + s * 0.06, s * 0.16, 0, Math.PI * 2);
      fillStroke(ctx, shade, edge, 1.2);
      // Cord + stone
      const stretch = anim === "fire" ? 1.18 : 1;
      ctx.strokeStyle = tip;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.1, cy - s * 0.1);
      ctx.quadraticCurveTo(
        cx + s * 0.55 * stretch,
        cy - s * 0.45 * stretch,
        cx + s * 0.62 * stretch,
        cy - s * 0.05,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(
        cx + s * 0.62 * stretch,
        cy - s * 0.05,
        s * (anim === "fire" ? 0.12 : 0.1),
        0,
        Math.PI * 2,
      );
      fillStroke(ctx, tip, edge, 1);
      muzzleFlash(ctx, cx + s * 0.72 * stretch, cy, s * 0.1, anim);
    },
  };
}

function era1Spearman(): SpriteRecipe {
  return {
    id: "unit_spearman",
    kind: "unit",
    anims: ["idle", "fire"],
    drawScale: 0.8,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge, tip } = eraFill(1);
      // Shield plate
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.28, cy - s * 0.48);
      ctx.lineTo(cx + s * 0.22, cy - s * 0.4);
      ctx.lineTo(cx + s * 0.34, cy);
      ctx.lineTo(cx + s * 0.22, cy + s * 0.4);
      ctx.lineTo(cx - s * 0.28, cy + s * 0.48);
      ctx.lineTo(cx - s * 0.42, cy);
      ctx.closePath();
      fillStroke(ctx, fill, edge, 1.7);
      // Shield boss
      ctx.beginPath();
      ctx.arc(cx - s * 0.04, cy, s * 0.12, 0, Math.PI * 2);
      fillStroke(ctx, shade, edge, 1);
      // Spear thrust
      const thrust = anim === "fire" ? s * 0.18 : 0;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.18, cy - s * 0.1);
      ctx.lineTo(cx + s * 0.72 + thrust, cy);
      ctx.lineTo(cx + s * 0.18, cy + s * 0.1);
      ctx.closePath();
      fillStroke(ctx, tip, edge, 1.2);
      ctx.strokeStyle = shade;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.1, cy);
      ctx.lineTo(cx + s * 0.55 + thrust, cy);
      ctx.stroke();
    },
  };
}

function era1Drummer(): SpriteRecipe {
  return {
    id: "unit_tribe_drummer",
    kind: "unit",
    anims: ["idle", "fire"],
    drawScale: 0.76,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge, tip } = eraFill(1);
      // Soft support disc
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      fillStroke(ctx, fill, edge, 1.6);
      // Drum body
      ctx.beginPath();
      ctx.ellipse(cx, cy + s * 0.06, s * 0.28, s * 0.2, 0, 0, Math.PI * 2);
      fillStroke(ctx, shade, edge, 1.3);
      ctx.beginPath();
      ctx.ellipse(cx, cy - s * 0.08, s * 0.26, s * 0.1, 0, 0, Math.PI * 2);
      fillStroke(ctx, tip, edge, 1);
      // Beat rings
      const pulse = anim === "fire" ? 0.22 : 0.12;
      ctx.strokeStyle = `rgba(46, 230, 255, ${pulse})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, s * (0.55 + (anim === "fire" ? 0.08 : 0)), 0, Math.PI * 2);
      ctx.stroke();
      // Mallet
      const lift = anim === "fire" ? -s * 0.18 : -s * 0.06;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.2, cy - s * 0.05);
      ctx.lineTo(cx + s * 0.42, cy + lift);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + s * 0.42, cy + lift, s * 0.08, 0, Math.PI * 2);
      fillStroke(ctx, tip, edge, 1);
    },
  };
}

function era1Boulder(): SpriteRecipe {
  return {
    id: "unit_boulder_roll",
    kind: "unit",
    anims: ["idle", "fire"],
    drawScale: 0.82,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge, tip } = eraFill(1);
      // Wide siege base
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.55, cy + s * 0.38);
      ctx.lineTo(cx - s * 0.4, cy - s * 0.1);
      ctx.lineTo(cx + s * 0.15, cy - s * 0.18);
      ctx.lineTo(cx + s * 0.48, cy + s * 0.38);
      ctx.closePath();
      fillStroke(ctx, fill, edge, 1.7);
      // Boulder
      const roll = anim === "fire" ? s * 0.14 : 0;
      ctx.beginPath();
      ctx.arc(cx + s * 0.12 + roll, cy - s * 0.22, s * 0.28, 0, Math.PI * 2);
      fillStroke(ctx, shade, edge, 1.5);
      ctx.beginPath();
      ctx.arc(cx + s * 0.02 + roll, cy - s * 0.3, s * 0.1, 0, Math.PI * 2);
      fillStroke(ctx, tip, edge, 1);
      if (anim === "fire") {
        muzzleFlash(ctx, cx + s * 0.48 + roll, cy - s * 0.18, s * 0.12, anim);
      }
    },
  };
}

/** Role kit — eras 2–5 use these with era tint until unique sheets land. */
function roleKit(
  role:
    | "melee"
    | "ballistic"
    | "siege"
    | "support"
    | "energy"
    | "swarm"
    | "generic",
  era: 1 | 2 | 3 | 4 | 5,
): SpriteRecipe {
  const id = `role:${role}:era:${era}`;
  return {
    id,
    kind: "unit",
    anims: ["idle", "fire"],
    drawScale: 0.78,
    paint(ctx, bakePx, anim) {
      clear(ctx, bakePx);
      const { cx, cy, s } = cxcy(bakePx);
      const { fill, shade, edge, tip } = eraFill(era);
      const fire = anim === "fire";

      switch (role) {
        case "melee": {
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.22, cy - s * 0.42);
          ctx.lineTo(cx + s * 0.18, cy - s * 0.38);
          ctx.lineTo(cx + s * 0.28, cy);
          ctx.lineTo(cx + s * 0.18, cy + s * 0.38);
          ctx.lineTo(cx - s * 0.22, cy + s * 0.42);
          ctx.lineTo(cx - s * 0.38, cy);
          ctx.closePath();
          fillStroke(ctx, fill, edge);
          const thrust = fire ? s * 0.14 : 0;
          ctx.beginPath();
          ctx.moveTo(cx + s * 0.2, cy - s * 0.08);
          ctx.lineTo(cx + s * 0.58 + thrust, cy);
          ctx.lineTo(cx + s * 0.2, cy + s * 0.08);
          ctx.closePath();
          fillStroke(ctx, tip, edge, 1.1);
          break;
        }
        case "ballistic": {
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.3, cy - s * 0.28);
          ctx.lineTo(cx + s * 0.16, cy - s * 0.28);
          ctx.lineTo(cx + s * 0.22, cy - s * 0.18);
          ctx.lineTo(cx + s * 0.22, cy + s * 0.18);
          ctx.lineTo(cx + s * 0.16, cy + s * 0.28);
          ctx.lineTo(cx - s * 0.3, cy + s * 0.28);
          ctx.lineTo(cx - s * 0.36, cy + s * 0.18);
          ctx.lineTo(cx - s * 0.36, cy - s * 0.18);
          ctx.closePath();
          fillStroke(ctx, fill, edge);
          const ext = fire ? s * 0.12 : 0;
          ctx.fillStyle = shade;
          ctx.fillRect(cx - s * 0.05, cy - s * 0.1, s * 0.55 + ext, s * 0.2);
          ctx.strokeStyle = edge;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(cx - s * 0.05, cy - s * 0.1, s * 0.55 + ext, s * 0.2);
          muzzleFlash(ctx, cx + s * 0.55 + ext, cy, s * 0.1, anim);
          break;
        }
        case "siege": {
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.5, cy + s * 0.34);
          ctx.lineTo(cx - s * 0.38, cy - s * 0.2);
          ctx.lineTo(cx + s * 0.22, cy - s * 0.24);
          ctx.lineTo(cx + s * 0.46, cy + s * 0.34);
          ctx.closePath();
          fillStroke(ctx, fill, edge);
          const ext = fire ? s * 0.1 : 0;
          ctx.beginPath();
          ctx.moveTo(cx + s * 0.02, cy - s * 0.12);
          ctx.lineTo(cx + s * 0.58 + ext, cy - s * 0.04);
          ctx.lineTo(cx + s * 0.58 + ext, cy + s * 0.1);
          ctx.lineTo(cx + s * 0.02, cy + s * 0.14);
          ctx.closePath();
          fillStroke(ctx, shade, edge, 1.2);
          muzzleFlash(ctx, cx + s * 0.62 + ext, cy + s * 0.02, s * 0.12, anim);
          break;
        }
        case "support": {
          ctx.beginPath();
          ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2);
          fillStroke(ctx, fill, edge);
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
          break;
        }
        case "energy": {
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
          fillStroke(ctx, shade, edge, 1);
          if (fire) {
            ctx.strokeStyle = "#2EE6FF";
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.moveTo(cx + s * 0.36, cy);
            ctx.lineTo(cx + s * 0.66, cy);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          break;
        }
        case "swarm": {
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
          if (fire) muzzleFlash(ctx, cx + s * 0.36, cy - s * 0.1, s * 0.08, anim);
          break;
        }
        default: {
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.3, cy - s * 0.3);
          ctx.lineTo(cx + s * 0.3, cy - s * 0.3);
          ctx.lineTo(cx + s * 0.34, cy + s * 0.3);
          ctx.lineTo(cx - s * 0.34, cy + s * 0.3);
          ctx.closePath();
          fillStroke(ctx, fill, edge);
        }
      }
    },
  };
}

const ERA_ROLES = [
  "melee",
  "ballistic",
  "siege",
  "support",
  "energy",
  "swarm",
  "generic",
] as const;

export function buildUnitRecipes(): SpriteRecipe[] {
  const recipes: SpriteRecipe[] = [
    era1Slinger(),
    era1Spearman(),
    era1Drummer(),
    era1Boulder(),
  ];
  for (const era of [1, 2, 3, 4, 5] as const) {
    for (const role of ERA_ROLES) {
      recipes.push(roleKit(role, era));
    }
  }
  return recipes;
}
