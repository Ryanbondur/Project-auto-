import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";
import { gameStore } from "../core/store";

export type DragGhost = {
  instanceId: string;
  label: string;
  x: number;
  y: number;
};

const LONG_PRESS_MS = 420;
const DRAG_THRESHOLD_PX = 10;

/**
 * Shared prep-phase unit drag: ghost follows finger, drop on Sell zone or
 * identical unit to merge. Long-press opens inspect without starting a drag.
 * Canvas pan is not implemented — we only claim the pointer after threshold
 * so short taps still select / place.
 */
export function useUnitDrag(opts: {
  enabled: boolean;
  sellZoneRef: RefObject<HTMLElement | null>;
  onInspect: (instanceId: string) => void;
}) {
  const { enabled, sellZoneRef, onInspect } = opts;
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [sellHot, setSellHot] = useState(false);
  const dragRef = useRef<{
    instanceId: string;
    label: string;
    startX: number;
    startY: number;
    dragging: boolean;
    longTimer: number | null;
    pointerId: number;
  } | null>(null);

  const clearTimer = () => {
    const d = dragRef.current;
    if (d?.longTimer != null) {
      window.clearTimeout(d.longTimer);
      d.longTimer = null;
    }
  };

  const endDrag = useCallback(() => {
    clearTimer();
    dragRef.current = null;
    setGhost(null);
    setSellHot(false);
  }, []);

  const hitSellZone = (clientX: number, clientY: number): boolean => {
    const el = sellZoneRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return (
      clientX >= r.left &&
      clientX <= r.right &&
      clientY >= r.top &&
      clientY <= r.bottom
    );
  };

  const hitBoardUnitOnCanvas = (
    clientX: number,
    clientY: number,
    sourceId: string,
  ): string | null => {
    const canvas = document.querySelector(
      ".game-canvas",
    ) as HTMLCanvasElement | null;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / TILE_SIZE_PX);
    const y = Math.floor(((clientY - rect.top) * scaleY) / TILE_SIZE_PX);
    if (x < 0 || y < 0 || x >= MAP.width || y >= MAP.height) return null;
    const unit = gameStore
      .getState()
      .board.find((u) => u.tile && u.tile.x === x && u.tile.y === y);
    if (!unit || unit.instanceId === sourceId) return null;
    return unit.instanceId;
  };

  const hitMergeTarget = (
    clientX: number,
    clientY: number,
    sourceId: string,
  ): string | null => {
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      const id = el.dataset.unitId;
      if (id && id !== sourceId) return id;
    }
    return hitBoardUnitOnCanvas(clientX, clientY, sourceId);
  };

  const onPointerDown = useCallback(
    (
      e: ReactPointerEvent,
      instanceId: string,
      label: string,
    ) => {
      if (!enabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // Don't preventDefault yet — allow scroll until drag threshold.
      const pointerId = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture?.(pointerId);
      clearTimer();
      dragRef.current = {
        instanceId,
        label,
        startX: e.clientX,
        startY: e.clientY,
        dragging: false,
        pointerId,
        longTimer: window.setTimeout(() => {
          const d = dragRef.current;
          if (!d || d.dragging) return;
          endDrag();
          onInspect(instanceId);
        }, LONG_PRESS_MS),
      };
    },
    [enabled, endDrag, onInspect],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.dragging) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        clearTimer();
        d.dragging = true;
        gameStore.selectUnit(d.instanceId);
      }
      setGhost({
        instanceId: d.instanceId,
        label: d.label,
        x: e.clientX,
        y: e.clientY,
      });
      setSellHot(hitSellZone(e.clientX, e.clientY));
    },
    [sellZoneRef],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const wasDragging = d.dragging;
      const sourceId = d.instanceId;
      clearTimer();

      if (wasDragging) {
        if (hitSellZone(e.clientX, e.clientY)) {
          gameStore.sellUnit(sourceId);
        } else {
          const targetId = hitMergeTarget(e.clientX, e.clientY, sourceId);
          if (targetId) {
            const result = gameStore.mergeOnto(sourceId, targetId);
            if (!result.ok) {
              // Invalid pair — snap back (selection stays; no move).
              gameStore.selectUnit(sourceId);
            }
          }
        }
        endDrag();
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Tap: select / toggle
      const state = gameStore.getState();
      gameStore.selectUnit(
        state.selectedInstanceId === sourceId ? null : sourceId,
      );
      endDrag();
    },
    [endDrag, sellZoneRef],
  );

  const onPointerCancel = useCallback(() => {
    endDrag();
  }, [endDrag]);

  useEffect(() => {
    if (!enabled) endDrag();
  }, [enabled, endDrag]);

  return {
    ghost,
    sellHot,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
