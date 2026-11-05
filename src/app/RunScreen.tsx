import { useEffect, useState } from "react";
import { GameCanvas } from "../canvas/GameCanvas";
import { gameStore } from "../core/store";
import { Bench } from "../ui/Bench";
import { BoardUnits } from "../ui/BoardUnits";
import { DefeatOverlay } from "../ui/DefeatOverlay";
import { DpsPanel } from "../ui/DpsPanel";
import { EraDiscoveryModal } from "../ui/EraDiscoveryModal";
import { GambitPanel } from "../ui/GambitPanel";
import { SabotageTray } from "../ui/SabotageTray";
import { Shop } from "../ui/Shop";
import { StatsBar } from "../ui/StatsBar";
import { UnitInspectCard } from "../ui/UnitInspectCard";
import { useGameState } from "../ui/useGameState";

export type RunScreenProps = {
  onPause: () => void;
  onLeaveDefeat: () => void;
};

export function RunScreen({ onPause, onLeaveDefeat }: RunScreenProps) {
  const state = useGameState();
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const frozen = state.phase === "ERA_FREEZE";
  const defeated = state.phase === "RUN_DEFEAT";
  const canReady =
    !frozen &&
    !defeated &&
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP");
  const fighting = state.phase === "AUTOBATTLE";

  // Screenshot / automation hook: window.dispatchEvent(new CustomEvent("atd:debug-inspect", { detail: { instanceId } }))
  useEffect(() => {
    const onDebugInspect = (ev: Event) => {
      const detail = (ev as CustomEvent<{ instanceId?: string }>).detail;
      if (detail?.instanceId) {
        setHoverId(null);
        setInspectId(detail.instanceId);
      }
    };
    window.addEventListener("atd:debug-inspect", onDebugInspect);
    return () => window.removeEventListener("atd:debug-inspect", onDebugInspect);
  }, []);

  // Sticky long-press wins over hover preview.
  const stickyInspect = inspectId;
  const hoverInspect =
    !stickyInspect && hoverId && hoverId !== stickyInspect ? hoverId : null;

  return (
    <div className={`run-screen${frozen ? " frozen" : ""}`}>
      <StatsBar onPause={defeated ? undefined : onPause} />
      <div className="play-area">
        <main className="board-column">
          <div className="board-stack">
            <GameCanvas
              onInspectUnit={(id) => {
                setHoverId(null);
                setInspectId(id);
              }}
              onHoverUnit={setHoverId}
            />
            <DpsPanel />
          </div>
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
            {!defeated && (
              <button
                type="button"
                className="btn ghost pause-btn"
                onClick={onPause}
                title="Pause and return to menu — only one active run"
              >
                Pause
              </button>
            )}
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
      {defeated && <DefeatOverlay onLeave={onLeaveDefeat} />}
      {stickyInspect && (
        <UnitInspectCard
          instanceId={stickyInspect}
          onClose={() => setInspectId(null)}
        />
      )}
      {hoverInspect && (
        <UnitInspectCard
          instanceId={hoverInspect}
          ephemeral
          onClose={() => setHoverId(null)}
        />
      )}
    </div>
  );
}
