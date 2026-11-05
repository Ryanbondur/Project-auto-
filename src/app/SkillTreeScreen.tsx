import { SKILL_DEFS } from "../content/skills";
import { availableXp, canUnlockSkill } from "../meta/commander";
import { metaStore } from "../meta/metaStore";
import { useMeta } from "../ui/useMeta";

export type SkillTreeScreenProps = {
  onBack: () => void;
};

export function SkillTreeScreen({ onBack }: SkillTreeScreenProps) {
  const meta = useMeta();
  const unspent = availableXp(meta);

  return (
    <div className="sheet-screen skill-tree-screen">
      <header className="sheet-header">
        <button type="button" className="btn ghost sheet-back" onClick={onBack}>
          ← Menu
        </button>
        <div>
          <h1>Skill tree</h1>
          <p className="muted">
            Unspent XP: <strong>{unspent}</strong> · Total {meta.commanderXp}
          </p>
        </div>
      </header>

      <ul className="skill-list">
        {SKILL_DEFS.map((skill) => {
          const owned = meta.unlockedSkills.includes(skill.id);
          const check = canUnlockSkill(meta, skill.id);
          const canBuy = check.ok;
          return (
            <li key={skill.id} className={`skill-card${owned ? " owned" : ""}`}>
              <div className="skill-card-body">
                <div className="skill-card-top">
                  <h2>{skill.name}</h2>
                  <span className="skill-cost">
                    {owned ? "Owned" : `${skill.xpCost} XP`}
                  </span>
                </div>
                <p className="skill-desc">{skill.description}</p>
                <p className="skill-effect muted">{skill.effectSummary}</p>
              </div>
              {!owned && (
                <button
                  type="button"
                  className="btn primary skill-unlock"
                  disabled={!canBuy}
                  onClick={() => metaStore.tryUnlockSkill(skill.id)}
                >
                  Unlock
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
