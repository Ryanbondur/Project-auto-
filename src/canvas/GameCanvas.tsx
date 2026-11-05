import { useEffect, useRef, type MouseEvent } from "react";
import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";
import { gameStore } from "../core/store";
import { renderBoard } from "./renderer";
import { useGameState } from "../ui/useGameState";

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useGameState();

  const width = MAP.width * TILE_SIZE_PX;
  const height = MAP.height * TILE_SIZE_PX;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderBoard(ctx, state);
  }, [state]);

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
        Select a bench unit, then click a placeable tile (path tiles blocked).
      </p>
    </div>
  );
}
