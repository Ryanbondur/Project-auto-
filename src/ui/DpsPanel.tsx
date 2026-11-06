import { useState } from "react";
import {
  formatDamageShort,
  rankDamageDealt,
  type DamageScope,
} from "../core/damageStats";
import { useGameState } from "./useGameState";

/**
 * Collapsed-by-default DPS chip → slim floating panel.
 * Wave damage by default; tap scope chip to flip wave/run.
 */
export function DpsPanel() {
  const state = useGameState();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<DamageScope>("wave");
  const ranks = rankDamageDealt(state.board, scope);
  const top = ranks[0];
  const maxDmg = Math.max(1, top?.damage ?? 0);

  return (
    <div className={`dps-panel${open ? " open" : ""}`}>
      <button
        type="button"
        className="dps-chip"
        aria-expanded={open}
        aria-controls="dps-sheet"
        onClick={() => setOpen((v) => !v)}
        title="Damage dealt ranking"
      >
        DPS
        {top && top.damage > 0 ? (
          <span className="dps-chip-peek">{formatDamageShort(top.damage)}</span>
        ) : null}
      </button>

      {open && (
        <div
          id="dps-sheet"
          className="dps-sheet"
          role="dialog"
          aria-label="Damage dealt"
        >
          <header className="dps-sheet-head">
            <span className="dps-title">Damage</span>
            <button
              type="button"
              className="dps-scope"
              onClick={() => setScope((s) => (s === "wave" ? "run" : "wave"))}
              title="Toggle wave / run totals"
            >
              {scope === "wave" ? "Wave" : "Run"}
            </button>
            <button
              type="button"
              className="dps-close"
              aria-label="Close DPS"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>
          {ranks.length === 0 ? (
            <p className="dps-empty">No boarded units</p>
          ) : (
            <ol className="dps-list">
              {ranks.map((row) => (
                <li key={row.instanceId} className="dps-row">
                  <div className="dps-row-meta">
                    <span className="dps-name">
                      {row.name}
                      <span className="dps-stars">
                        {"★".repeat(Math.min(row.starLevel, 5))}
                        {row.starLevel > 5 ? `+${row.starLevel - 5}` : ""}
                      </span>
                    </span>
                    <span className="dps-num">
                      {formatDamageShort(row.damage)}
                    </span>
                  </div>
                  <div className="dps-bar-track" aria-hidden>
                    <div
                      className="dps-bar-fill"
                      style={{
                        width: `${Math.round((row.damage / maxDmg) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
