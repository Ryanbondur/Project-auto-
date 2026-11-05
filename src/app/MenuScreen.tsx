import { availableXp } from "../meta/commander";
import { useHasPausedRun, useMeta } from "../ui/useMeta";

export type MenuScreenProps = {
  onContinue: () => void;
  onNewRun: () => void;
  onSkills: () => void;
  onCodex: () => void;
};

export function MenuScreen({
  onContinue,
  onNewRun,
  onSkills,
  onCodex,
}: MenuScreenProps) {
  const meta = useMeta();
  const hasPaused = useHasPausedRun();
  const unspent = availableXp(meta);

  return (
    <div className="menu-screen">
      <header className="menu-hero">
        <p className="menu-kicker">Autobattler TD</p>
        <h1 className="menu-title">Commander</h1>
        <p className="menu-sub">
          Endless waves. Pairwise merges. Climb eras until the base falls.
        </p>
      </header>

      <section className="menu-meta" aria-label="Commander progress">
        <div className="menu-stat">
          <span className="stat-label">XP</span>
          <span className="stat-value">{meta.commanderXp}</span>
        </div>
        <div className="menu-stat">
          <span className="stat-label">Unspent</span>
          <span className="stat-value">{unspent}</span>
        </div>
        <div className="menu-stat">
          <span className="stat-label">Skills</span>
          <span className="stat-value">{meta.unlockedSkills.length}/6</span>
        </div>
        <div className="menu-stat">
          <span className="stat-label">Codex</span>
          <span className="stat-value">{meta.codexUnlocked.length}</span>
        </div>
      </section>

      <nav className="menu-actions" aria-label="Main menu">
        {hasPaused && (
          <button type="button" className="btn primary menu-btn" onClick={onContinue}>
            Continue run
          </button>
        )}
        <button type="button" className="btn primary menu-btn" onClick={onNewRun}>
          {hasPaused ? "New run (replaces paused)" : "New run"}
        </button>
        <button type="button" className="btn menu-btn" onClick={onSkills}>
          Skill tree
        </button>
        <button type="button" className="btn menu-btn" onClick={onCodex}>
          Unit Codex
        </button>
      </nav>

      <p className="menu-foot muted">
        One active run at a time · Pause anytime · Meta saves locally
      </p>
    </div>
  );
}
