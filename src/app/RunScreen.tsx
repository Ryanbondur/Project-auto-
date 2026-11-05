import { GameCanvas } from "../canvas/GameCanvas";
import { gameStore } from "../core/store";
import { Bench } from "../ui/Bench";
import { BoardUnits } from "../ui/BoardUnits";
import { DefeatOverlay } from "../ui/DefeatOverlay";
import { EraDiscoveryModal } from "../ui/EraDiscoveryModal";
import { GambitPanel } from "../ui/GambitPanel";
import { SabotageTray } from "../ui/SabotageTray";
import { Shop } from "../ui/Shop";
import { StatsBar } from "../ui/StatsBar";
import { useGameState } from "../ui/useGameState";

export function RunScreen() {
  const state = useGameState();
  const frozen = state.phase === "ERA_FREEZE";
  const canReady =
    !frozen && (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP");
  const fighting = state.phase === "AUTOBATTLE";

  return (
    <div className={`run-screen${frozen ? " frozen" : ""}`}>
      <StatsBar />
      <div className="play-area">
        <main className="board-column">
          <GameCanvas />
          <div className="ready-row">
            <button
              type="button"
              className="btn primary ready-btn"
              disabled={!canReady}
              onClick={() => gameStore.ready()}
              title="Start the wave — creeps march, units autobattle"
            >
              {fighting ? "Fighting…" : frozen ? "Era Discovery…" : "Ready"}
            </button>
            <span className="muted ready-hint">
              {frozen
                ? "Wave frozen — pick a free 2★ unit"
                : fighting
                  ? `Wave ${state.waveNumber}`
                  : "Start wave"}
            </span>
          </div>
        </main>
      </div>
      <div className="chrome-bottom">
        <Shop />
        <Bench />
        <BoardUnits />
        <SabotageTray />
        <GambitPanel />
      </div>
      {state.phase === "ERA_FREEZE" && <EraDiscoveryModal />}
      {state.phase === "RUN_DEFEAT" && <DefeatOverlay />}
    </div>
  );
}
