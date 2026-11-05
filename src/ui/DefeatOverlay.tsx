import { XP_PER_WAVE_CLEARED } from "../core/constants";
import { useGameState } from "./useGameState";

export type DefeatOverlayProps = {
  onLeave: () => void;
};

export function DefeatOverlay({ onLeave }: DefeatOverlayProps) {
  const state = useGameState();
  const xpPreview = state.wavesCleared * XP_PER_WAVE_CLEARED;

  return (
    <div className="defeat-overlay" role="dialog" aria-label="Run defeated">
      <div className="defeat-card">
        <h2>Base destroyed</h2>
        <p>
          Waves cleared: <strong>{state.wavesCleared}</strong>
        </p>
        <p>
          Commander XP: <strong>+{xpPreview}</strong>
          <span className="muted"> ({state.wavesCleared} × {XP_PER_WAVE_CLEARED})</span>
        </p>
        <p className="muted">Endless run — defeat awards XP. Skills apply on the next run.</p>
        <button type="button" className="btn primary" onClick={onLeave}>
          Return to menu
        </button>
      </div>
    </div>
  );
}
