import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

/**
 * Minimal neon glass sheet: exactly 2 big event cards, mobile-first.
 * Opens after Era Discovery (era first → then event) or on late 10-wave band.
 */
export function EventChoiceModal() {
  const state = useGameState();
  if (!state.eventChoice) return null;

  const reason =
    state.eventChoice.reason === "era"
      ? "Era unlocked — pick one run event"
      : "Wave band — pick one run event";

  return (
    <div
      className="event-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Run event"
    >
      <div className="event-sheet">
        <header className="event-sheet-header">
          <p className="event-kicker">Event</p>
          <h2>Choose one</h2>
          <p className="muted">{reason}</p>
        </header>
        <ul className="event-options">
          {state.eventChoice.choices.map((choice, index) => {
            const tooPoor =
              choice.goldCost !== undefined && state.gold < choice.goldCost;
            return (
              <li key={`${choice.id}-${index}`}>
                <button
                  type="button"
                  className={`event-option kind-${choice.kind}`}
                  disabled={tooPoor}
                  onClick={() => gameStore.pickEvent(index)}
                >
                  <span className="event-option-kind">{choice.kind}</span>
                  <span className="event-option-title">{choice.title}</span>
                  <span className="event-option-blurb">{choice.blurb}</span>
                  {choice.goldCost !== undefined && (
                    <span className="event-option-cost">
                      {tooPoor ? "Need " : ""}
                      {choice.goldCost}g
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
