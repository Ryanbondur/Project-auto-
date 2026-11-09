/**
 * Unit sprite recipes — unique roster (Eras 1–5) + role/era kits as safe fallbacks.
 */

import type { SpriteRecipe } from "../types";
import {
  clear,
  cxcy,
  eraFill,
  fillStroke,
  muzzleFlash,
} from "./helpers";
import { buildUniqueUnitRecipes } from "./uniqueUnits";

/** Role kit — tinted fallback when a future defId has no unique sheet. */
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
  const recipes: SpriteRecipe[] = [...buildUniqueUnitRecipes()];
  for (const era of [1, 2, 3, 4, 5] as const) {
    for (const role of ERA_ROLES) {
      recipes.push(roleKit(role, era));
    }
  }
  return recipes;
}
