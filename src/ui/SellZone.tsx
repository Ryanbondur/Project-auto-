import type { RefObject } from "react";
import { sellValue } from "../core/economy";
import { getUnitDef } from "../content/units";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export type SellZoneProps = {
  /** Highlight when a drag is hovering the trash target. */
  hot?: boolean;
  /** Forwarded for drop hit-testing from the shared drag layer. */
  zoneRef?: RefObject<HTMLDivElement | null>;
};

/**
 * Mobile-first sell drop target — drag a board/bench unit here to refund.
 * Also acts as a large tap target when a unit is already selected.
 */
export function SellZone({ hot = false, zoneRef }: SellZoneProps) {
  const state = useGameState();
  const canAct =
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP") &&
    !state.eventChoice;
  const selected = state.selectedInstanceId
    ? (state.bench.find((u) => u.instanceId === state.selectedInstanceId) ??
      state.board.find((u) => u.instanceId === state.selectedInstanceId))
    : undefined;
  const def = selected ? getUnitDef(selected.defId) : undefined;
  const refund =
    selected && def ? sellValue(def.cost, selected.starLevel) : null;

  return (
    <div
      ref={zoneRef}
      className={`sell-zone${hot ? " hot" : ""}${selected ? " armed" : ""}`}
      data-sell-zone="true"
      aria-label={
        refund !== null
          ? `Sell selected unit for ${refund} gold`
          : "Sell zone — drag a unit here"
      }
    >
      <button
        type="button"
        className="sell-zone-btn"
        disabled={!canAct || !selected}
        onClick={() => {
          if (selected) gameStore.sellUnit(selected.instanceId);
        }}
        title="Sell selected unit"
      >
        <span className="sell-zone-icon" aria-hidden>
          ⌫
        </span>
        <span className="sell-zone-label">
          {refund !== null ? `Sell · ${refund}g` : "Sell"}
        </span>
      </button>
    </div>
  );
}
