import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "../canvas/GameCanvas";
import { gameStore } from "../core/store";
import { Bench } from "../ui/Bench";
import { BoardUnits } from "../ui/BoardUnits";
import { DefeatOverlay } from "../ui/DefeatOverlay";
import { DragGhostOverlay } from "../ui/DragGhost";
import { DpsPanel } from "../ui/DpsPanel";
import { DraftDuelModal } from "../ui/DraftDuelModal";
import { EraDiscoveryModal } from "../ui/EraDiscoveryModal";
import { EventChoiceModal } from "../ui/EventChoiceModal";
import { GambitPanel } from "../ui/GambitPanel";
import { RunFeedbackToast } from "../ui/RunFeedbackToast";
import { SabotageTray } from "../ui/SabotageTray";
import { AutoMergeToggle } from "../ui/AutoMergeToggle";
import { SellZone } from "../ui/SellZone";
import { Shop } from "../ui/Shop";
import { StatsBar } from "../ui/StatsBar";
import { UnitInspectCard } from "../ui/UnitInspectCard";
import { UnitInspectSheet } from "../ui/UnitInspectSheet";
import { useGameState } from "../ui/useGameState";
import { useUnitDrag } from "../ui/useUnitDrag";

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
  const eventPending = Boolean(state.eventChoice);
  const draftPending = Boolean(state.draftDuel);
  const canReady =
    !frozen &&
    !defeated &&
    !eventPending &&
    !draftPending &&
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP");
  const fighting =
    state.phase === "AUTOBATTLE" || state.phase === "EVENT_ARENA";
  const canDrag =
    !frozen &&
    !defeated &&
    !eventPending &&
    !draftPending &&
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP");

  const sellZoneRef = useRef<HTMLDivElement>(null);

  const onInspect = useCallback((instanceId: string) => {
    setHoverId(null);
    setInspectId(instanceId);
    gameStore.selectUnit(instanceId);
  }, []);

  const drag = useUnitDrag({
    enabled: canDrag,
    sellZoneRef,
    onInspect,
  });

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

  // Sticky long-press sheet wins over hover preview card.
  const hoverInspect =
    !inspectId && hoverId ? hoverId : null;

  return (
    <div className={`run-screen${frozen ? " frozen" : ""}`}>
      <StatsBar onPause={defeated ? undefined : onPause} />
      <div className="play-area">
        <main className="board-column">
          <div className="board-stack">
            <GameCanvas
              onBoardUnitDragStart={drag.onPointerDown}
              onBoardUnitDragMove={drag.onPointerMove}
              onBoardUnitDragUp={drag.onPointerUp}
              onBoardUnitDragCancel={drag.onPointerCancel}
              onInspectUnit={onInspect}
              onHoverUnit={setHoverId}
              externalDragging={Boolean(drag.ghost)}
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
              {state.phase === "EVENT_ARENA"
                ? "Arena…"
                : fighting
                  ? "Fighting…"
                  : frozen
                    ? "Era Discovery…"
                    : eventPending
                      ? "Event…"
                      : draftPending
                        ? "Draft…"
                        : "Ready"}
            </button>
            <SellZone hot={drag.sellHot} zoneRef={sellZoneRef} />
            <AutoMergeToggle />
            <span className="muted ready-hint">
              {frozen
                ? "Wave frozen — pick a free 2★ unit"
                : eventPending
                  ? "Pick a run event"
                  : draftPending
                    ? "Pick a draft counter"
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
        <div className="chrome-scroll">
          <Shop />
          <Bench
            onUnitPointerDown={drag.onPointerDown}
            onUnitPointerMove={drag.onPointerMove}
            onUnitPointerUp={drag.onPointerUp}
            onUnitPointerCancel={drag.onPointerCancel}
          />
          <SabotageTray />
        </div>
        <div className="chrome-unit-slot">
          <BoardUnits
            onUnitPointerDown={drag.onPointerDown}
            onUnitPointerMove={drag.onPointerMove}
            onUnitPointerUp={drag.onPointerUp}
            onUnitPointerCancel={drag.onPointerCancel}
            onInspect={onInspect}
          />
        </div>
        <div className="chrome-gambit-slot">
          <GambitPanel />
        </div>
      </div>
      <RunFeedbackToast />
      {state.phase === "ERA_FREEZE" && <EraDiscoveryModal />}
      {state.eventChoice && !state.discovery && <EventChoiceModal />}
      {state.draftDuel && !state.eventChoice && !state.discovery && (
        <DraftDuelModal />
      )}
      {inspectId && (
        <UnitInspectSheet
          instanceId={inspectId}
          onClose={() => setInspectId(null)}
        />
      )}
      <DragGhostOverlay ghost={drag.ghost} />
      {defeated && <DefeatOverlay onLeave={onLeaveDefeat} />}
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
