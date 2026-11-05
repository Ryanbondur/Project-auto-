import { HEAL_PULSE_INTERVAL_MS } from "./buffEffects";
import { REROLL_COST, SHOP_SIZE, STARTING_BASE_HP } from "./constants";
import { getEraConfig } from "../content/eras";
import { MAP, isPathTile, isPlaceableTile } from "../content/map";
import { UNIT_DEFS, getUnitDef } from "../content/units";
import { BUFF_CHIP_DEFS, getBuffChipDef } from "../content/buffChips";
import { getCreepDef } from "../content/creeps";
import { getPathSabotageDef } from "../content/pathSabotage";
import { applyWavePayout, sellValue } from "./economy";
import {
  rollDiscoveryChoices,
  shouldAdvanceEra,
} from "./era";
import {
  BOSS_ARENA_LOOT_GOLD,
  applyBossArenaFail,
  applyRunEvent,
  consumeInterestBonus,
  consumeNextWaveHpMult,
  consumeShopOfferBonus,
  createEmptyModifiers,
  effectiveBoardSlots,
  rollEventChoices,
  shouldOfferRunEventAfterEra,
  shouldOfferRunEventAtWaveBand,
  tickPathSlowAfterWave,
} from "./events";
import { createRng } from "./rng";
import {
  clearPrepGambitOnReady,
  createGambitState,
  interestMultiplier,
  tryActivateGambit,
} from "./gambit";
import {
  autoMergeChipsPairwise,
  autoMergePairwise,
  mergeSpecificPair,
} from "./merge";
import { tryMoveToBench, tryPlaceOnBoard } from "./placement";
import { createShopState } from "./shop";
import { tickCombat } from "./combat";
import { planWaveRuntime, spawnDueCreeps } from "./waves";
import { nextTargetingMode } from "./targeting";
import { buildMetaApplied } from "../meta/commander";
import { metaStore, type MetaStore } from "../meta/metaStore";
import type {
  BuffChipInstance,
  GambitId,
  PathSabotageInstance,
  RunState,
  SkillId,
  UnitInstance,
} from "./types";

type Listener = () => void;

let nextInstanceSeq = 1;
/** Injectable for tests — production uses the singleton `metaStore`. */
let metaApi: MetaStore = metaStore;

/** Rebind meta persistence (tests). Pass nothing / metaStore to restore. */
export function bindMetaStore(store: MetaStore = metaStore): void {
  metaApi = store;
}

export function createInstanceId(prefix = "u"): string {
  const id = `${prefix}_${nextInstanceSeq}`;
  nextInstanceSeq += 1;
  return id;
}

export function getNextInstanceSeq(): number {
  return nextInstanceSeq;
}

export function setNextInstanceSeq(seq: number): void {
  nextInstanceSeq = Math.max(1, Math.floor(seq));
}

function revealShopUnits(offers: { kind: string; defId: string }[]): void {
  const ids = offers.filter((o) => o.kind === "unit").map((o) => o.defId);
  if (ids.length) metaApi.revealCodex(ids);
}

function makeUnit(defId: string, starLevel = 1, tile: UnitInstance["tile"] = null): UnitInstance {
  return {
    instanceId: createInstanceId(),
    defId,
    starLevel,
    targeting: "First",
    tile,
    cooldownMs: 0,
    currentTargetId: null,
    chipInstanceIds: [],
    fromMerge: false,
  };
}

function rebindTransferredChips(state: RunState): void {
  // After unit merges, chipInstanceIds moved onto the new unit — rebind socket owner.
  const ownerByChip = new Map<string, string>();
  for (const u of [...state.board, ...state.bench]) {
    for (const chipId of u.chipInstanceIds) {
      ownerByChip.set(chipId, u.instanceId);
    }
  }
  for (const chip of state.chips) {
    const owner = ownerByChip.get(chip.instanceId);
    if (owner) {
      chip.socketedOnInstanceId = owner;
    }
  }
}

function applyMerges(state: RunState): void {
  // Auto-merge is a player toggle (default ON). Drag-to-combine always works.
  if (!state.autoMergeEnabled) return;
  const unitMerge = autoMergePairwise(state.board, state.bench, () =>
    createInstanceId("m"),
  );
  state.board = unitMerge.board;
  state.bench = unitMerge.bench;
  rebindTransferredChips(state);

  const chipMerge = autoMergeChipsPairwise(state.chips, () => createInstanceId("c"));
  state.chips = chipMerge.chips;
  state.chipInventory = state.chips.filter((c) => c.socketedOnInstanceId === null);
}

export function createInitialRunState(
  seed = 42,
  skills: SkillId[] = [],
  options?: { skipCodexReveal?: boolean },
): RunState {
  const mods = buildMetaApplied(skills);
  const era = mods.eraThresholds.find((e) => e.era === 1) ?? getEraConfig(1);
  const { shop, nextSeed } = createShopState(era, seed);
  const state: RunState = {
    phase: "SHOP_PREP",
    waveNumber: 1,
    wavesCleared: 0,
    gold: mods.startingGold,
    baseHp: STARTING_BASE_HP,
    currentEra: 1,
    board: [],
    bench: [],
    shop,
    chipInventory: [],
    chips: [],
    pathSabotages: [],
    gambit: createGambitState(),
    creeps: [],
    projectiles: [],
    waveRuntime: null,
    discovery: null,
    eventChoice: null,
    arena: null,
    modifiers: createEmptyModifiers(),
    autoMergeEnabled: true,
    rngSeed: nextSeed,
    selectedInstanceId: null,
    selectedSabotageId: null,
    metaApplied: {
      interestCap: mods.interestCap,
      rangeMult: mods.rangeMult,
      mergedAsBonus: mods.mergedAsBonus,
      benchCapacity: mods.benchCapacity,
      eraThresholds: mods.eraThresholds,
    },
    lastTileClick: null,
    lastPayout: null,
    healPulseCooldownMs: HEAL_PULSE_INTERVAL_MS,
  };
  if (!options?.skipCodexReveal) {
    revealShopUnits(shop.offers);
  }
  return state;
}

function cloneRunState(state: RunState): RunState {
  return structuredClone(state);
}

function findUnit(state: RunState, instanceId: string): UnitInstance | undefined {
  return (
    state.bench.find((u) => u.instanceId === instanceId) ??
    state.board.find((u) => u.instanceId === instanceId)
  );
}

function assertPrep(state: RunState): boolean {
  return state.phase === "SHOP_PREP" || state.phase === "MERGE_SETUP";
}

/**
 * Apply income/interest, bump wave counters, clear combat.
 * Does NOT set phase — caller routes to ERA_FREEZE or SHOP_PREP.
 */
function completeWavePayout(next: RunState): void {
  const mult = interestMultiplier(next.gambit);
  const payout = applyWavePayout(next.gold, next.metaApplied.interestCap);
  const bonus = consumeInterestBonus(next.modifiers);
  const interest = payout.interest * mult + bonus;
  next.gold = next.gold + interest + payout.income;
  next.lastPayout = { interest, income: payout.income };
  next.wavesCleared += 1;
  next.waveNumber += 1;
  if (next.gambit.activeGambit === "double_interest") {
    next.gambit.activeGambit = null;
  }
  tickPathSlowAfterWave(next.modifiers);
  next.creeps = [];
  next.projectiles = [];
  next.waveRuntime = null;
  // Reset combat cooldowns for next wave
  for (const u of next.board) {
    u.cooldownMs = 0;
    u.currentTargetId = null;
  }
}

function openEventChoice(next: RunState, reason: "era" | "band"): void {
  const rolled = rollEventChoices(next.rngSeed, next.gold);
  next.eventChoice = { choices: rolled.choices, reason };
  next.rngSeed = rolled.nextSeed;
}

/**
 * After payout: era threshold → ERA_FREEZE (discovery first).
 * Event Choice opens only after Era Discovery resolves (see pickDiscovery),
 * or on the late endless 10-wave band when already at era 5.
 * Never stacks Event + Era sheets the same frame.
 */
function afterWaveClear(next: RunState): void {
  completeWavePayout(next);
  if (
    shouldAdvanceEra(
      next.currentEra,
      next.waveNumber,
      next.metaApplied.eraThresholds,
    )
  ) {
    const newEra = (next.currentEra + 1) as 1 | 2 | 3 | 4 | 5;
    const rolled = rollDiscoveryChoices(newEra, next.rngSeed);
    next.discovery = { newEra, choices: rolled.choices };
    next.rngSeed = rolled.nextSeed;
    next.phase = "ERA_FREEZE";
    next.selectedInstanceId = null;
    next.selectedSabotageId = null;
    next.eventChoice = null;
    metaApi.revealCodex(rolled.choices.map((c) => c.defId));
    return;
  }
  next.discovery = null;
  next.phase = "SHOP_PREP";
  if (shouldOfferRunEventAtWaveBand(next.currentEra, next.wavesCleared)) {
    openEventChoice(next, "band");
    return;
  }
  refreshShopOn(next);
}

function grantBossArenaLoot(next: RunState): void {
  const rand = createRng(next.rngSeed);
  const roll = rand();
  next.rngSeed = (next.rngSeed + 1 + Math.floor(rand() * 1e9)) >>> 0;
  if (roll < 0.34) {
    next.gold += BOSS_ARENA_LOOT_GOLD;
    return;
  }
  if (roll < 0.67) {
    const unlocked = UNIT_DEFS.filter((u) => u.era <= next.currentEra);
    const pool = unlocked.length > 0 ? unlocked : UNIT_DEFS;
    const def = pool[Math.floor(rand() * pool.length)] ?? pool[0];
    if (def) {
      next.bench.push(makeUnit(def.id, 1, null));
      applyMerges(next);
      metaApi.revealCodex([def.id]);
    }
    return;
  }
  const chipDef =
    BUFF_CHIP_DEFS[Math.floor(rand() * BUFF_CHIP_DEFS.length)] ??
    BUFF_CHIP_DEFS[0]!;
  if (chipDef && getBuffChipDef(chipDef.id)) {
    const chip: BuffChipInstance = {
      instanceId: createInstanceId("c"),
      defId: chipDef.id,
      starLevel: 1,
      socketedOnInstanceId: null,
    };
    next.chips.push(chip);
    applyMerges(next);
  } else {
    next.gold += BOSS_ARENA_LOOT_GOLD;
  }
}

function startBossArena(next: RunState): void {
  next.phase = "EVENT_ARENA";
  next.arena = {
    kind: "boss",
    bossDefId: "creep_boss",
    displayWave: next.waveNumber,
  };
  next.creeps = [];
  next.projectiles = [];
  next.eventChoice = null;
  next.selectedInstanceId = null;
  next.selectedSabotageId = null;
  // Single tough boss — slightly beefier than catalog for arena stakes.
  const def = getCreepDef("creep_boss");
  const start = MAP.path[0] ?? { x: 0, y: 0 };
  const maxHp = Math.max(1, Math.round((def?.maxHp ?? 600) * 1.35));
  next.creeps.push({
    instanceId: createInstanceId("e"),
    defId: "creep_boss",
    hp: maxHp,
    maxHp,
    pathIndex: 0,
    pathT: 0,
    x: start.x,
    y: start.y,
    alive: true,
  });
  next.waveRuntime = {
    spawnQueue: [],
    elapsedMs: 0,
    allSpawned: true,
    eventHpMult: 1,
  };
  next.healPulseCooldownMs = HEAL_PULSE_INTERVAL_MS;
  for (const u of next.board) {
    u.cooldownMs = 0;
    u.currentTargetId = null;
  }
}

function refreshShopOn(next: RunState): void {
  const era =
    next.metaApplied.eraThresholds.find((e) => e.era === next.currentEra) ??
    getEraConfig(next.currentEra);
  const bonus = consumeShopOfferBonus(next.modifiers);
  const size = SHOP_SIZE + Math.max(0, bonus);
  const rolled = createShopState(era, next.rngSeed, size);
  next.shop = rolled.shop;
  next.rngSeed = rolled.nextSeed;
  revealShopUnits(next.shop.offers);
}

function boardSlotCap(state: RunState): number {
  const era =
    state.metaApplied.eraThresholds.find((e) => e.era === state.currentEra) ??
    getEraConfig(state.currentEra);
  return effectiveBoardSlots(era.maxBoardSlots, state.modifiers);
}

/** Mid-path anchor for event slow lane (path-legal; not start/end). */
function midPathIndex(): number {
  const len = MAP.path.length;
  if (len <= 2) return 0;
  return Math.floor(len / 2);
}

export type ActionResult = { ok: true } | { ok: false; reason: string };

export type DefeatSummary = {
  wavesCleared: number;
  xpGained: number;
};

export type GameStore = {
  getState: () => RunState;
  subscribe: (listener: Listener) => () => void;
  clickTile: (x: number, y: number) => void;
  selectUnit: (instanceId: string | null) => void;
  selectSabotage: (instanceId: string | null) => void;
  buyOffer: (slotIndex: number) => ActionResult;
  rerollShop: () => ActionResult;
  sellUnit: (instanceId: string) => ActionResult;
  moveToBench: (instanceId: string) => ActionResult;
  /**
   * Explicit drag-combine: drop source onto target when identical id+star.
   * Auto-merge still runs afterward as a safety net.
   */
  mergeOnto: (sourceId: string, targetId: string) => ActionResult;
  /** Resolve pending run-event choice (index into eventChoice.choices). */
  pickEvent: (choiceIndex: number) => ActionResult;
  /** Toggle auto pairwise merge (drag-combine always available). Default ON. */
  setAutoMergeEnabled: (enabled: boolean) => void;
  socketChip: (chipInstanceId: string, unitInstanceId: string) => ActionResult;
  activateGambit: (gambitId: GambitId) => ActionResult;
  cycleTargeting: (instanceId: string) => ActionResult;
  /** Debug: force an event choice sheet open. */
  debugForceEvent: () => ActionResult;
  /** Start autobattle for the current wave. */
  ready: () => ActionResult;
  /**
   * @deprecated Phase 2 prep-only alias — prefer `ready` (starts combat).
   * Kept so older tests calling readyStub still compile; routes to ready().
   */
  readyStub: () => ActionResult;
  /** Advance combat simulation by dtMs (driven by rAF). */
  tick: (dtMs: number) => void;
  /** Resolve Era Discovery: pick one free 2★ (choice index 0–2). */
  pickDiscovery: (choiceIndex: number) => ActionResult;
  /**
   * Start a new run with current owned skills. Replaces any paused run
   * (only one active run allowed — design-decisions).
   */
  startNewRun: (seed?: number) => void;
  /** Persist run to localStorage and leave combat paused (caller routes to menu). */
  pauseActiveRun: () => void;
  /** Resume the single paused run into this store. */
  resumePausedRun: () => ActionResult;
  /**
   * Finalize defeat: award XP = wavesCleared × 15, clear active run.
   * Call once when leaving the defeat screen.
   */
  acknowledgeDefeat: () => DefeatSummary;
  /** Last defeat XP summary (UI). */
  getLastDefeatSummary: () => DefeatSummary | null;
  debugSetGold: (gold: number) => void;
  /** Test helper: jump to a wave number (prep) without combat — for era tests. */
  debugSetWave: (waveNumber: number) => void;
  /** Test helper: force wave clear payout without simulating combat. */
  debugCompleteWave: () => ActionResult;
  /** Reset in-memory run without touching meta (tests / debug). */
  resetRun: (seed?: number, skills?: SkillId[]) => void;
  /**
   * Debug / screenshot helper: grant a boarded unit, socketed pierce chip,
   * inventory lifesteal chip, and placeable + placeable sabotage items.
   */
  debugSeedMechanicsDemo: () => ActionResult;
  /**
   * Debug / screenshot helper: several distinct era/role units on board
   * for neon skin visual captures (path + silhouettes + select).
   */
  debugSeedNeonSkinDemo: () => ActionResult;
};

export function createStore(initial?: RunState): GameStore {
  let state = initial ?? createInitialRunState();
  const listeners = new Set<Listener>();
  let lastHudEmitMs = 0;
  let lastDefeatSummary: DefeatSummary | null = null;
  let defeatAwarded = false;

  const emit = () => {
    for (const l of listeners) l();
  };

  const setState = (next: RunState) => {
    state = next;
    emit();
  };

  const enterDefeat = (from: RunState) => {
    const next = cloneRunState(from);
    next.phase = "RUN_DEFEAT";
    next.waveRuntime = null;
    next.projectiles = [];
      // Award XP immediately so refresh cannot lose the payout.
    if (!defeatAwarded) {
      const result = metaApi.endRun(next.wavesCleared);
      lastDefeatSummary = {
        wavesCleared: next.wavesCleared,
        xpGained: result.xpGained,
      };
      defeatAwarded = true;
    }
    setState(next);
  };

  /** Cheap new snapshot ref so React HUD can refresh without deep clone. */
  const emitHudSnapshot = () => {
    state = { ...state };
    emit();
  };

  const startWave = (): ActionResult => {
    if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
    if (state.eventChoice) return { ok: false, reason: "event_pending" };
    const next = cloneRunState(state);
    next.phase = "AUTOBATTLE";
    next.creeps = [];
    next.projectiles = [];
    const hpMult = consumeNextWaveHpMult(next.modifiers);
    next.waveRuntime = planWaveRuntime(next.waveNumber, hpMult);
    next.selectedInstanceId = null;
    next.selectedSabotageId = null;
    next.gambit = clearPrepGambitOnReady(next.gambit);
    next.healPulseCooldownMs = HEAL_PULSE_INTERVAL_MS;
    for (const u of next.board) {
      u.cooldownMs = 0;
      u.currentTargetId = null;
    }
    setState(next);
    return { ok: true };
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    selectUnit: (instanceId) => {
      const next = cloneRunState(state);
      next.selectedInstanceId = instanceId;
      next.selectedSabotageId = null;
      setState(next);
    },

    selectSabotage: (instanceId) => {
      const next = cloneRunState(state);
      next.selectedSabotageId = instanceId;
      next.selectedInstanceId = null;
      setState(next);
    },

    clickTile: (x, y) => {
      const placeable = isPlaceableTile(x, y);
      console.log(`[tile] (${x},${y}) placeable=${placeable}`);
      const next = cloneRunState(state);
      next.lastTileClick = { x, y, placeable };

      if (assertPrep(next) && next.selectedSabotageId && isPathTile(x, y)) {
        const item = next.pathSabotages.find(
          (s) => s.instanceId === next.selectedSabotageId,
        );
        if (item && !item.placed) {
          const idx = MAP.path.findIndex((p) => p.x === x && p.y === y);
          if (idx >= 0) {
            item.pathIndex = idx;
            item.placed = true;
            next.selectedSabotageId = null;
          }
        }
        setState(next);
        return;
      }

      if (assertPrep(next) && next.selectedInstanceId && placeable) {
        const result = tryPlaceOnBoard(
          next.board,
          next.bench,
          next.selectedInstanceId,
          { x, y },
          boardSlotCap(next),
        );
        if (result.ok) {
          next.board = result.board;
          next.bench = result.bench;
          applyMerges(next);
          next.selectedInstanceId = null;
        }
      }

      setState(next);
    },

    buyOffer: (slotIndex) => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      const offer = next.shop.offers.find((o) => o.slotIndex === slotIndex);
      if (!offer || offer.purchased) return { ok: false, reason: "offer_unavailable" };
      if (next.gold < offer.cost) return { ok: false, reason: "insufficient_gold" };

      if (offer.kind === "unit") {
        if (next.bench.length >= next.metaApplied.benchCapacity) {
          return { ok: false, reason: "bench_full" };
        }
        const def = getUnitDef(offer.defId);
        if (!def) return { ok: false, reason: "unknown_unit" };
        next.gold -= offer.cost;
        offer.purchased = true;
        next.bench.push(makeUnit(def.id, 1, null));
        applyMerges(next);
        metaApi.revealCodex([def.id]);
        setState(next);
        return { ok: true };
      }

      if (offer.kind === "buff_chip") {
        const def = getBuffChipDef(offer.defId);
        if (!def) return { ok: false, reason: "unknown_chip" };
        next.gold -= offer.cost;
        offer.purchased = true;
        const chip: BuffChipInstance = {
          instanceId: createInstanceId("c"),
          defId: def.id,
          starLevel: 1,
          socketedOnInstanceId: null,
        };
        next.chips.push(chip);
        applyMerges(next);
        setState(next);
        return { ok: true };
      }

      if (offer.kind === "path_sabotage") {
        const def = getPathSabotageDef(offer.defId);
        if (!def) return { ok: false, reason: "unknown_sabotage" };
        next.gold -= offer.cost;
        offer.purchased = true;
        const item: PathSabotageInstance = {
          instanceId: createInstanceId("s"),
          defId: def.id,
          pathIndex: null,
          placed: false,
        };
        next.pathSabotages.push(item);
        setState(next);
        return { ok: true };
      }

      return { ok: false, reason: "unknown_offer_kind" };
    },

    rerollShop: () => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      const free = next.gambit.freeRerollsRemaining > 0;
      if (!free && next.gold < REROLL_COST) {
        return { ok: false, reason: "insufficient_gold" };
      }
      if (free) {
        next.gambit.freeRerollsRemaining -= 1;
      } else {
        next.gold -= REROLL_COST;
      }
      refreshShopOn(next);
      setState(next);
      return { ok: true };
    },

    sellUnit: (instanceId) => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      const onBench = next.bench.findIndex((u) => u.instanceId === instanceId);
      const onBoard = next.board.findIndex((u) => u.instanceId === instanceId);
      let unit: UnitInstance | undefined;
      if (onBench >= 0) {
        unit = next.bench[onBench];
        next.bench = next.bench.filter((_, i) => i !== onBench);
      } else if (onBoard >= 0) {
        unit = next.board[onBoard];
        next.board = next.board.filter((_, i) => i !== onBoard);
      }
      if (!unit) return { ok: false, reason: "unit_not_found" };
      const def = getUnitDef(unit.defId);
      if (!def) return { ok: false, reason: "unknown_unit" };

      for (const chipId of unit.chipInstanceIds) {
        const chip = next.chips.find((c) => c.instanceId === chipId);
        if (chip) chip.socketedOnInstanceId = null;
      }
      next.chipInventory = next.chips.filter((c) => c.socketedOnInstanceId === null);

      next.gold += sellValue(def.cost, unit.starLevel);
      if (next.selectedInstanceId === instanceId) next.selectedInstanceId = null;
      applyMerges(next);
      setState(next);
      return { ok: true };
    },

    moveToBench: (instanceId) => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      const result = tryMoveToBench(
        next.board,
        next.bench,
        instanceId,
        next.metaApplied.benchCapacity,
      );
      if (!result.ok) return { ok: false, reason: result.reason };
      next.board = result.board;
      next.bench = result.bench;
      applyMerges(next);
      setState(next);
      return { ok: true };
    },

    mergeOnto: (sourceId, targetId) => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      const result = mergeSpecificPair(
        next.board,
        next.bench,
        sourceId,
        targetId,
        () => createInstanceId("m"),
      );
      if (!result.ok) return { ok: false, reason: result.reason };
      next.board = result.board;
      next.bench = result.bench;
      rebindTransferredChips(next);
      // Safety net: auto-merge any remaining pairs after explicit combine.
      applyMerges(next);
      next.selectedInstanceId = result.product.instanceId;
      setState(next);
      return { ok: true };
    },

    pickEvent: (choiceIndex) => {
      if (!state.eventChoice) return { ok: false, reason: "no_event" };
      if (state.phase !== "SHOP_PREP" && state.phase !== "MERGE_SETUP") {
        return { ok: false, reason: "wrong_phase" };
      }
      const choice = state.eventChoice.choices[choiceIndex];
      if (!choice) return { ok: false, reason: "invalid_choice" };
      const next = cloneRunState(state);
      const rand = createRng(next.rngSeed);
      const applied = applyRunEvent(next, choice.id, midPathIndex(), rand);
      next.rngSeed = (next.rngSeed + 1 + Math.floor(rand() * 1e9)) >>> 0;
      if (applied.kind === "cannot_afford") {
        return { ok: false, reason: "insufficient_gold" };
      }
      if (applied.kind === "start_boss_arena") {
        startBossArena(next);
        setState(next);
        return { ok: true };
      }
      next.eventChoice = null;
      refreshShopOn(next);
      setState(next);
      return { ok: true };
    },

    setAutoMergeEnabled: (enabled) => {
      const next = cloneRunState(state);
      next.autoMergeEnabled = Boolean(enabled);
      if (next.autoMergeEnabled) applyMerges(next);
      setState(next);
    },

    debugForceEvent: () => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      openEventChoice(next, "era");
      setState(next);
      return { ok: true };
    },

    socketChip: (chipInstanceId, unitInstanceId) => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      const chip = next.chips.find((c) => c.instanceId === chipInstanceId);
      if (!chip || chip.socketedOnInstanceId !== null) {
        return { ok: false, reason: "chip_unavailable" };
      }
      const unit = findUnit(next, unitInstanceId);
      if (!unit) return { ok: false, reason: "unit_not_found" };

      chip.socketedOnInstanceId = unit.instanceId;
      unit.chipInstanceIds = [...unit.chipInstanceIds, chip.instanceId];
      next.chipInventory = next.chips.filter((c) => c.socketedOnInstanceId === null);
      setState(next);
      return { ok: true };
    },

    activateGambit: (gambitId) => {
      const result = tryActivateGambit(state, gambitId);
      if (!result.ok) return result;
      const next = cloneRunState(state);
      Object.assign(next, result.state);
      if (gambitId === "random_higher_unit") {
        const unlocked = UNIT_DEFS.filter((u) => u.era <= next.currentEra);
        const pool = unlocked.length > 0 ? unlocked : UNIT_DEFS;
        const def = pool[next.rngSeed % pool.length] ?? pool[0];
        if (def) {
          next.bench.push(makeUnit(def.id, 2, null));
          applyMerges(next);
          metaApi.revealCodex([def.id]);
        }
        next.rngSeed = (next.rngSeed + 17) >>> 0;
      }
      setState(next);
      return { ok: true };
    },

    cycleTargeting: (instanceId) => {
      const next = cloneRunState(state);
      const unit = findUnit(next, instanceId);
      if (!unit) return { ok: false, reason: "unit_not_found" };
      unit.targeting = nextTargetingMode(unit.targeting);
      setState(next);
      return { ok: true };
    },

    ready: () => startWave(),
    readyStub: () => startWave(),

    tick: (dtMs) => {
      const inArena = state.phase === "EVENT_ARENA";
      if (state.phase !== "AUTOBATTLE" && !inArena) return;
      if (!state.waveRuntime) return;

      // Hot path: mutate in place so canvas rAF stays smooth without
      // structuredClone every frame. React only needs a new snapshot on phase change.
      if (!inArena) {
        spawnDueCreeps(
          state.waveRuntime,
          state.creeps,
          () => createInstanceId("e"),
          dtMs,
          state.waveNumber,
          state.waveRuntime.eventHpMult ?? 1,
        );
      }
      const result = tickCombat(state, dtMs, () => createInstanceId("p"));

      if (inArena) {
        // Boss arena: any leak = fail costs; never RUN_DEFEAT from arena alone.
        if (result.leakedIds.length > 0) {
          const next = cloneRunState(state);
          applyBossArenaFail(next);
          refreshShopOn(next);
          setState(next);
          return;
        }
        if (result.waveComplete) {
          const next = cloneRunState(state);
          next.arena = null;
          next.creeps = [];
          next.projectiles = [];
          next.waveRuntime = null;
          next.phase = "SHOP_PREP";
          grantBossArenaLoot(next);
          refreshShopOn(next);
          setState(next);
          return;
        }
      } else {
        if (result.defeated) {
          enterDefeat(state);
          return;
        }

        if (result.waveComplete) {
          const next = cloneRunState(state);
          afterWaveClear(next);
          setState(next);
          return;
        }
      }

      // Canvas reads getState() inside rAF (no React needed).
      // Throttle shallow snapshots ~10Hz so Base HP / phase HUD stay live.
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      if (now - lastHudEmitMs >= 100) {
        lastHudEmitMs = now;
        emitHudSnapshot();
      }
    },

    pickDiscovery: (choiceIndex) => {
      if (state.phase !== "ERA_FREEZE" || !state.discovery) {
        return { ok: false, reason: "wrong_phase" };
      }
      const choice = state.discovery.choices[choiceIndex];
      if (!choice) return { ok: false, reason: "invalid_choice" };
      const def = getUnitDef(choice.defId);
      if (!def) return { ok: false, reason: "unknown_unit" };

      const next = cloneRunState(state);
      const offeredIds = next.discovery!.choices.map((c) => c.defId);
      // Unlock era pools / board slots / shop odds
      next.currentEra = next.discovery!.newEra;
      next.discovery = null;
      // Soft overflow if bench is full — still grant the free 2★
      next.bench.push(makeUnit(def.id, choice.starLevel, null));
      applyMerges(next);
      next.phase = "SHOP_PREP";
      metaApi.revealCodex(offeredIds);
      // Queue: Era Discovery first (just resolved), then Event Choice (1 of 2).
      if (shouldOfferRunEventAfterEra()) {
        openEventChoice(next, "era");
      } else {
        refreshShopOn(next);
      }
      setState(next);
      return { ok: true };
    },

    startNewRun: (seed) => {
      metaApi.clearPausedRun();
      nextInstanceSeq = 1;
      defeatAwarded = false;
      lastDefeatSummary = null;
      const skills = metaApi.getMeta().unlockedSkills;
      setState(createInitialRunState(seed ?? Date.now() % 1_000_000, skills));
    },

    pauseActiveRun: () => {
      // Persist full snapshot; only one slot (overwrite). Canvas rAF stops when RunScreen unmounts.
      if (state.phase === "RUN_DEFEAT") return;
      saveSnapshotForPause();
    },

    resumePausedRun: () => {
      const paused = metaApi.peekPausedRun();
      if (!paused) return { ok: false, reason: "no_paused_run" };
      nextInstanceSeq = paused.nextInstanceSeq;
      defeatAwarded = false;
      lastDefeatSummary = null;
      setState(cloneRunState(paused.run));
      // Keep saved copy until explicit clear on new run / defeat so refresh can re-resume.
      return { ok: true };
    },

    acknowledgeDefeat: () => {
      if (state.phase === "RUN_DEFEAT" && !defeatAwarded) {
        const result = metaApi.endRun(state.wavesCleared);
        lastDefeatSummary = {
          wavesCleared: state.wavesCleared,
          xpGained: result.xpGained,
        };
        defeatAwarded = true;
      }
      return lastDefeatSummary ?? { wavesCleared: 0, xpGained: 0 };
    },

    getLastDefeatSummary: () => lastDefeatSummary,

    debugSetGold: (gold) => {
      const next = cloneRunState(state);
      next.gold = Math.max(0, Math.floor(gold));
      setState(next);
    },

    debugSetWave: (waveNumber) => {
      const next = cloneRunState(state);
      next.waveNumber = Math.max(1, Math.floor(waveNumber));
      next.phase = "SHOP_PREP";
      next.discovery = null;
      next.creeps = [];
      next.projectiles = [];
      next.waveRuntime = null;
      setState(next);
    },

    debugCompleteWave: () => {
      if (state.phase !== "AUTOBATTLE" && !assertPrep(state)) {
        return { ok: false, reason: "wrong_phase" };
      }
      const next = cloneRunState(state);
      afterWaveClear(next);
      setState(next);
      return { ok: true };
    },

    resetRun: (seed, skills) => {
      nextInstanceSeq = 1;
      defeatAwarded = false;
      lastDefeatSummary = null;
      setState(createInitialRunState(seed ?? 42, skills ?? []));
    },

    debugSeedMechanicsDemo: () => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      next.gold = Math.max(next.gold, 40);
      const unit = makeUnit("unit_slinger", 2, { x: 1, y: 1 });
      const pierce: BuffChipInstance = {
        instanceId: createInstanceId("c"),
        defId: "chip_pierce",
        starLevel: 2,
        socketedOnInstanceId: unit.instanceId,
      };
      const life: BuffChipInstance = {
        instanceId: createInstanceId("c"),
        defId: "chip_lifesteal",
        starLevel: 1,
        socketedOnInstanceId: null,
      };
      unit.chipInstanceIds = [pierce.instanceId];
      next.board = [unit];
      next.bench = next.bench.filter((u) => u.instanceId !== unit.instanceId);
      next.chips = [...next.chips, pierce, life];
      next.chipInventory = next.chips.filter((c) => c.socketedOnInstanceId === null);
      const tar: PathSabotageInstance = {
        instanceId: createInstanceId("s"),
        defId: "sabotage_tar_slick",
        pathIndex: Math.min(8, MAP.path.length - 1),
        placed: true,
      };
      const flare: PathSabotageInstance = {
        instanceId: createInstanceId("s"),
        defId: "sabotage_signal_flare",
        pathIndex: null,
        placed: false,
      };
      next.pathSabotages = [...next.pathSabotages, tar, flare];
      next.selectedSabotageId = flare.instanceId;
      setState(next);
      return { ok: true };
    },

    debugSeedNeonSkinDemo: () => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      next.gold = Math.max(next.gold, 40);
      next.currentEra = 5;
      // Distinct roles / eras / stars — placeable tiles off the serpentine path
      const roster: { defId: string; star: number; tile: { x: number; y: number } }[] = [
        { defId: "unit_spearman", star: 1, tile: { x: 1, y: 1 } },
        { defId: "unit_archer", star: 2, tile: { x: 2, y: 3 } },
        { defId: "unit_cannon", star: 2, tile: { x: 5, y: 5 } },
        { defId: "unit_m16_soldier", star: 3, tile: { x: 8, y: 3 } },
        { defId: "unit_rail_turret", star: 3, tile: { x: 11, y: 5 } },
        { defId: "unit_drone_spotter", star: 1, tile: { x: 4, y: 1 } },
        { defId: "unit_nano_swarm", star: 2, tile: { x: 9, y: 8 } },
        { defId: "unit_shield_bot", star: 2, tile: { x: 12, y: 3 } },
      ];
      const boarded: UnitInstance[] = [];
      for (const entry of roster) {
        if (!isPlaceableTile(entry.tile.x, entry.tile.y)) continue;
        boarded.push(makeUnit(entry.defId, entry.star, entry.tile));
      }
      next.board = boarded;
      next.bench = [];
      if (boarded[3]) next.selectedInstanceId = boarded[3]!.instanceId;
      metaApi.revealCodex(roster.map((r) => r.defId));
      setState(next);
      return { ok: true };
    },
  };

  function saveSnapshotForPause(): void {
    // If mid-fight, keep AUTOBATTLE so resume continues the wave; App simply stops ticking.
    metaApi.pauseRun(cloneRunState(state), nextInstanceSeq);
  }
}

/** Idle boot state — no Codex pollution until the player starts a run. */
export const gameStore = createStore(
  createInitialRunState(42, [], { skipCodexReveal: true }),
);
