import { eraColor } from "../canvas/theme";
import { getEraConfig } from "../content/eras";
import { getUnitDef } from "../content/units";
import { gameStore } from "../core/store";
import { UnitIcon } from "./UnitIcon";
import { useGameState } from "./useGameState";

/**
 * Full-screen sheet: 3 free 2★ choices from the newly unlocked era.
 * Wave progress and shop stay frozen until the player picks one.
 */
export function EraDiscoveryModal() {
  const state = useGameState();
  if (state.phase !== "ERA_FREEZE" || !state.discovery) return null;

  const era = getEraConfig(state.discovery.newEra);
  const fill = eraColor(state.discovery.newEra);

  return (
    <div
      className="era-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Era Discovery — ${era.name}`}
    >
      <div className="era-sheet">
        <header className="era-sheet-header">
          <p className="era-kicker">Era unlocked</p>
          <h2>
            <span className="era-swatch" style={{ background: fill }} />
            {era.name}
          </h2>
          <p className="era-sub">
            Pick 1 free Level-2 unit. Wave {state.waveNumber} waits until you choose.
          </p>
        </header>
        <ul className="era-choices">
          {state.discovery.choices.map((choice, index) => {
            const def = getUnitDef(choice.defId);
            return (
              <li key={`${choice.defId}-${index}`}>
                <button
                  type="button"
                  className="era-choice"
                  onClick={() => gameStore.pickDiscovery(index)}
                >
                  <UnitIcon
                    defId={choice.defId}
                    starLevel={2}
                    animate
                    size={40}
                    className="unit-swatch unit-icon era-choice-swatch"
                  />
                  <span className="era-choice-body">
                    <span className="offer-name">
                      {def?.name ?? choice.defId} ★★
                    </span>
                    <span className="offer-meta">
                      {def
                        ? `Cost ${def.cost} · ${def.tags.join(", ")}`
                        : "New era unit"}
                    </span>
                    {def?.abilities.starLevel2 ? (
                      <span className="era-ability">{def.abilities.starLevel2}</span>
                    ) : null}
                  </span>
                  <span className="era-choice-cta">Take free</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
