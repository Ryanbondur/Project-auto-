import { GameCanvas } from "../canvas/GameCanvas";
import { Bench } from "../ui/Bench";
import { Shop } from "../ui/Shop";
import { StatsBar } from "../ui/StatsBar";

export function RunScreen() {
  return (
    <div className="run-screen">
      <StatsBar />
      <div className="run-body">
        <Shop />
        <main className="board-column">
          <GameCanvas />
          <div className="ready-row">
            <button type="button" className="btn primary" disabled title="Phase 3">
              Ready / Start Wave
            </button>
            <span className="muted">Combat stubbed until Phase 3.</span>
          </div>
        </main>
      </div>
      <Bench />
    </div>
  );
}
