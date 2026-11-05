import { useSyncExternalStore } from "react";
import { metaStore } from "../meta/metaStore";
import type { PersistedMetaV1 } from "../meta/persistence";

export function useMeta(): PersistedMetaV1 {
  return useSyncExternalStore(
    metaStore.subscribe,
    metaStore.getMeta,
    metaStore.getMeta,
  );
}

export function useHasPausedRun(): boolean {
  return useSyncExternalStore(
    metaStore.subscribe,
    metaStore.hasPausedRun,
    () => false,
  );
}
