import { TILE_SIZE_PX } from "../core/constants";
import { MAP } from "../content/map";

export type CanvasPoint = { clientX: number; clientY: number };

/**
 * Map a pointer position on the displayed canvas to a board tile.
 * Accounts for CSS scaling (getBoundingClientRect vs bitmap size).
 */
export function tileFromPointer(
  canvas: HTMLCanvasElement,
  point: CanvasPoint,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (point.clientX - rect.left) * scaleX;
  const py = (point.clientY - rect.top) * scaleY;
  const x = Math.floor(px / TILE_SIZE_PX);
  const y = Math.floor(py / TILE_SIZE_PX);
  if (x < 0 || y < 0 || x >= MAP.width || y >= MAP.height) return null;
  return { x, y };
}
