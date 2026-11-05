import { useEffect, useRef, type PointerEvent } from "react";
import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";
import { getUnitDef } from "../content/units";
import { gameStore } from "../core/store";
import { renderBoard } from "./renderer";
import { useGameState } from "../ui/useGameState";

/** Fixed sim step — keeps pathT / projectile progress continuous under load. */
const FIXED_DT_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;
const DRAG_THRESHOLD_PX = 10;
const LONG_PRESS_MS = 420;

export type GameCanvasProps = {
  /** Prep-only: start drag of a boarded unit (ghost owned by RunScreen). */
  onBoardUnitDragStart?: (
    e: PointerEvent<HTMLCanvasElement>,
    instanceId: string,
    label: string,
  ) => void;
  onBoardUnitDragMove?: (e: PointerEvent<HTMLCanvasElement>) => void;
  onBoardUnitDragUp?: (e: PointerEvent<HTMLCanvasElement>) => void;
  onBoardUnitDragCancel?: () => void;
  onInspectUnit?: (instanceId: string) => void;
  /** True while an external drag ghost is active — skip tile click. */
  externalDragging?: boolean;
};

/**
 * Canvas host: rAF drives combat with a fixed-timestep accumulator so creep
 * x/y and projectile pos stay frame-smooth. Canvas just presents sim state.
 * Prep also rAF-paints so unit idle breath stays alive without store churn.
 *
 * Pointer: tap empty/placeable tiles; drag boarded units to sell/merge;
 * long-press boarded unit opens inspect. No canvas pan — no fight with drag.
 */
export function GameCanvas({
  onBoardUnitDragStart,
  onBoardUnitDragMove,
  onBoardUnitDragUp,
  onBoardUnitDragCancel,
  onInspectUnit,
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

  const clientToTile = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = Math.floor(px / TILE_SIZE_PX);
    const y = Math.floor(py / TILE_SIZE_PX);
    if (x < 0 || y < 0 || x >= MAP.width || y >= MAP.height) return null;
    return { x, y };
  };

  const unitAtTile = (x: number, y: number) => {
    const snap = gameStore.getState();
    return (
      snap.board.find((u) => u.tile && u.tile.x === x && u.tile.y === y) ?? null
    );
  };

  const clearLong = () => {
    const p = pressRef.current;
    if (p?.longTimer != null) {
      window.clearTimeout(p.longTimer);
      p.longTimer = null;
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (fighting || !prep) return;
    const tile = clientToTile(e);
    if (!tile) return;
    const unit = unitAtTile(tile.x, tile.y);
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

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = pressRef.current;
    if (!p || p.pointerId !== e.pointerId) {
      onBoardUnitDragMove?.(e);
      return;
    }
    if (!p.unitId) return;
    const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
    if (!p.dragging && dist >= DRAG_THRESHOLD_PX) {
      clearLong();
      p.dragging = true;
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

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
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
    const tile = clientToTile(e);
    if (!tile) return;
    const unit = unitAtTile(tile.x, tile.y);
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
