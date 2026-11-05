import { eraColor } from "../canvas/theme";
import { ERA_CONFIGS } from "../content/eras";
import { buildCodexEntries, codexByEra } from "../meta/codex";
import { useMeta } from "../ui/useMeta";

export type CodexScreenProps = {
  onBack: () => void;
};

export function CodexScreen({ onBack }: CodexScreenProps) {
  const meta = useMeta();
  const entries = buildCodexEntries(meta.codexUnlocked);
  const byEra = codexByEra(entries);
  const unlockedCount = entries.filter((e) => e.unlocked).length;

  return (
    <div className="sheet-screen codex-screen">
      <header className="sheet-header">
        <button type="button" className="btn ghost sheet-back" onClick={onBack}>
          ← Menu
        </button>
        <div>
          <h1>Unit Codex</h1>
          <p className="muted">
            {unlockedCount}/{entries.length} revealed · silhouettes until encountered
          </p>
        </div>
      </header>

      <div className="codex-eras">
        {ERA_CONFIGS.map((era) => {
          const list = byEra.get(era.era) ?? [];
          return (
            <section key={era.era} className="codex-era">
              <h2>
                Era {era.era} · {era.name}
              </h2>
              <ul className="codex-grid">
                {list.map(({ def, unlocked }) => (
                  <li
                    key={def.id}
                    className={`codex-tile${unlocked ? "" : " locked"}`}
                    title={unlocked ? def.name : "Undiscovered"}
                  >
                    <div
                      className="codex-swatch"
                      style={
                        unlocked
                          ? {
                              background: eraColor(def.era),
                            }
                          : undefined
                      }
                    />
                    <div className="codex-tile-body">
                      <span className="codex-name">
                        {unlocked ? def.name : "??????"}
                      </span>
                      <span className="codex-meta muted">
                        {unlocked
                          ? `${def.cost}g · ${def.tags[0] ?? "Unit"}`
                          : "Silhouette"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
