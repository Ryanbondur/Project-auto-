import { getUnitDef } from "../content/units";
import { gameStore } from "../core/store";
import { UnitIcon } from "./UnitIcon";
import { useGameState } from "./useGameState";

export type BoardUnitsProps = {
  onUnitPointerDown?: (
    e: React.PointerEvent,
    instanceId: string,
    label: string,
  ) => void;
  onUnitPointerMove?: (e: React.PointerEvent) => void;
  onUnitPointerUp?: (e: React.PointerEvent) => void;
  onUnitPointerCancel?: (e: React.PointerEvent) => void;
  onInspect?: (instanceId: string) => void;
};

export function BoardUnits({
  onUnitPointerDown,
  onUnitPointerMove,
  onUnitPointerUp,
  onUnitPointerCancel,
  onInspect,
}: BoardUnitsProps) {
  const state = useGameState();
  const canAct =
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP") &&
    !state.eventChoice;
  const canCycle = state.phase !== "RUN_DEFEAT";

  if (state.board.length === 0) {
    return (
      <p className="board-hint">No units on board — buy and place from the bench.</p>
    );
  }

  return (
    <ul className="board-units">
      {state.board.map((unit) => {
        const def = getUnitDef(unit.defId);
        const selected = state.selectedInstanceId === unit.instanceId;
        const label = `${def?.name ?? unit.defId} ${"★".repeat(Math.min(unit.starLevel, 8))}`;
        return (
          <li
            key={unit.instanceId}
            className={`board-unit${selected ? " selected" : ""}`}
            data-unit-id={unit.instanceId}
          >
            <button
              type="button"
              className="bench-select"
              data-unit-id={unit.instanceId}
              style={{ touchAction: "none" }}
              onPointerDown={(e) =>
                canAct && onUnitPointerDown
                  ? onUnitPointerDown(e, unit.instanceId, label)
                  : gameStore.selectUnit(selected ? null : unit.instanceId)
              }
              onPointerMove={onUnitPointerMove}
              onPointerUp={onUnitPointerUp}
              onPointerCancel={onUnitPointerCancel}
            >
              <UnitIcon
                defId={unit.defId}
                starLevel={unit.starLevel}
                selected={selected}
                animate
                size={32}
              />
              <span>
                {label} @ ({unit.tile?.x},{unit.tile?.y}) · {unit.targeting}
              </span>
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!canCycle}
              onClick={() => gameStore.cycleTargeting(unit.instanceId)}
              title="Cycle targeting"
            >
              Target
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!canAct}
              onClick={() => onInspect?.(unit.instanceId)}
              title="Inspect / sell"
            >
              Info
            </button>
          </li>
        );
      })}
    </ul>
  );
}
