import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export function DefeatOverlay() {
  const state = useGameState();

  return (
    <div className="defeat-overlay" role="dialog" aria-label="Run defeated">
      <div className="defeat-card">
        <h2>Base destroyed</h2>
        <p>
          Waves cleared: <strong>{state.wavesCleared}</strong>
        </p>
        <p className="muted">Endless run — no wave-100 victory. XP / meta arrive in Phase 5.</p>
        <button type="button" className="btn primary" onClick={() => gameStore.resetRun()}>
          New run
        </button>
      </div>
    </div>
  );
}
