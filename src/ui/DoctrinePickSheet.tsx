import { DOCTRINE_DEFS } from "../content/doctrines";
import type { DoctrineId } from "../core/types";

export type DoctrinePickSheetProps = {
  onPick: (id: DoctrineId) => void;
  onCancel: () => void;
};

/**
 * Mobile-first bottom sheet: pick 1 Commander Doctrine at New Run.
 */
export function DoctrinePickSheet({ onPick, onCancel }: DoctrinePickSheetProps) {
  return (
    <div
      className="event-overlay doctrine-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Choose doctrine"
    >
      <div className="event-sheet doctrine-sheet">
        <header className="event-sheet-header">
          <p className="event-kicker">Commander</p>
          <h2>Pick a Doctrine</h2>
          <p className="muted">One loadout for this run — shown as a tiny HUD chip.</p>
        </header>
        <ul className="event-options">
          {DOCTRINE_DEFS.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="event-option kind-passive"
                onClick={() => onPick(d.id)}
              >
                <span className="event-option-kind">Doctrine</span>
                <span className="event-option-title">{d.name}</span>
                <span className="event-option-blurb">{d.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn ghost doctrine-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
