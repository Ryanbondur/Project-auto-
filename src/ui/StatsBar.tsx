import { doctrineShortLabel } from "../content/doctrines";
import { getDraftCounterDef } from "../content/draftCounters";
import { getEraBossDef } from "../content/eraBosses";
import { effectiveBoardSlots } from "../core/events";
import { gameStore } from "../core/store";
import { useGameState } from "./useGameState";

export type StatsBarProps = {
  onPause?: () => void;
};

export function StatsBar({ onPause }: StatsBarProps) {
  const state = useGameState();
  const era =
    state.metaApplied.eraThresholds.find((e) => e.era === state.currentEra) ??
    state.metaApplied.eraThresholds[0]!;
  const slots = effectiveBoardSlots(era.maxBoardSlots, state.modifiers);
  const shortEra = era.name.split("/")[0]?.trim() ?? era.name;
  const doctrineChip = state.doctrineId
    ? doctrineShortLabel(state.doctrineId)
    : null;
  const counterChip = state.activeDraftCounter
    ? getDraftCounterDef(state.activeDraftCounter)?.name
    : null;
  const bossChip = state.pendingEraBoss
    ? getEraBossDef(state.pendingEraBoss)?.name
    : null;

  return (
    <header className="stats-bar">
      <div className="stat stat-gold">
        <span className="stat-label">Gold</span>
        <span className="stat-value">{state.gold}</span>
      </div>
      <div className="stat stat-hp">
        <span className="stat-label">HP</span>
        <span className="stat-value">{state.baseHp}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Wave</span>
        <span className="stat-value">{state.waveNumber}</span>
      </div>
      <div className="stat stat-era">
        <span className="stat-label">Era</span>
        <span className="stat-value">
          {state.currentEra} · {shortEra}
        </span>
      </div>
      {doctrineChip && (
        <div className="stat doctrine-chip" title="Commander Doctrine">
          <span className="stat-label">Doctrine</span>
          <span className="stat-value">{doctrineChip}</span>
        </div>
      )}
      {counterChip && (
        <div className="stat draft-chip" title="Draft counter">
          <span className="stat-label">Counter</span>
          <span className="stat-value">{counterChip}</span>
        </div>
      )}
      {bossChip && (
        <div className="stat boss-chip" title="Era boss">
          <span className="stat-label">Boss</span>
          <span className="stat-value">{bossChip}</span>
        </div>
      )}
      <div className="stat">
        <span className="stat-label">Board</span>
        <span className="stat-value">
          {state.board.length}/{slots}
        </span>
      </div>
      <div className="stat stat-phase">
        <span className="stat-label">Phase</span>
        <span className="stat-value phase">{state.phase}</span>
      </div>
      {state.lastPayout && (
        <div className="stat stat-optional">
          <span className="stat-label">Payout</span>
          <span className="stat-value">
            +{state.lastPayout.interest}/{state.lastPayout.income}
          </span>
        </div>
      )}
      <div className="stat-actions">
        {onPause && (
          <button
            type="button"
            className="btn ghost"
            onClick={onPause}
            title="Pause run"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          className="btn ghost"
          onClick={() => gameStore.debugSetGold(state.gold + 5)}
          title="Debug"
        >
          +5g
        </button>
      </div>
    </header>
  );
}
