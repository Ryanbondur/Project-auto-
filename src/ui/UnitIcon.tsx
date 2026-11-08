import { useEffect, useRef } from "react";
import { paintUnitPortrait } from "../canvas/sprites/paintPortrait";
import type { SpriteAnim } from "../canvas/sprites";

export type UnitIconProps = {
  defId: string;
  /** Idle by default; pass "fire" for attack preview. */
  anim?: SpriteAnim;
  starLevel?: number;
  selected?: boolean;
  /** Soft idle bob when true (shop/bench life). */
  animate?: boolean;
  className?: string;
  /** CSS pixel size (devicePixelRatio applied internally). */
  size?: number;
  title?: string;
};

/**
 * Thin React adapter over the sprite atlas — same frames as board `drawUnit`.
 */
export function UnitIcon({
  defId,
  anim = "idle",
  starLevel,
  selected = false,
  animate = false,
  className = "unit-swatch unit-icon",
  size = 28,
  title,
}: UnitIconProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    const paint = (timeMs: number) => {
      paintUnitPortrait(ctx, defId, size, anim, {
        selected,
        starLevel,
        timeMs: animate ? timeMs : undefined,
      });
    };

    if (!animate) {
      paint(0);
      return;
    }

    const loop = (t: number) => {
      paint(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [defId, anim, starLevel, selected, animate, size]);

  return (
    <canvas
      ref={ref}
      className={className}
      width={size}
      height={size}
      title={title}
      aria-hidden
    />
  );
}
