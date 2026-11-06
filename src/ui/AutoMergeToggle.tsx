import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

/** Compact prep control — auto pairwise merge on by default; drag-combine always works. */
export function AutoMergeToggle() {
  const state = useGameState();
  const canAct =
    state.phase === "SHOP_PREP" ||
    state.phase === "MERGE_SETUP" ||
    state.phase === "ERA_FREEZE";

  return (
    <label className={`auto-merge-toggle${canAct ? "" : " dim"}`}>
      <input
        type="checkbox"
        checked={state.autoMergeEnabled}
        disabled={!canAct}
        onChange={(e) => gameStore.setAutoMergeEnabled(e.target.checked)}
      />
      <span>Auto-merge</span>
    </label>
  );
}
