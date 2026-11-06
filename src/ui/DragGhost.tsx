import type { DragGhost as Ghost } from "./useUnitDrag";

/** Floating neon chip that follows the finger during unit drag. */
export function DragGhostOverlay({ ghost }: { ghost: Ghost | null }) {
  if (!ghost) return null;
  return (
    <div
      className="drag-ghost"
      style={{ left: ghost.x, top: ghost.y }}
      aria-hidden
    >
      {ghost.label}
    </div>
  );
}
