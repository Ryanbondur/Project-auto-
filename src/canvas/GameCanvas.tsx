import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";
import { getUnitDef } from "../content/units";
import { gameStore } from "../core/store";
import { unitAtTile } from "../core/unitInspect";
import { renderBoard } from "./renderer";
import { tileFromPointer } from "./hitTest";
import { useGameState } from "../ui/useGameState";

/** Fixed sim step — keeps pathT / projectile progress continuous under load. */
const FIXED_DT_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;
const DRAG_THRESHOLD_PX = 10;
/** Mobile hold-to-inspect (iPhone primary). */
const LONG_PRESS_MS = 420;
const HOLD_MOVE_PX = 12;

export type GameCanvasProps = {
  /** Prep-only: start drag of a boarded unit (ghost owned by RunScreen). */
  onBoardUnitDragStart?: (
    e: ReactPointerEvent<HTMLCanvasElement>,
    instanceId: string,
    label: string,
  ) => void;
  onBoardUnitDragMove?: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  onBoardUnitDragUp?: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  onBoardUnitDragCancel?: () => void;
  /** Sticky inspect (long-press). */
  onInspectUnit?: (instanceId: string) => void;
  /** Ephemeral hover inspect (desktop pointer). */
  onHoverUnit?: (instanceId: string | null) => void;
  /** True while an external drag ghost is active — skip tile click. */
  externalDragging?: boolean;
};

/**
 * Canvas host: rAF drives combat with a fixed-timestep accumulator so creep
 * x/y and projectile pos stay frame-smooth. Canvas just presents sim state.
 * Prep also rAF-paints so unit idle breath stays alive without store churn.
 *
 * Pointer: tap empty/placeable tiles; drag boarded units to sell/merge;
 * long-press boarded unit opens inspect (prep + fight). Desktop hover
 * shows ephemeral inspect. No canvas pan — no fight with drag.
 */
export function GameCanvas({
  onBoardUnitDragStart,
  onBoardUnitDragMove,
  onBoardUnitDragUp,
  onBoardUnitDragCancel,
  onInspectUnit,
  onHoverUnit,
  externalDragging = false,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useGameState();
  const fighting =
    state.phase === "AUTOBATTLE" || state.phase === "EVENT_ARENA";
  const prep =
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP") &&
    !state.eventChoice;

  const pressRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    tileX: number;
    tileY: number;
    unitId: string | null;
    dragging: boolean;
    longTimer: number | null;
  } | null>(null);

  const width = MAP.width * TILE_SIZE_PX;
  const height = MAP.height * TILE_SIZE_PX;

  const clearLong = () => {
    const p = pressRef.current;
    if (p?.longTimer != null) {
      window.clearTimeout(p.longTimer);
      p.longTimer = null;
    }
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
      if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0;

      const snap = gameStore.getState();
      renderBoard(ctx, snap, now);
      if (
        snap.phase === "AUTOBATTLE" ||
        snap.phase === "EVENT_ARENA"
      ) {
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [fighting]);

  useEffect(
    () => () => {
      clearLong();
      pressRef.current = null;
    },
    [],
  );

  const unitUnderPointer = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const tile = tileFromPointer(canvas, e);
    if (!tile) return undefined;
    return unitAtTile(gameStore.getState().board, tile.x, tile.y);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Fight / frozen menus: hold-to-inspect + hover only (no drag/place).
    if (fighting || !prep) {
      if (!onInspectUnit) return;
      const unit = unitUnderPointer(e);
      if (!unit) return;
      pressRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        tileX: unit.tile?.x ?? 0,
        tileY: unit.tile?.y ?? 0,
        unitId: unit.instanceId,
        dragging: false,
        longTimer: window.setTimeout(() => {
          const p = pressRef.current;
          if (!p || p.dragging || !p.unitId) return;
          onInspectUnit(p.unitId);
          pressRef.current = null;
        }, LONG_PRESS_MS),
      };
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const tile = tileFromPointer(canvas, e);
    if (!tile) return;
    const unit = unitAtTile(gameStore.getState().board, tile.x, tile.y);
    pressRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      tileX: tile.x,
      tileY: tile.y,
      unitId: unit?.instanceId ?? null,
      dragging: false,
      longTimer: null,
    };
    if (unit && onInspectUnit) {
      pressRef.current.longTimer = window.setTimeout(() => {
        const p = pressRef.current;
        if (!p || p.dragging || !p.unitId) return;
        onInspectUnit(p.unitId);
        pressRef.current = null;
      }, LONG_PRESS_MS);
    }
    (e.currentTarget as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = pressRef.current;

    // Desktop hover inspect (secondary) — mouse only, no sticky overlay.
    if (e.pointerType === "mouse" && onHoverUnit && !p?.dragging) {
      const unit = unitUnderPointer(e);
      onHoverUnit(unit?.instanceId ?? null);
    }

    if (!p || p.pointerId !== e.pointerId) {
      onBoardUnitDragMove?.(e);
      return;
    }

    // Cancel pending long-press if finger moves too far (fight or prep).
    if (p.longTimer != null && !p.dragging) {
      const dx = e.clientX - p.startX;
      const dy = e.clientY - p.startY;
      if (dx * dx + dy * dy > HOLD_MOVE_PX * HOLD_MOVE_PX) {
        if (!prep || fighting) {
          clearLong();
          return;
        }
      }
    }

    if (!prep || fighting) return;
    if (!p.unitId) return;
    const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
    if (!p.dragging && dist >= DRAG_THRESHOLD_PX) {
      clearLong();
      p.dragging = true;
      onHoverUnit?.(null);
      const unit = gameStore
        .getState()
        .board.find((u) => u.instanceId === p.unitId);
      const def = unit ? getUnitDef(unit.defId) : undefined;
      const label = unit
        ? `${def?.name ?? unit.defId} ${"★".repeat(Math.min(unit.starLevel, 8))}`
        : "Unit";
      onBoardUnitDragStart?.(e, p.unitId, label);
    }
    if (p.dragging) onBoardUnitDragMove?.(e);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = pressRef.current;
    if (externalDragging || (p && p.dragging)) {
      onBoardUnitDragUp?.(e);
      clearLong();
      pressRef.current = null;
      return;
    }
    if (!p || p.pointerId !== e.pointerId) return;
    clearLong();
    pressRef.current = null;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Fight / non-prep: long-press already handled; short tap does nothing.
    if (fighting || !prep) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const tile = tileFromPointer(canvas, e);
    if (!tile) return;
    const unit = unitAtTile(gameStore.getState().board, tile.x, tile.y);
    if (unit) {
      const snap = gameStore.getState();
      gameStore.selectUnit(
        snap.selectedInstanceId === unit.instanceId ? null : unit.instanceId,
      );
      return;
    }
    gameStore.clickTile(tile.x, tile.y);
  };

  const onPointerCancel = () => {
    clearLong();
    pressRef.current = null;
    onBoardUnitDragCancel?.();
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
        style={{ touchAction: prep ? "none" : "manipulation" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
        role="img"
        aria-label="Game board grid"
      />
      <p className="board-hint">
        {state.phase === "EVENT_ARENA"
          ? "Boss arena — beat it for loot. Fail costs gold/HP, not the run."
          : state.phase === "AUTOBATTLE"
            ? "Autobattle — creeps march the path; units fire continuously."
            : state.eventChoice
              ? "Pick a run event to continue."
              : "Drag units onto twins to merge, or onto Sell. Long-press to inspect."}
      </p>
    </div>
  );
}
