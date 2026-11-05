import { getEraConfig } from "../content/eras";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export function StatsBar() {
  const state = useGameState();
  const era = getEraConfig(state.currentEra);
  const slots = era.maxBoardSlots;

  return (
    <header className="stats-bar">
      <div className="stat">
        <span className="stat-label">Gold</span>
        <span className="stat-value">{state.gold}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Base HP</span>
        <span className="stat-value">{state.baseHp}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Wave</span>
        <span className="stat-value">{state.waveNumber}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Era</span>
        <span className="stat-value">
          {state.currentEra} · {era.name}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Board</span>
        <span className="stat-value">
          {state.board.length}/{slots}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Phase</span>
        <span className="stat-value phase">{state.phase}</span>
      </div>
      {state.lastTileClick && (
        <div className="stat tile-debug">
          <span className="stat-label">Tile</span>
          <span className="stat-value">
            ({state.lastTileClick.x},{state.lastTileClick.y}){" "}
            {state.lastTileClick.placeable ? "placeable" : "blocked"}
          </span>
        </div>
      )}
      <div className="stat-actions">
        <button
          type="button"
          className="btn ghost"
          onClick={() => gameStore.debugSetGold(state.gold + 5)}
          title="Phase 1 debug"
        >
          +5 gold
        </button>
        <button type="button" className="btn ghost" onClick={() => gameStore.resetRun()}>
          Reset
        </button>
      </div>
    </header>
  );
}
