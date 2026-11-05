import { getUnitDef, ERA_HUE } from "../content/units";
import { useGameState } from "./useGameState";

export function Shop() {
  const state = useGameState();

  return (
    <aside className="shop panel">
      <div className="panel-header">
        <h2>Shop</h2>
        <button type="button" className="btn" disabled title="Phase 2">
          Reroll ({state.shop.rerollCost}g)
        </button>
      </div>
      <ul className="shop-offers">
        {state.shop.offers.map((offer) => {
          const def = getUnitDef(offer.defId);
          const hue = def ? ERA_HUE[def.era] : 0;
          return (
            <li key={offer.slotIndex} className="shop-offer">
              <div
                className="unit-swatch"
                style={{ background: `hsl(${hue} 55% 42%)` }}
                aria-hidden
              />
              <div className="offer-body">
                <div className="offer-name">{def?.name ?? offer.defId}</div>
                <div className="offer-meta">
                  Era {def?.era ?? "?"} · {def?.tags.join(", ") ?? ""}
                </div>
              </div>
              <button type="button" className="btn buy" disabled title="Phase 2">
                {offer.cost}g
              </button>
            </li>
          );
        })}
      </ul>
      <p className="stub-note">Buy / reroll stubbed until Phase 2.</p>
    </aside>
  );
}
