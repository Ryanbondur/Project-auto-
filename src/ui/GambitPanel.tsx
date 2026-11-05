import {
  GAMBIT_DOUBLE_INTEREST_HP_COST,
  GAMBIT_FREE_REROLL_COUNT,
  GAMBIT_FREE_REROLLS_GOLD_COST,
  GAMBIT_RANDOM_2STAR_GOLD_COST,
  GAMBIT_USES_PER_RUN,
} from "../core/constants";
import { gambitsRemaining } from "../core/gambit";
import { gameStore } from "../core/store";
import type { GambitId } from "../core/types";
import { useGameState } from "./useGameState";
import { useState } from "react";

const GAMBITS: {
  id: GambitId;
  label: string;
  blurb: string;
  costLabel: string;
}[] = [
  {
    id: "double_interest",
    label: "Double Interest",
    blurb: "Next wave payout interest ×2.",
    costLabel: `${GAMBIT_DOUBLE_INTEREST_HP_COST} HP`,
  },
  {
    id: "free_rerolls",
    label: "Free Rerolls",
    blurb: `${GAMBIT_FREE_REROLL_COUNT} free shop rerolls this prep.`,
    costLabel: `${GAMBIT_FREE_REROLLS_GOLD_COST}g`,
  },
  {
    id: "random_higher_unit",
    label: "Random 2★",
    blurb: "Instant random 2★ from unlocked eras.",
    costLabel: `${GAMBIT_RANDOM_2STAR_GOLD_COST}g`,
  },
];

/** Mobile-first once-per-run commander gambit picker (bottom sheet). */
export function GambitPanel() {
  const state = useGameState();
  const [open, setOpen] = useState(false);
  const remaining = gambitsRemaining(state.gambit);
  const canAct =
    remaining > 0 &&
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP");

  return (
    <div className="gambit-panel">
      <button
        type="button"
        className="btn gambit-open"
        disabled={!canAct && remaining <= 0}
        onClick={() => setOpen(true)}
      >
        {remaining > 0
          ? `Gambit (${remaining}/${GAMBIT_USES_PER_RUN})`
          : "Gambit used"}
      </button>
      {state.gambit.freeRerollsRemaining > 0 && (
        <span className="gambit-active muted">
          Free rerolls ×{state.gambit.freeRerollsRemaining}
        </span>
      )}
      {state.gambit.activeGambit === "double_interest" && (
        <span className="gambit-active muted">Interest ×2 next payout</span>
      )}

      {open && (
        <div
          className="gambit-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Commander gambit"
          onClick={() => setOpen(false)}
        >
          <div
            className="gambit-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="gambit-sheet-header">
              <h2>Commander gambit</h2>
              <p className="muted">
                Once per run — bend one prep or payout.
              </p>
              <button
                type="button"
                className="btn ghost sheet-close"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </header>
            <ul className="gambit-options">
              {GAMBITS.map((g) => {
                const afford =
                  g.id === "double_interest"
                    ? state.baseHp > GAMBIT_DOUBLE_INTEREST_HP_COST
                    : g.id === "free_rerolls"
                      ? state.gold >= GAMBIT_FREE_REROLLS_GOLD_COST
                      : state.gold >= GAMBIT_RANDOM_2STAR_GOLD_COST;
                const disabled = !canAct || !afford;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      className="gambit-option"
                      disabled={disabled}
                      onClick={() => {
                        const r = gameStore.activateGambit(g.id);
                        if (r.ok) setOpen(false);
                      }}
                    >
                      <span className="gambit-option-title">{g.label}</span>
                      <span className="gambit-option-blurb">{g.blurb}</span>
                      <span className="gambit-option-cost">{g.costLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
