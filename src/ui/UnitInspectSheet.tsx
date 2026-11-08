import { getUnitDef } from "../content/units";
import { sellValue } from "../core/economy";
import { effectiveStats } from "../core/stats";
import { gameStore } from "../core/store";
import { UnitIcon } from "./UnitIcon";
import { useGameState } from "./useGameState";

export type UnitInspectSheetProps = {
  instanceId: string | null;
  onClose: () => void;
};

/**
 * Long-press / inspect sheet for a board or bench unit.
 * Primary phone path to Sell without hunting list chrome.
 */
export function UnitInspectSheet({
  instanceId,
  onClose,
}: UnitInspectSheetProps) {
  const state = useGameState();
  if (!instanceId) return null;

  const unit =
    state.board.find((u) => u.instanceId === instanceId) ??
    state.bench.find((u) => u.instanceId === instanceId);
  if (!unit) return null;

  const def = getUnitDef(unit.defId);
  const stats = effectiveStats(unit, state.metaApplied);
  const refund = def ? sellValue(def.cost, unit.starLevel) : 0;
  const canAct =
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP") &&
    !state.eventChoice;
  const onBoard = unit.tile !== null;

  return (
    <div
      className="inspect-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Unit inspect"
      onClick={onClose}
    >
      <div
        className="inspect-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="inspect-header">
          <UnitIcon
            defId={unit.defId}
            starLevel={unit.starLevel}
            animate
            size={40}
          />
          <div>
            <h2>
              {def?.name ?? unit.defId}{" "}
              {"★".repeat(Math.min(unit.starLevel, 8))}
            </h2>
            <p className="muted">
              {onBoard
                ? `Board (${unit.tile!.x},${unit.tile!.y}) · ${unit.targeting}`
                : `Bench · ${unit.targeting}`}
            </p>
          </div>
          <button
            type="button"
            className="btn ghost sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        {stats && (
          <p className="inspect-stats">
            dmg {stats.damage.toFixed(0)} · as {stats.attackSpeed.toFixed(2)} ·
            rng {stats.range.toFixed(1)}
            {def?.tags?.length ? ` · ${def.tags.join(", ")}` : ""}
          </p>
        )}
        <div className="inspect-actions">
          <button
            type="button"
            className="btn ghost"
            disabled={!canAct}
            onClick={() => {
              gameStore.cycleTargeting(unit.instanceId);
            }}
          >
            Target
          </button>
          {onBoard && (
            <button
              type="button"
              className="btn ghost"
              disabled={!canAct}
              onClick={() => {
                gameStore.moveToBench(unit.instanceId);
                onClose();
              }}
            >
              Bench
            </button>
          )}
          <button
            type="button"
            className="btn primary inspect-sell"
            disabled={!canAct}
            onClick={() => {
              gameStore.sellUnit(unit.instanceId);
              onClose();
            }}
          >
            Sell · {refund}g
          </button>
        </div>
      </div>
    </div>
  );
}
