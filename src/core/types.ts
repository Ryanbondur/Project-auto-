/** Content definition (roster entry). */
export type UnitDef = {
  id: string;
  name: string;
  era: 1 | 2 | 3 | 4 | 5;
  cost: number;
  tags: string[];
  stats: {
    damage: number;
    attackSpeed: number;
    range: number;
    aoeRadius: number;
  };
  abilities: {
    starLevel2: string;
    starLevel3: string;
  };
};

/** Unbounded star level (pairwise merge; no hard cap for now). */
export type StarLevel = number;

export type TargetingMode =
  | "First"
  | "Last"
  | "Strongest"
  | "LowestHP"
  | "AoeCluster";

/** Buff chip definition — sockets onto a unit; identical chips merge pairwise. */
export type BuffChipDef = {
  id: string;
  name: string;
  cost: number;
  /** Combat amplification applied while socketed. */
  effect: "damage" | "pierce" | "lifesteal" | "heal_pulse" | "aoe_ring";
  description: string;
};

/** Runtime buff chip instance (inventory or socketed). */
export type BuffChipInstance = {
  instanceId: string;
  defId: string;
  starLevel: StarLevel;
  /** null = in inventory / shop grant pending; set when socketed onto a unit */
  socketedOnInstanceId: string | null;
};

/**
 * Path sabotage board item.
 * Slow segments cut creep speed; brief_fork applies a lateral divert hop.
 */
export type PathSabotageDef = {
  id: string;
  name: string;
  cost: number;
  kind: "slow_segment" | "brief_fork";
  description: string;
};

export type PathSabotageInstance = {
  instanceId: string;
  defId: string;
  /** Path index where the item is anchored (segment start). */
  pathIndex: number | null;
  placed: boolean;
};

/**
 * Commander gambit — once-per-run (tunable) rule bend.
 * Spend HP or gold for a one-wave / this-prep bend.
 */
export type GambitId =
  | "double_interest"
  | "free_rerolls"
  | "random_higher_unit";

export type CommanderGambitState = {
  /** Gambits already spent this run (compared to GAMBIT_USES_PER_RUN). */
  usesSpent: number;
  /** @deprecated Prefer usesSpent; kept true when usesSpent >= cap. */
  usedThisRun: boolean;
  activeGambit: GambitId | null;
  /** Extra free rerolls remaining when free_rerolls is active (this prep). */
  freeRerollsRemaining: number;
};

export type UnitInstance = {
  instanceId: string;
  defId: string;
  starLevel: StarLevel;
  targeting: TargetingMode;
  tile: { x: number; y: number } | null;
  cooldownMs: number;
  currentTargetId: string | null;
  /** Ids of buff chips socketed on this unit (max soft-cap later). */
  chipInstanceIds: string[];
  /** True if this instance resulted from a merge (Quick Assembly meta hook). */
  fromMerge: boolean;
};

export type CreepDef = {
  id: string;
  name: string;
  isBoss: boolean;
  maxHp: number;
  speed: number;
  armor: number;
  leakDamage: number;
};

export type CreepInstance = {
  instanceId: string;
  defId: string;
  hp: number;
  /** Max HP for this instance (may be wave-scaled vs catalog). */
  maxHp: number;
  pathIndex: number;
  pathT: number;
  /**
   * Continuous world position in tile units (path centers).
   * Owned by the sim — renderer must use these, never invent grid snaps.
   * Includes brief_fork lateral divert when active.
   */
  x: number;
  y: number;
  alive: boolean;
};

export type WaveDef = {
  waveNumber: number;
  entries: { creepId: string; count: number; spawnDelayMs: number }[];
};

/** Runtime spawn queue for the active autobattle wave. */
export type WaveRuntime = {
  spawnQueue: { creepId: string; spawnAtMs: number }[];
  elapsedMs: number;
  allSpawned: boolean;
  /** Run-event HP mult snapped at Ready (e.g. 0.9 for Weakened swarm). */
  eventHpMult: number;
};

export type EraConfig = {
  era: 1 | 2 | 3 | 4 | 5;
  name: string;
  waveRange: [number, number];
  maxBoardSlots: number;
  shopOdds: {
    era1: number;
    era2: number;
    era3: number;
    era4: number;
    era5: number;
  };
};

export type ShopOfferKind = "unit" | "buff_chip" | "path_sabotage";

export type ShopOffer = {
  slotIndex: number;
  kind: ShopOfferKind;
  defId: string;
  cost: number;
  purchased: boolean;
};

export type ShopState = {
  offers: ShopOffer[];
  rerollCost: 1;
};

export type RunPhase =
  | "SHOP_PREP"
  | "MERGE_SETUP"
  | "AUTOBATTLE"
  | "EVENT_ARENA"
  | "ERA_FREEZE"
  | "RUN_DEFEAT"
  | "RUN_VICTORY";

/**
 * In-flight projectile with continuous world position.
 * Visuals lerp/move each frame; damage applies only on arrival (progress >= 1).
 */
export type Projectile = {
  id: string;
  /** Launch point (tile units, centers). */
  from: { x: number; y: number };
  /** Current interpolated position (tile units). */
  pos: { x: number; y: number };
  /** Last known aim point (updated each frame toward live creep). */
  aim: { x: number; y: number };
  toCreepId: string;
  damage: number;
  aoeRadius: number;
  /** Flight speed in tiles per second. */
  speed: number;
  /** 0..1 along current from→aim segment; resets when aim retargets gently via pos. */
  progress: number;
  /** Extra pierce targets to hit on impact. */
  pierceExtra: number;
  /** Optional arc height in tiles (visual loft). */
  arcHeight: number;
  /** Fraction of damage dealt healed to base HP on arrival (lifesteal chip). */
  lifestealFraction: number;
};

export type SkillId =
  | "deep_pockets"
  | "interest_rate_cap"
  | "master_mason"
  | "quick_assembly"
  | "veterancy"
  | "reinforcements";

export type MetaState = {
  commanderXp: number;
  unlockedSkills: SkillId[];
  codexUnlocked: string[];
  version: 1;
};

export type MapDef = {
  width: number;
  height: number;
  path: { x: number; y: number }[];
};

/** Active Era Discovery modal payload (ERA_FREEZE only). */
export type EraDiscoveryState = {
  newEra: 1 | 2 | 3 | 4 | 5;
  choices: { defId: string; starLevel: 2 }[];
};

/**
 * Run events — fire on era change (~every 10 waves); pick exactly 1 of 2.
 * See core/events.ts for Era Discovery → Event Choice queue rules.
 */
export type RunEventId =
  | "boss_arena"
  | "trait_chest"
  | "gold_board_slot"
  | "gold_heal_core"
  | "gold_rerolls"
  | "board_slot_plus"
  | "path_slow_lane"
  | "interest_bonus"
  | "creep_hp_cut"
  | "ballistic_damage";

/** Trait ids that stack additively with no cap (logged on modifiers.traits). */
export type RunTraitId =
  | "ballistic_damage"
  | "interest_bonus"
  | "creep_hp_cut"
  | "board_slot_plus";

export type RunEventChoice = {
  id: RunEventId;
  title: string;
  blurb: string;
  goldCost?: number;
  kind: "boss" | "chest" | "spend" | "passive";
};

/** Pending Event Choice sheet — exactly 2 options; blocks Ready until resolved. */
export type RunEventChoiceState = {
  choices: RunEventChoice[];
  /** era = after Era Discovery; band = late endless 10-wave cadence. */
  reason: "era" | "band";
  /** Last chest reveal label (UI toast); optional. */
  lastChestTrait?: string;
};

/**
 * Separate boss-arena fight from a boss_arena event.
 * Fail costs gold/HP but never enters RUN_DEFEAT by itself.
 */
export type BossArenaState = {
  kind: "boss";
  /** Creep def id for the arena boss. */
  bossDefId: string;
  /** Wave number label (display); combat uses a dedicated spawn. */
  displayWave: number;
};

/**
 * Active modifiers persisted on the run (and in atd.run.v1).
 * Traits stack additively with no cap.
 */
export type RunModifiers = {
  /** Extra board capacity for the rest of the run. */
  boardSlotsBonus: number;
  /** Additive damage bonus for Ballistic-tagged units (e.g. 0.1 = +10%). */
  ballisticDamageBonus: number;
  /** Flat interest added on the next wave payout, then cleared. */
  interestBonusNextPayout: number;
  /** Multiplier applied to next wave creep HP on spawn, then reset to 1. */
  nextWaveHpMult: number;
  /** Free rerolls granted by events (mirrored into gambit.freeRerollsRemaining). */
  freeRerolls: number;
  /** Extra shop offer slots for the next shop roll this prep. */
  shopOfferBonusThisPrep: number;
  /** Temporary mid-path slow lane (reuse sabotage slow rules). */
  pathSlow: { pathIndex: number; wavesRemaining: number } | null;
  /** Ordered log of trait grants (stacks uncapped). */
  traits: RunTraitId[];
};

export type RunState = {
  phase: RunPhase;
  waveNumber: number;
  wavesCleared: number;
  gold: number;
  baseHp: number;
  currentEra: 1 | 2 | 3 | 4 | 5;
  board: UnitInstance[];
  bench: UnitInstance[];
  shop: ShopState;
  /** Unsocketed chips in reserve (not on a unit). */
  chipInventory: BuffChipInstance[];
  /** All chip instances including socketed (lookup by id). */
  chips: BuffChipInstance[];
  pathSabotages: PathSabotageInstance[];
  gambit: CommanderGambitState;
  creeps: CreepInstance[];
  projectiles: Projectile[];
  /** Active wave spawn plan during AUTOBATTLE; null in prep. */
  waveRuntime: WaveRuntime | null;
  /**
   * Set while phase === ERA_FREEZE. Wave progress and shop are locked until
   * the player picks one free 2★ from the newly unlocked era.
   */
  discovery: EraDiscoveryState | null;
  /**
   * Pending run-event choice sheet. Prep chrome stays visible but Ready is
   * locked until the player picks one option.
   */
  eventChoice: RunEventChoiceState | null;
  /** Active boss-arena encounter (phase === EVENT_ARENA). */
  arena: BossArenaState | null;
  /** Persisted active modifiers for this run. */
  modifiers: RunModifiers;
  /**
   * Auto pairwise merge toggle (design-decisions: default ON).
   * Drag-to-combine always works; auto-merge only when enabled.
   */
  autoMergeEnabled: boolean;
  rngSeed: number;
  /** UI: selected unit for place / sell / socket. */
  selectedInstanceId: string | null;
  /** UI: selected unplaced path sabotage item. */
  selectedSabotageId: string | null;
  metaApplied: {
    interestCap: number;
    rangeMult: number;
    mergedAsBonus: number;
    benchCapacity: number;
    eraThresholds: EraConfig[];
  };
  lastTileClick: {
    x: number;
    y: number;
    placeable: boolean;
  } | null;
  /** Last economy breakdown for HUD (prep cycle stub). */
  lastPayout: {
    interest: number;
    income: number;
  } | null;
  /** Combat: ms until next heal-pulse tick across board heal_pulse chips. */
  healPulseCooldownMs: number;
};
