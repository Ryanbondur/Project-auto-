import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";
import { gameStore } from "../core/store";
import { unitAtTile } from "../core/unitInspect";
import { renderBoard } from "./renderer";
import { tileFromPointer } from "./hitTest";
import { useGameState } from "../ui/useGameState";

/** Fixed sim step — keeps pathT / projectile progress continuous under load. */
const FIXED_DT_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;
/** Mobile hold-to-inspect (iPhone primary). */
const HOLD_MS = 400;
const HOLD_MOVE_PX = 12;

export type GameCanvasProps = {
  /** Sticky inspect (long-press). */
  onInspectUnit?: (instanceId: string) => void;
  /** Ephemeral hover inspect (desktop pointer). */
  onHoverUnit?: (instanceId: string | null) => void;
};

/**
 * Canvas host: rAF drives combat with a fixed-timestep accumulator so creep
 * x/y and projectile pos stay frame-smooth. Canvas just presents sim state.
 * Prep also rAF-paints so unit idle breath stays alive without store churn.
 *
 * Pointer events (not mouse-only) so iPhone Safari / standalone taps place units.
 * Long-press (~400ms) on a boarded unit opens inspect without blocking combat.
 */
export function GameCanvas({ onInspectUnit, onHoverUnit }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useGameState();
  const fighting = state.phase === "AUTOBATTLE";

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdOrigin = useRef<{ x: number; y: number } | null>(null);
  const holdFired = useRef(false);
  const activePointerId = useRef<number | null>(null);

  const width = MAP.width * TILE_SIZE_PX;
  const height = MAP.height * TILE_SIZE_PX;

  const clearHold = () => {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    holdOrigin.current = null;
  };

  // Prep / menus: idle paint loop (breath / select rings) from live store
  useEffect(() => {
    if (fighting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let alive = true;
    const frame = (now: number) => {
      if (!alive) return;
      renderBoard(ctx, gameStore.getState(), now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [fighting]);

  // Autobattle: independent rAF loop (does not depend on React re-render rate)
  useEffect(() => {
    if (!fighting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;
    let alive = true;

    const frame = (now: number) => {
      if (!alive) return;
      const rawDt = Math.min(100, Math.max(0, now - last));
      last = now;
      accumulator += rawDt;

      let steps = 0;
      while (accumulator >= FIXED_DT_MS && steps < MAX_STEPS_PER_FRAME) {
        gameStore.tick(FIXED_DT_MS);
        accumulator -= FIXED_DT_MS;
        steps += 1;
        if (gameStore.getState().phase !== "AUTOBATTLE") break;
      }
      // Drop leftover if we hit the step cap (avoid spiral of death)
      if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0;

      const snap = gameStore.getState();
      renderBoard(ctx, snap, now);
      if (snap.phase === "AUTOBATTLE") {
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [fighting]);

  useEffect(() => () => clearHold(), []);

  const unitUnderPointer = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const tile = tileFromPointer(canvas, e);
    if (!tile) return undefined;
    return unitAtTile(gameStore.getState().board, tile.x, tile.y);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    holdFired.current = false;
    activePointerId.current = e.pointerId;
    holdOrigin.current = { x: e.clientX, y: e.clientY };
    clearHold();
    const unit = unitUnderPointer(e);
    if (!unit || !onInspectUnit) return;
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      onInspectUnit(unit.instanceId);
      // Cancel pending click selection/placement for this gesture.
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }, HOLD_MS);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (
      holdOrigin.current &&
      activePointerId.current === e.pointerId &&
      holdTimer.current !== null
    ) {
      const dx = e.clientX - holdOrigin.current.x;
      const dy = e.clientY - holdOrigin.current.y;
      if (dx * dx + dy * dy > HOLD_MOVE_PX * HOLD_MOVE_PX) {
        clearHold();
      }
    }

    // Desktop hover inspect (secondary) — mouse only, no sticky overlay.
    if (e.pointerType === "mouse" && onHoverUnit) {
      const unit = unitUnderPointer(e);
      onHoverUnit(unit?.instanceId ?? null);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    clearHold();
    if (holdFired.current) {
      holdFired.current = false;
      activePointerId.current = null;
      return;
    }
    activePointerId.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tile = tileFromPointer(canvas, e);
    if (tile) gameStore.clickTile(tile.x, tile.y);
  };

  const onPointerCancel = () => {
    clearHold();
    holdFired.current = false;
    activePointerId.current = null;
  };

  const onPointerLeave = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse") onHoverUnit?.(null);
  };

  return (
    <div className="board-wrap">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
        role="img"
        aria-label="Game board grid"
      />
      <p className="board-hint">
        {state.phase === "AUTOBATTLE"
          ? "Autobattle — creeps march the path; units fire continuously."
          : "Select a bench unit, then click a placeable tile (path tiles blocked). Path sabotage: select item, click a path tile."}
      </p>
    </div>
  );
}
