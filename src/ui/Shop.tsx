import { getBuffChipDef } from "../content/buffChips";
import { getPathSabotageDef } from "../content/pathSabotage";
import { ERA_HUE, getUnitDef } from "../content/units";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

function offerTitle(kind: string, defId: string): string {
  if (kind === "unit") return getUnitDef(defId)?.name ?? defId;
  if (kind === "buff_chip") return getBuffChipDef(defId)?.name ?? defId;
  return getPathSabotageDef(defId)?.name ?? defId;
}

function offerMeta(kind: string, defId: string): string {
  if (kind === "unit") {
    const def = getUnitDef(defId);
    return def ? `Era ${def.era} · ${def.tags.join(", ")}` : "";
  }
  if (kind === "buff_chip") {
    const def = getBuffChipDef(defId);
    return def ? `Chip · ${def.effect}` : "Buff chip";
  }
  const def = getPathSabotageDef(defId);
  return def ? `Sabotage · ${def.kind}` : "Path sabotage";
}

function offerHue(kind: string, defId: string): number {
  if (kind === "unit") {
    const def = getUnitDef(defId);
    return def ? ERA_HUE[def.era] : 0;
  }
  if (kind === "buff_chip") return 160;
  return 45;
}

export function Shop() {
  const state = useGameState();
  const canAct = state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";

  return (
    <aside className="shop panel">
      <div className="panel-header">
        <h2>Shop</h2>
        <button
          type="button"
          className="btn"
          disabled={!canAct || (state.gambit.freeRerollsRemaining <= 0 && state.gold < 1)}
          onClick={() => gameStore.rerollShop()}
        >
          Reroll (
          {state.gambit.freeRerollsRemaining > 0
            ? `free×${state.gambit.freeRerollsRemaining}`
            : `${state.shop.rerollCost}g`}
          )
        </button>
      </div>
      <ul className="shop-offers">
        {state.shop.offers.map((offer) => {
          const hue = offerHue(offer.kind, offer.defId);
          const canBuy =
            canAct && !offer.purchased && state.gold >= offer.cost &&
            (offer.kind !== "unit" ||
              state.bench.length < state.metaApplied.benchCapacity);
          return (
            <li
              key={offer.slotIndex}
              className={`shop-offer${offer.purchased ? " purchased" : ""}`}
            >
              <div
                className="unit-swatch"
                style={{ background: `hsl(${hue} 55% 42%)` }}
                aria-hidden
              />
              <div className="offer-body">
                <div className="offer-name">
                  {offerTitle(offer.kind, offer.defId)}
                  {offer.kind !== "unit" ? (
                    <span className="offer-kind"> {offer.kind}</span>
                  ) : null}
                </div>
                <div className="offer-meta">{offerMeta(offer.kind, offer.defId)}</div>
              </div>
              <button
                type="button"
                className="btn buy"
                disabled={!canBuy}
                onClick={() => gameStore.buyOffer(offer.slotIndex)}
              >
                {offer.purchased ? "Sold" : `${offer.cost}g`}
              </button>
            </li>
          );
        })}
      </ul>
      {state.chipInventory.length > 0 && (
        <div className="chip-inv">
          <div className="panel-header">
            <h2>Chips</h2>
          </div>
          <ul className="chip-list">
            {state.chipInventory.map((chip) => {
              const def = getBuffChipDef(chip.defId);
              return (
                <li key={chip.instanceId} className="chip-row">
                  <span>
                    {def?.name ?? chip.defId} {"★".repeat(Math.min(chip.starLevel, 8))}
                  </span>
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={!state.selectedInstanceId}
                    title="Select a unit, then socket"
                    onClick={() => {
                      if (state.selectedInstanceId) {
                        gameStore.socketChip(chip.instanceId, state.selectedInstanceId);
                      }
                    }}
                  >
                    Socket
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {state.pathSabotages.some((s) => !s.placed) && (
        <p className="stub-note">
          Path sabotage owned (unplaced) — placement UX TODO.
        </p>
      )}
    </aside>
  );
}
