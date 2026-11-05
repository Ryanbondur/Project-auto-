import { useEffect, useRef, type MouseEvent } from "react";
import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";
import { gameStore } from "../core/store";
import { renderBoard } from "./renderer";
import { useGameState } from "../ui/useGameState";

/** Fixed sim step — keeps pathT / projectile progress continuous under load. */
const FIXED_DT_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

/**
 * Canvas host: rAF drives combat with a fixed-timestep accumulator so creep
 * x/y and projectile pos stay frame-smooth. Canvas just presents sim state.
 * Prep phases redraw on store subscription only.
 */
export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useGameState();
  const fighting = state.phase === "AUTOBATTLE";

  const width = MAP.width * TILE_SIZE_PX;
  const height = MAP.height * TILE_SIZE_PX;

  // Prep / defeat: paint when React state updates
  useEffect(() => {
    if (fighting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderBoard(ctx, state);
  }, [state, fighting]);

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
      renderBoard(ctx, snap);
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

  const onClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = Math.floor(px / TILE_SIZE_PX);
    const y = Math.floor(py / TILE_SIZE_PX);
    if (x >= 0 && y >= 0 && x < MAP.width && y < MAP.height) {
      gameStore.clickTile(x, y);
    }
  };

  return (
    <div className="board-wrap">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={width}
        height={height}
        onClick={onClick}
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
