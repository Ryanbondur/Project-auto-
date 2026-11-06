import { useCallback, useState } from "react";
import { gameStore } from "../core/store";
import type { DoctrineId } from "../core/types";
import { DoctrinePickSheet } from "../ui/DoctrinePickSheet";
import { CodexScreen } from "./CodexScreen";
import { MenuScreen } from "./MenuScreen";
import { RunScreen } from "./RunScreen";
import { SkillTreeScreen } from "./SkillTreeScreen";

export type AppScreen = "menu" | "skills" | "codex" | "run";

export function App() {
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [pickingDoctrine, setPickingDoctrine] = useState(false);

  const goMenu = useCallback(() => setScreen("menu"), []);

  const requestNewRun = useCallback(() => {
    setPickingDoctrine(true);
  }, []);

  const confirmDoctrine = useCallback((id: DoctrineId) => {
    setPickingDoctrine(false);
    gameStore.startNewRun(undefined, id);
    setScreen("run");
  }, []);

  const cancelDoctrine = useCallback(() => {
    setPickingDoctrine(false);
  }, []);

  const continueRun = useCallback(() => {
    const result = gameStore.resumePausedRun();
    if (result.ok) setScreen("run");
  }, []);

  const pauseToMenu = useCallback(() => {
    gameStore.pauseActiveRun();
    setScreen("menu");
  }, []);

  const leaveDefeat = useCallback(() => {
    gameStore.acknowledgeDefeat();
    setScreen("menu");
  }, []);

  return (
    <div className="app">
      {screen === "menu" && (
        <MenuScreen
          onContinue={continueRun}
          onNewRun={requestNewRun}
          onSkills={() => setScreen("skills")}
          onCodex={() => setScreen("codex")}
        />
      )}
      {screen === "skills" && <SkillTreeScreen onBack={goMenu} />}
      {screen === "codex" && <CodexScreen onBack={goMenu} />}
      {screen === "run" && (
        <RunScreen onPause={pauseToMenu} onLeaveDefeat={leaveDefeat} />
      )}
      {pickingDoctrine && (
        <DoctrinePickSheet onPick={confirmDoctrine} onCancel={cancelDoctrine} />
      )}
    </div>
  );
}
