import { buildUnitInspectData } from "../core/unitInspect";
import { useGameState } from "./useGameState";

export type UnitInspectCardProps = {
  instanceId: string;
  onClose: () => void;
  /** Hover preview — lighter dismiss, no heavy overlay. */
  ephemeral?: boolean;
};

/** Minimal glass/neon inspect sheet for a boarded unit. */
export function UnitInspectCard({
  instanceId,
  onClose,
  ephemeral = false,
}: UnitInspectCardProps) {
  const state = useGameState();
  const unit =
    state.board.find((u) => u.instanceId === instanceId) ??
    state.bench.find((u) => u.instanceId === instanceId);
  if (!unit) return null;
  const data = buildUnitInspectData(unit, state);
  if (!data) return null;

  const stars =
    "★".repeat(Math.min(data.starLevel, 5)) +
    (data.starLevel > 5 ? ` ${data.starLevel}★` : "");

  return (
    <div
      className={`inspect-overlay${ephemeral ? " ephemeral" : ""}`}
      role="dialog"
      aria-modal={!ephemeral}
      aria-label={`${data.name} stats`}
      onClick={onClose}
    >
      <div
        className="inspect-card"
        onClick={(e) => e.stopPropagation()}
        onPointerLeave={ephemeral ? onClose : undefined}
      >
        <header className="inspect-head">
          <div>
            <h2 className="inspect-name">{data.name}</h2>
            <p className="inspect-sub">
              Era {data.era} · {data.eraName} · {stars || "★"} ·{" "}
              {data.targeting}
            </p>
          </div>
          <button
            type="button"
            className="inspect-close"
            aria-label="Close inspect"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <dl className="inspect-stats">
          <div>
            <dt>Dmg</dt>
            <dd>{data.stats.damage}</dd>
          </div>
          <div>
            <dt>AS</dt>
            <dd>{data.stats.attackSpeed}</dd>
          </div>
          <div>
            <dt>Range</dt>
            <dd>{data.stats.range}</dd>
          </div>
          <div>
            <dt>AoE</dt>
            <dd>{data.stats.aoeRadius}</dd>
          </div>
        </dl>

        {data.buffs.length > 0 && (
          <ul className="inspect-buffs">
            {data.buffs.map((b) => (
              <li key={b.instanceId} className="inspect-buff-chip">
                {b.name} {"★".repeat(Math.min(b.starLevel, 4))}
              </li>
            ))}
          </ul>
        )}

        {data.modifiers.length > 0 && (
          <p className="inspect-mods">{data.modifiers.join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
