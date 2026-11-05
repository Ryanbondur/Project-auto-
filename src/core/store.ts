import {
  DEFAULT_BENCH_CAPACITY,
  INTEREST_CAP_DEFAULT,
  SHOP_SIZE,
  STARTING_BASE_HP,
  STARTING_GOLD,
} from "./constants";
import { ERA_CONFIGS } from "../content/eras";
import { UNIT_DEFS } from "../content/units";
import { isPlaceableTile } from "../content/map";
import type { RunState, ShopOffer, UnitInstance } from "./types";

type Listener = () => void;

let nextInstanceSeq = 1;

export function createInstanceId(prefix = "u"): string {
  const id = `${prefix}_${nextInstanceSeq}`;
  nextInstanceSeq += 1;
  return id;
}

/** Hard-coded Phase 1 shop offers (no weighted roll yet). */
function createStubShopOffers(): ShopOffer[] {
  const pool = UNIT_DEFS.slice(0, SHOP_SIZE);
  return Array.from({ length: SHOP_SIZE }, (_, i) => {
    const def = pool[i % pool.length]!;
    return {
      slotIndex: i,
      defId: def.id,
      cost: def.cost,
      purchased: false,
    };
  });
}

function createStubBench(): UnitInstance[] {
  const def = UNIT_DEFS[0]!;
  return [
    {
      instanceId: createInstanceId(),
      defId: def.id,
      starLevel: 1,
      targeting: "First",
      tile: null,
      cooldownMs: 0,
      currentTargetId: null,
    },
  ];
}

function createStubBoard(): UnitInstance[] {
  const def = UNIT_DEFS[1]!;
  return [
    {
      instanceId: createInstanceId(),
      defId: def.id,
      starLevel: 2,
      targeting: "First",
      tile: { x: 1, y: 1 },
      cooldownMs: 0,
      currentTargetId: null,
    },
  ];
}

export function createInitialRunState(seed = 42): RunState {
  return {
    phase: "SHOP_PREP",
    waveNumber: 1,
    wavesCleared: 0,
    gold: STARTING_GOLD,
    baseHp: STARTING_BASE_HP,
    currentEra: 1,
    board: createStubBoard(),
    bench: createStubBench(),
    shop: {
      offers: createStubShopOffers(),
      rerollCost: 1,
    },
    creeps: [],
    projectiles: [],
    rngSeed: seed,
    metaApplied: {
      interestCap: INTEREST_CAP_DEFAULT,
      rangeMult: 1,
      mergedAsBonus: 0,
      benchCapacity: DEFAULT_BENCH_CAPACITY,
      eraThresholds: ERA_CONFIGS.map((e) => ({ ...e, shopOdds: { ...e.shopOdds } })),
    },
    lastTileClick: null,
  };
}

function cloneRunState(state: RunState): RunState {
  return structuredClone(state);
}

export type GameStore = {
  getState: () => RunState;
  subscribe: (listener: Listener) => () => void;
  /** Phase 1: tile click logs placeability into state for UI inspect */
  clickTile: (x: number, y: number) => void;
  /** Optional debug gold nudge for store inspectability */
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

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clickTile: (x, y) => {
      const placeable = isPlaceableTile(x, y);
      // Acceptance: clicking tiles logs placeability
      console.log(`[tile] (${x},${y}) placeable=${placeable}`);
      const next = cloneRunState(state);
      next.lastTileClick = { x, y, placeable };
      setState(next);
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
