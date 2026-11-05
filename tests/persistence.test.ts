import { describe, expect, it } from "vitest";
import {
  clearActiveRun,
  freshMeta,
  loadActiveRun,
  loadMeta,
  saveActiveRun,
  saveMeta,
  META_STORAGE_KEY,
  ACTIVE_RUN_STORAGE_KEY,
} from "../src/meta/persistence";
import { createInitialRunState } from "../src/core/store";
import {
  availableXp,
  awardRunXp,
  buildMetaApplied,
  canUnlockSkill,
  unlockCodexEntries,
  unlockSkill,
  xpForWavesCleared,
} from "../src/meta/commander";
import { createMetaStore } from "../src/meta/metaStore";

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

describe("PersistedMetaV1", () => {
  it("round-trips through localStorage shape", () => {
    const storage = new MemoryStorage();
    const meta = {
      version: 1 as const,
      commanderXp: 450,
      unlockedSkills: ["deep_pockets" as const, "veterancy" as const],
      codexUnlocked: ["unit_slinger", "unit_spearman"],
    };
    saveMeta(meta, storage);
    expect(storage.getItem(META_STORAGE_KEY)).toBeTruthy();
    expect(loadMeta(storage)).toEqual(meta);
  });

  it("returns fresh meta on missing or corrupt data", () => {
    const storage = new MemoryStorage();
    expect(loadMeta(storage)).toEqual(freshMeta());
    storage.setItem(META_STORAGE_KEY, "{not-json");
    expect(loadMeta(storage)).toEqual(freshMeta());
    storage.setItem(META_STORAGE_KEY, JSON.stringify({ version: 2 }));
    expect(loadMeta(storage)).toEqual(freshMeta());
  });
});

describe("Commander XP + skills", () => {
  it("awards wavesCleared × 15", () => {
    expect(xpForWavesCleared(7)).toBe(105);
    expect(xpForWavesCleared(0)).toBe(0);
    const { meta, xpGained } = awardRunXp(freshMeta(), 4);
    expect(xpGained).toBe(60);
    expect(meta.commanderXp).toBe(60);
  });

  it("unlocks skills when unspent XP covers cost", () => {
    let meta = { ...freshMeta(), commanderXp: 150 };
    expect(canUnlockSkill(meta, "deep_pockets").ok).toBe(true);
    const unlocked = unlockSkill(meta, "deep_pockets");
    expect(unlocked.ok).toBe(true);
    if (!unlocked.ok) return;
    meta = unlocked.meta;
    expect(meta.unlockedSkills).toContain("deep_pockets");
    expect(availableXp(meta)).toBe(50);
    expect(canUnlockSkill(meta, "interest_rate_cap").ok).toBe(false);
  });

  it("applies all six skill mods to a new run config", () => {
    const mods = buildMetaApplied([
      "deep_pockets",
      "interest_rate_cap",
      "master_mason",
      "quick_assembly",
      "veterancy",
      "reinforcements",
    ]);
    expect(mods.startingGold).toBe(15);
    expect(mods.interestCap).toBe(8);
    expect(mods.rangeMult).toBe(1.15);
    expect(mods.mergedAsBonus).toBe(0.1);
    expect(mods.benchCapacity).toBe(6);
    // Veterancy: era 1 ends at wave 9
    expect(mods.eraThresholds[0]?.waveRange).toEqual([1, 9]);
  });

  it("merges codex unlocks without duplicates", () => {
    const a = unlockCodexEntries(freshMeta(), ["unit_slinger", "unit_slinger"]);
    expect(a.changed).toBe(true);
    expect(a.meta.codexUnlocked).toEqual(["unit_slinger"]);
    const b = unlockCodexEntries(a.meta, ["unit_slinger"]);
    expect(b.changed).toBe(false);
  });
});

describe("Active run pause slot", () => {
  it("saves and loads a single active run", () => {
    const storage = new MemoryStorage();
    const run = createInitialRunState(99, []);
    saveActiveRun(run, 12, storage);
    expect(storage.getItem(ACTIVE_RUN_STORAGE_KEY)).toBeTruthy();
    const loaded = loadActiveRun(storage);
    expect(loaded?.nextInstanceSeq).toBe(12);
    expect(loaded?.run.waveNumber).toBe(1);
    expect(loaded?.run.gold).toBe(10);
    clearActiveRun(storage);
    expect(loadActiveRun(storage)).toBeNull();
  });

  it("metaStore pause / endRun clears the slot and awards XP", () => {
    const storage = new MemoryStorage();
    const store = createMetaStore(storage);
    const run = createInitialRunState(1, ["deep_pockets"]);
    run.wavesCleared = 3;
    store.pauseRun(run, 5);
    expect(store.hasPausedRun()).toBe(true);
    const ended = store.endRun(3);
    expect(ended.xpGained).toBe(45);
    expect(store.hasPausedRun()).toBe(false);
    expect(store.getMeta().commanderXp).toBe(45);
  });
});
