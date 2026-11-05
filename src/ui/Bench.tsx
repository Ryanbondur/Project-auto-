import { eraColor } from "../canvas/theme";
import { getUnitDef } from "../content/units";
import { effectiveStats } from "../core/stats";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export type BenchProps = {
  onUnitPointerDown?: (
    e: React.PointerEvent,
    instanceId: string,
    label: string,
  ) => void;
  onUnitPointerMove?: (e: React.PointerEvent) => void;
  onUnitPointerUp?: (e: React.PointerEvent) => void;
  onUnitPointerCancel?: (e: React.PointerEvent) => void;
};

function stars(n: number): string {
  const capped = Math.min(Math.max(1, n), 12);
  return "★".repeat(capped) + (n > 12 ? `+${n - 12}` : "");
}

export function Bench({
  onUnitPointerDown,
  onUnitPointerMove,
  onUnitPointerUp,
  onUnitPointerCancel,
}: BenchProps) {
  const state = useGameState();
  const capacity = state.metaApplied.benchCapacity;
  const emptySlots = Math.max(0, capacity - state.bench.length);
  const canAct =
    (state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP") &&
    !state.eventChoice;

  return (
    <section className="bench panel">
      <div className="panel-header">
        <h2>Bench</h2>
        <span className="muted">
          {state.bench.length}/{capacity}
          {state.selectedInstanceId ? " · selected" : ""}
        </span>
      </div>
      <ul className="bench-slots">
        {state.bench.map((unit) => {
          const def = getUnitDef(unit.defId);
          const fill = def ? eraColor(def.era) : eraColor(1);
          const stats = effectiveStats(unit, state.metaApplied);
          const selected = state.selectedInstanceId === unit.instanceId;
          const label = `${def?.name ?? unit.defId} ${stars(unit.starLevel)}`;
          return (
            <li
              key={unit.instanceId}
              className={`bench-slot filled${selected ? " selected" : ""}`}
              data-unit-id={unit.instanceId}
            >
              <button
                type="button"
                className="bench-select"
                data-unit-id={unit.instanceId}
                style={{ touchAction: "none" }}
                onPointerDown={(e) =>
                  canAct && onUnitPointerDown
                    ? onUnitPointerDown(e, unit.instanceId, label)
                    : gameStore.selectUnit(
                        selected ? null : unit.instanceId,
                      )
                }
                onPointerMove={onUnitPointerMove}
                onPointerUp={onUnitPointerUp}
                onPointerCancel={onUnitPointerCancel}
              >
                <div
                  className="unit-swatch"
                  style={{ background: fill }}
                />
                <div>
                  <div className="offer-name">{label}</div>
                  <div className="offer-meta">
                    {stats
                      ? `dmg ${stats.damage.toFixed(0)} · rng ${stats.range.toFixed(1)}`
                      : unit.targeting}
                    {unit.chipInstanceIds.length
                      ? ` · chips ${unit.chipInstanceIds.length}`
                      : ""}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li key={`empty-${i}`} className="bench-slot empty">
            Empty
          </li>
        ))}
      </ul>
    </section>
  );
}
