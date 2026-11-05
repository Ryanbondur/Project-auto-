import { gameStore } from "../core/store";
import type { GambitId } from "../core/types";
import { useGameState } from "./useGameState";

const GAMBITS: { id: GambitId; label: string; cost: string }[] = [
  { id: "double_interest", label: "Double Interest", cost: "5 HP" },
  { id: "free_rerolls", label: "Free Rerolls ×3", cost: "3g" },
  { id: "random_higher_unit", label: "Random 2★", cost: "8g" },
];

/** Once-per-run commander gambit stub. */
export function GambitPanel() {
  const state = useGameState();
  const used = state.gambit.usedThisRun;

  return (
    <div className="gambit-panel">
      <span className="muted">Commander gambit {used ? "(used)" : "(once/run)"}:</span>
      {GAMBITS.map((g) => (
        <button
          key={g.id}
          type="button"
          className="btn ghost"
          disabled={used || state.phase !== "SHOP_PREP"}
          title={g.cost}
          onClick={() => gameStore.activateGambit(g.id)}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
