import { describe, expect, it } from "vitest";
import {
  ACTIVE_RUN_STORAGE_KEY,
  META_STORAGE_KEY,
  clearActiveRun,
  loadActiveRun,
  loadMeta,
  saveActiveRun,
  saveMeta,
} from "../src/meta/persistence";
import { createInitialRunState } from "../src/core/store";
import { isStandaloneDisplay } from "../src/pwa/standalone";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe("PWA / Safari standalone persistence contract", () => {
  it("uses stable keys atd.meta.v1 and atd.run.v1", () => {
    expect(META_STORAGE_KEY).toBe("atd.meta.v1");
    expect(ACTIVE_RUN_STORAGE_KEY).toBe("atd.run.v1");
  });

  it("survives a simulated Home Screen relaunch (same Storage)", () => {
    // iOS standalone and Safari both expose localStorage; we model a relaunch
    // as a fresh loadMeta/loadActiveRun against the same keyspace.
    const storage = new MemoryStorage();
    saveMeta(
      {
        version: 1,
        commanderXp: 90,
        unlockedSkills: ["deep_pockets"],
        codexUnlocked: ["unit_slinger"],
      },
      storage,
    );
    const run = createInitialRunState(7, ["deep_pockets"]);
    run.wavesCleared = 2;
    run.gold = 42;
    saveActiveRun(run, 9, storage);

    // "Relaunch"
    const meta = loadMeta(storage);
    const active = loadActiveRun(storage);
    expect(meta.commanderXp).toBe(90);
    expect(meta.unlockedSkills).toContain("deep_pockets");
    expect(active?.run.gold).toBe(42);
    expect(active?.run.wavesCleared).toBe(2);
    expect(active?.nextInstanceSeq).toBe(9);

    clearActiveRun(storage);
    expect(loadActiveRun(storage)).toBeNull();
    expect(loadMeta(storage).commanderXp).toBe(90);
  });

  it("isStandaloneDisplay is false under Vitest (no display-mode)", () => {
    expect(isStandaloneDisplay()).toBe(false);
  });
});
