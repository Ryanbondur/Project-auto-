import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

/**
 * Async draft duel — 3 anonymized rival board summaries; pick a counter trait.
 * Queued after Era Discovery → Event Choice (never double-modal with those).
 */
export function DraftDuelModal() {
  const state = useGameState();
  if (!state.draftDuel) return null;

  return (
    <div
      className="event-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Draft duel"
    >
      <div className="event-sheet draft-sheet">
        <header className="event-sheet-header">
          <p className="event-kicker">Draft duel</p>
          <h2>Scout rivals</h2>
          <p className="muted">
            Era {state.draftDuel.era} — pick one counter for the next segment
          </p>
        </header>
        <ul className="event-options draft-rivals">
          {state.draftDuel.rivals.map((rival, index) => (
            <li key={rival.id}>
              <button
                type="button"
                className="event-option kind-chest"
                onClick={() => gameStore.pickDraftCounter(index)}
              >
                <span className="event-option-kind">{rival.codename}</span>
                <span className="event-option-title">{rival.archetype}</span>
                <span className="event-option-blurb">
                  {rival.stats.dps} · {rival.stats.economy} · {rival.stats.board}
                </span>
                <span className="draft-counter-label">
                  Counter: {rival.counterLabel}
                </span>
                <span className="event-option-blurb">{rival.counterBlurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
