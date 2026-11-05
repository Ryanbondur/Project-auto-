import { getUnitDef, ERA_HUE } from "../content/units";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export function BoardUnits() {
  const state = useGameState();
  const canAct = state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";

  if (state.board.length === 0) {
    return (
      <p className="board-hint">No units on board — buy and place from the bench.</p>
    );
  }

  return (
    <ul className="board-units">
      {state.board.map((unit) => {
        const def = getUnitDef(unit.defId);
        const hue = def ? ERA_HUE[def.era] : 0;
        const selected = state.selectedInstanceId === unit.instanceId;
        return (
          <li key={unit.instanceId} className={`board-unit${selected ? " selected" : ""}`}>
            <button
              type="button"
              className="bench-select"
              onClick={() =>
                gameStore.selectUnit(selected ? null : unit.instanceId)
              }
            >
              <div
                className="unit-swatch"
                style={{ background: `hsl(${hue} 55% 42%)` }}
              />
              <span>
                {def?.name ?? unit.defId} {"★".repeat(Math.min(unit.starLevel, 8))} @ (
                {unit.tile?.x},{unit.tile?.y})
              </span>
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!canAct}
              onClick={() => gameStore.moveToBench(unit.instanceId)}
            >
              Bench
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!canAct}
              onClick={() => gameStore.sellUnit(unit.instanceId)}
            >
              Sell
            </button>
          </li>
        );
      })}
    </ul>
  );
}
