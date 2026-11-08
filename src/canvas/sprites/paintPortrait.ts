/**
 * Paint a unit atlas frame into an arbitrary canvas (shop / bench / sheets).
 * Falls back to era swatch if bake unavailable.
 */

import { getUnitDef } from "../../content/units";
import { eraColor, shadeHex, theme } from "../theme";
import { ensureSpriteAtlas, resolveUnitFrame } from "./atlas";
import type { SpriteAnim } from "./types";

export function paintUnitPortrait(
  ctx: CanvasRenderingContext2D,
  defId: string,
  size: number,
  anim: SpriteAnim = "idle",
  opts?: { selected?: boolean; starLevel?: number; timeMs?: number },
): void {
  ensureSpriteAtlas();
  const def = getUnitDef(defId);
  const era = (def?.era ?? 1) as 1 | 2 | 3 | 4 | 5;
  const fill = def?.accentColor ?? eraColor(era);
  const timeMs = opts?.timeMs ?? 0;
  const breath =
    opts?.timeMs !== undefined
      ? 1 + 0.04 * Math.sin(timeMs * 0.004 + defId.length)
      : 1;

  ctx.clearRect(0, 0, size, size);
  // Quiet era-tinted pad — not a flat chrome card
  ctx.fillStyle = shadeHex(fill, 0.55);
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = `rgba(46, 230, 255, ${opts?.selected ? 0.7 : 0.28})`;
  ctx.lineWidth = opts?.selected ? 1.5 : 1;
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

  const frame = resolveUnitFrame(defId, anim, era);
  const cx = size / 2;
  const cy = size / 2 + (opts?.timeMs !== undefined ? Math.sin(timeMs * 0.004) * 1.2 : 0);

  if (frame?.source) {
    const draw = size * frame.drawScale * 1.05 * breath;
    ctx.drawImage(
      frame.source,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      cx - draw / 2,
      cy - draw / 2,
      draw,
      draw,
    );
  } else {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.32 * breath, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.cyan;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const stars = Math.min(opts?.starLevel ?? 0, 5);
  if (stars > 0) {
    const pip = Math.max(1.4, size * 0.07);
    const spread = Math.min(size * 0.55, 3 + stars * pip * 1.4);
    ctx.fillStyle = theme.gold;
    for (let i = 0; i < stars; i++) {
      const t = stars === 1 ? 0.5 : i / (stars - 1);
      const px = cx - spread / 2 + t * spread;
      ctx.beginPath();
      ctx.arc(px, size * 0.12, pip, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
