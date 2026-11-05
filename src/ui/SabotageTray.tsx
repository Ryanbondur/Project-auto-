import { getPathSabotageDef } from "../content/pathSabotage";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export function SabotageTray() {
  const state = useGameState();
  const unplaced = state.pathSabotages.filter((s) => !s.placed);
  if (unplaced.length === 0 && state.pathSabotages.length === 0) return null;

  const canAct = state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";

  return (
    <div className="sabotage-tray">
      <span className="muted">Path sabotage</span>
      <ul className="chip-list">
        {state.pathSabotages.map((s) => {
          const def = getPathSabotageDef(s.defId);
          const selected = state.selectedSabotageId === s.instanceId;
          return (
            <li key={s.instanceId} className={`chip-row${selected ? " selected" : ""}`}>
              <button
                type="button"
                className="bench-select"
                disabled={!canAct || s.placed}
                onClick={() =>
                  gameStore.selectSabotage(selected ? null : s.instanceId)
                }
              >
                {def?.name ?? s.defId}
                {s.placed ? ` @ path ${s.pathIndex}` : " (click path tile)"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
