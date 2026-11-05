import { getPathSabotageDef } from "../content/pathSabotage";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export function SabotageTray() {
  const state = useGameState();
  if (state.pathSabotages.length === 0) return null;

  const canAct = state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";
  const unplaced = state.pathSabotages.filter((s) => !s.placed);

  return (
    <div className="sabotage-tray panel">
      <div className="panel-header">
        <h2>Path sabotage</h2>
        {unplaced.length > 0 && (
          <span className="muted sabotage-hint">Tap item, then a path tile</span>
        )}
      </div>
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
                <strong>{def?.name ?? s.defId}</strong>
                <span className="muted">
                  {s.placed
                    ? ` @ path ${s.pathIndex}`
                    : def?.kind === "brief_fork"
                      ? " · divert"
                      : " · slow"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
