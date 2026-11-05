import { eraColor } from "../canvas/theme";
import { getUnitDef } from "../content/units";
import { effectiveStats } from "../core/stats";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

function stars(n: number): string {
  const capped = Math.min(Math.max(1, n), 12);
  return "★".repeat(capped) + (n > 12 ? `+${n - 12}` : "");
}

export function Bench() {
  const state = useGameState();
  const capacity = state.metaApplied.benchCapacity;
  const emptySlots = Math.max(0, capacity - state.bench.length);
  const canAct = state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";

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
          return (
            <li
              key={unit.instanceId}
              className={`bench-slot filled${selected ? " selected" : ""}`}
            >
              <button
                type="button"
                className="bench-select"
                onClick={() =>
                  gameStore.selectUnit(selected ? null : unit.instanceId)
                }
              >
                <div
                  className="unit-swatch"
                  style={{ background: fill }}
                />
                <div>
                  <div className="offer-name">
                    {def?.name ?? unit.defId} {stars(unit.starLevel)}
                  </div>
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
              <button
                type="button"
                className="btn ghost"
                disabled={!canAct}
                onClick={() => gameStore.sellUnit(unit.instanceId)}
              >
                Sell
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
      <p className="stub-note">
        Select a bench unit, then click a placeable board tile. Board units: select →
        Bench / Sell.
      </p>
    </section>
  );
}
