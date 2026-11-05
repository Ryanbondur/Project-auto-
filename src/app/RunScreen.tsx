import { GameCanvas } from "../canvas/GameCanvas";
import { gameStore } from "../core/store";
import { Bench } from "../ui/Bench";
import { BoardUnits } from "../ui/BoardUnits";
import { GambitPanel } from "../ui/GambitPanel";
import { Shop } from "../ui/Shop";
import { StatsBar } from "../ui/StatsBar";
import { useGameState } from "../ui/useGameState";

export function RunScreen() {
  const state = useGameState();
  const canReady = state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";

  return (
    <div className="run-screen">
      <StatsBar />
      <div className="run-body">
        <Shop />
        <main className="board-column">
          <GameCanvas />
          <BoardUnits />
          <div className="ready-row">
            <button
              type="button"
              className="btn primary"
              disabled={!canReady}
              onClick={() => gameStore.readyStub()}
              title="Phase 2 prep loop — combat arrives in Phase 3"
            >
              Ready (prep cycle)
            </button>
            <span className="muted">
              Skips combat for now: interest + income, wave++, shop refresh.
            </span>
          </div>
          <GambitPanel />
        </main>
      </div>
      <Bench />
    </div>
  );
}
