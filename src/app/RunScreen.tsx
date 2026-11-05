import { GameCanvas } from "../canvas/GameCanvas";
import { gameStore } from "../core/store";
import { Bench } from "../ui/Bench";
import { BoardUnits } from "../ui/BoardUnits";
import { DefeatOverlay } from "../ui/DefeatOverlay";
import { GambitPanel } from "../ui/GambitPanel";
import { SabotageTray } from "../ui/SabotageTray";
import { Shop } from "../ui/Shop";
import { StatsBar } from "../ui/StatsBar";
import { useGameState } from "../ui/useGameState";

export function RunScreen() {
  const state = useGameState();
  const canReady = state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";
  const fighting = state.phase === "AUTOBATTLE";

  return (
    <div className="run-screen">
      <StatsBar />
      <div className="run-body">
        <Shop />
        <main className="board-column">
          <GameCanvas />
          <BoardUnits />
          <SabotageTray />
          <div className="ready-row">
            <button
              type="button"
              className="btn primary"
              disabled={!canReady}
              onClick={() => gameStore.ready()}
              title="Start the wave — creeps march, units autobattle"
            >
              {fighting ? "Fighting…" : "Ready"}
            </button>
            <span className="muted">
              {fighting
                ? `Wave ${state.waveNumber} in progress`
                : "Starts autobattle. Clear wave → gold income + interest → prep."}
            </span>
          </div>
          <GambitPanel />
        </main>
      </div>
      <Bench />
      {state.phase === "RUN_DEFEAT" && <DefeatOverlay />}
    </div>
  );
}
