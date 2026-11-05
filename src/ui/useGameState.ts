import { useSyncExternalStore } from "react";
import { gameStore } from "../core/store";
import type { RunState } from "../core/types";

export function useGameState(): RunState {
  return useSyncExternalStore(gameStore.subscribe, gameStore.getState, gameStore.getState);
}
