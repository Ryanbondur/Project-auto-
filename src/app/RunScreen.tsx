import { useCallback, useRef, useState } from "react";
import { GameCanvas } from "../canvas/GameCanvas";
import { gameStore } from "../core/store";
import { Bench } from "../ui/Bench";
import { BoardUnits } from "../ui/BoardUnits";
import { DefeatOverlay } from "../ui/DefeatOverlay";
import { DragGhostOverlay } from "../ui/DragGhost";
import { EraDiscoveryModal } from "../ui/EraDiscoveryModal";
import { EventChoiceModal } from "../ui/EventChoiceModal";
import { GambitPanel } from "../ui/GambitPanel";
import { SabotageTray } from "../ui/SabotageTray";
import { AutoMergeToggle } from "../ui/AutoMergeToggle";
import { SellZone } from "../ui/SellZone";
import { Shop } from "../ui/Shop";
import { StatsBar } from "../ui/StatsBar";
import { UnitInspectSheet } from "../ui/UnitInspectSheet";
import { useGameState } from "../ui/useGameState";
import { useUnitDrag } from "../ui/useUnitDrag";

export type RunScreenProps = {
  onPause: () => void;
  onLeaveDefeat: () => void;
};

export function RunScreen({ onPause, onLeaveDefeat }: RunScreenProps) {
  const state = useGameState();
  const frozen = state.phase === "ERA_FREEZE";
  const defeated = state.phase === "RUN_DEFEAT";
  const eventPending = Boolean(state.eventChoice);
  const canReady =
    !frozen &&
    !defeated &&
    !eventPending &&
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP");
  const fighting =
    state.phase === "AUTOBATTLE" || state.phase === "EVENT_ARENA";
  const canDrag =
    !frozen &&
    !defeated &&
    !eventPending &&
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP");

  const sellZoneRef = useRef<HTMLDivElement>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);

  const onInspect = useCallback((instanceId: string) => {
    setInspectId(instanceId);
    gameStore.selectUnit(instanceId);
  }, []);

  const drag = useUnitDrag({
    enabled: canDrag,
    sellZoneRef,
    onInspect,
  });

  return (
    <div className={`run-screen${frozen ? " frozen" : ""}`}>
      <StatsBar onPause={defeated ? undefined : onPause} />
      <div className="play-area">
        <main className="board-column">
          <GameCanvas
            onBoardUnitDragStart={drag.onPointerDown}
            onBoardUnitDragMove={drag.onPointerMove}
            onBoardUnitDragUp={drag.onPointerUp}
            onBoardUnitDragCancel={drag.onPointerCancel}
            onInspectUnit={onInspect}
            externalDragging={Boolean(drag.ghost)}
          />
          <div className="ready-row">
            <button
              type="button"
              className="btn primary ready-btn"
              disabled={!canReady}
              onClick={() => gameStore.ready()}
              title="Start the wave — creeps march, units autobattle"
            >
              {state.phase === "EVENT_ARENA"
                ? "Arena…"
                : fighting
                  ? "Fighting…"
                  : frozen
                    ? "Era Discovery…"
                    : eventPending
                      ? "Event…"
                      : "Ready"}
            </button>
            <SellZone hot={drag.sellHot} zoneRef={sellZoneRef} />
            <AutoMergeToggle />
            <span className="muted ready-hint">
              {frozen
                ? "Wave frozen — pick a free 2★ unit"
                : eventPending
                  ? "Pick a run event"
                  : state.phase === "EVENT_ARENA"
                    ? "Boss arena — win loot or pay fail cost"
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
        <Bench
          onUnitPointerDown={drag.onPointerDown}
          onUnitPointerMove={drag.onPointerMove}
          onUnitPointerUp={drag.onPointerUp}
          onUnitPointerCancel={drag.onPointerCancel}
        />
        <BoardUnits
          onUnitPointerDown={drag.onPointerDown}
          onUnitPointerMove={drag.onPointerMove}
          onUnitPointerUp={drag.onPointerUp}
          onUnitPointerCancel={drag.onPointerCancel}
          onInspect={onInspect}
        />
        <SabotageTray />
        <GambitPanel />
      </div>
      {state.phase === "ERA_FREEZE" && <EraDiscoveryModal />}
      {state.eventChoice && <EventChoiceModal />}
      {inspectId && (
        <UnitInspectSheet
          instanceId={inspectId}
          onClose={() => setInspectId(null)}
        />
      )}
      <DragGhostOverlay ghost={drag.ghost} />
      {defeated && <DefeatOverlay onLeave={onLeaveDefeat} />}
    </div>
  );
}
