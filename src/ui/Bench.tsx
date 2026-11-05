import { getUnitDef, ERA_HUE } from "../content/units";
import { useGameState } from "./useGameState";

function stars(n: number): string {
  return "★".repeat(n);
}

export function Bench() {
  const state = useGameState();
  const capacity = state.metaApplied.benchCapacity;
  const emptySlots = Math.max(0, capacity - state.bench.length);

  return (
    <section className="bench panel">
      <div className="panel-header">
        <h2>Bench</h2>
        <span className="muted">
          {state.bench.length}/{capacity}
        </span>
      </div>
      <ul className="bench-slots">
        {state.bench.map((unit) => {
          const def = getUnitDef(unit.defId);
          const hue = def ? ERA_HUE[def.era] : 0;
          return (
            <li key={unit.instanceId} className="bench-slot filled">
              <div
                className="unit-swatch"
                style={{ background: `hsl(${hue} 55% 42%)` }}
              />
              <div>
                <div className="offer-name">
                  {def?.name ?? unit.defId} {stars(unit.starLevel)}
                </div>
                <div className="offer-meta">{unit.targeting}</div>
              </div>
            </li>
          );
        })}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li key={`empty-${i}`} className="bench-slot empty">
            Empty
          </li>
        ))}
      </ul>
      <p className="stub-note">Drag / place / merge stubbed until Phase 2.</p>
    </section>
  );
}
