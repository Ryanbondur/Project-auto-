import {
  DEFAULT_BENCH_CAPACITY,
  INTEREST_CAP_DEFAULT,
  REROLL_COST,
  STARTING_BASE_HP,
  STARTING_GOLD,
} from "./constants";
import { ERA_CONFIGS, getEraConfig } from "../content/eras";
import { isPlaceableTile } from "../content/map";
import { UNIT_DEFS, getUnitDef } from "../content/units";
import { getBuffChipDef } from "../content/buffChips";
import { getPathSabotageDef } from "../content/pathSabotage";
import { applyWavePayout, sellValue } from "./economy";
import { createGambitState, interestMultiplier, tryActivateGambit } from "./gambit";
import { autoMergeChipsPairwise, autoMergePairwise } from "./merge";
import { tryMoveToBench, tryPlaceOnBoard } from "./placement";
import { createShopState } from "./shop";
import type {
  BuffChipInstance,
  GambitId,
  PathSabotageInstance,
  RunState,
  UnitInstance,
} from "./types";

type Listener = () => void;

let nextInstanceSeq = 1;

export function createInstanceId(prefix = "u"): string {
  const id = `${prefix}_${nextInstanceSeq}`;
  nextInstanceSeq += 1;
  return id;
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

function applyMerges(state: RunState): void {
  const unitMerge = autoMergePairwise(state.board, state.bench, () =>
    createInstanceId("m"),
  );
  state.board = unitMerge.board;
  state.bench = unitMerge.bench;

  const chipMerge = autoMergeChipsPairwise(state.chips, () => createInstanceId("c"));
  state.chips = chipMerge.chips;
  state.chipInventory = state.chips.filter((c) => c.socketedOnInstanceId === null);
}

export function createInitialRunState(seed = 42): RunState {
  const era = getEraConfig(1);
  const { shop, nextSeed } = createShopState(era, seed);
  return {
    phase: "SHOP_PREP",
    waveNumber: 1,
    wavesCleared: 0,
    gold: STARTING_GOLD,
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
    rngSeed: nextSeed,
    selectedInstanceId: null,
    metaApplied: {
      interestCap: INTEREST_CAP_DEFAULT,
      rangeMult: 1,
      mergedAsBonus: 0,
      benchCapacity: DEFAULT_BENCH_CAPACITY,
      eraThresholds: ERA_CONFIGS.map((e) => ({ ...e, shopOdds: { ...e.shopOdds } })),
    },
    lastTileClick: null,
    lastPayout: null,
  };
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

export type ActionResult = { ok: true } | { ok: false; reason: string };

export type GameStore = {
  getState: () => RunState;
  subscribe: (listener: Listener) => () => void;
  clickTile: (x: number, y: number) => void;
  selectUnit: (instanceId: string | null) => void;
  buyOffer: (slotIndex: number) => ActionResult;
  rerollShop: () => ActionResult;
  sellUnit: (instanceId: string) => ActionResult;
  moveToBench: (instanceId: string) => ActionResult;
  socketChip: (chipInstanceId: string, unitInstanceId: string) => ActionResult;
  activateGambit: (gambitId: GambitId) => ActionResult;
  /** Prep-only Ready stub: payout + wave++ + shop refresh (combat Phase 3). */
  readyStub: () => ActionResult;
  debugSetGold: (gold: number) => void;
  resetRun: (seed?: number) => void;
};

export function createStore(initial?: RunState): GameStore {
  let state = initial ?? createInitialRunState();
  const listeners = new Set<Listener>();

  const emit = () => {
    for (const l of listeners) l();
  };

  const setState = (next: RunState) => {
    state = next;
    emit();
  };

  const refreshShop = (next: RunState) => {
    const era =
      next.metaApplied.eraThresholds.find((e) => e.era === next.currentEra) ??
      getEraConfig(next.currentEra);
    const rolled = createShopState(era, next.rngSeed);
    next.shop = rolled.shop;
    next.rngSeed = rolled.nextSeed;
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
      setState(next);
    },

    clickTile: (x, y) => {
      const placeable = isPlaceableTile(x, y);
      console.log(`[tile] (${x},${y}) placeable=${placeable}`);
      const next = cloneRunState(state);
      next.lastTileClick = { x, y, placeable };

      if (
        assertPrep(next) &&
        next.selectedInstanceId &&
        placeable
      ) {
        const era =
          next.metaApplied.eraThresholds.find((e) => e.era === next.currentEra) ??
          getEraConfig(next.currentEra);
        const result = tryPlaceOnBoard(
          next.board,
          next.bench,
          next.selectedInstanceId,
          { x, y },
          era.maxBoardSlots,
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
        // TODO: placement UX onto a path segment without blocking.
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
      refreshShop(next);
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

      // Detach chips back to inventory
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

    socketChip: (chipInstanceId, unitInstanceId) => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      const chip = next.chips.find((c) => c.instanceId === chipInstanceId);
      if (!chip || chip.socketedOnInstanceId !== null) {
        return { ok: false, reason: "chip_unavailable" };
      }
      const unit = findUnit(next, unitInstanceId);
      if (!unit) return { ok: false, reason: "unit_not_found" };

      // Pierce chip is the one "working" socket path; others still socket as data.
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
        // Grant a random unit at 2★ onto bench (soft-overflow ok during gambit).
        const def = UNIT_DEFS[next.rngSeed % UNIT_DEFS.length] ?? UNIT_DEFS[0];
        if (def) {
          next.bench.push(makeUnit(def.id, 2, null));
          applyMerges(next);
        }
        next.rngSeed = (next.rngSeed + 17) >>> 0;
      }
      if (gambitId === "double_interest") {
        // Flag only — interestMultiplier reads gambit on payout.
      }
      setState(next);
      return { ok: true };
    },

    readyStub: () => {
      if (!assertPrep(state)) return { ok: false, reason: "wrong_phase" };
      const next = cloneRunState(state);
      // Phase 2 prep-only loop: skip AUTOBATTLE, apply payout as if wave cleared.
      const mult = interestMultiplier(next.gambit);
      const payout = applyWavePayout(next.gold, next.metaApplied.interestCap);
      const interest = payout.interest * mult;
      next.gold = next.gold + interest + payout.income;
      next.lastPayout = { interest, income: payout.income };
      next.wavesCleared += 1;
      next.waveNumber += 1;
      // Clear one-wave gambit effects after payout
      if (next.gambit.activeGambit === "double_interest") {
        next.gambit.activeGambit = null;
      }
      refreshShop(next);
      next.phase = "SHOP_PREP";
      setState(next);
      return { ok: true };
    },

    debugSetGold: (gold) => {
      const next = cloneRunState(state);
      next.gold = Math.max(0, Math.floor(gold));
      setState(next);
    },

    resetRun: (seed) => {
      nextInstanceSeq = 1;
      setState(createInitialRunState(seed ?? 42));
    },
  };
}

export const gameStore = createStore();
