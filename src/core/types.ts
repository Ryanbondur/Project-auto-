/** Content definition (roster entry). starLevel on def is usually 1 base card. */
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

export type StarLevel = 1 | 2 | 3;

export type TargetingMode =
  | "First"
  | "Last"
  | "Strongest"
  | "LowestHP"
  | "AoeCluster";

/** Runtime instance on bench or board */
export type UnitInstance = {
  instanceId: string;
  defId: string;
  starLevel: StarLevel;
  targeting: TargetingMode;
  tile: { x: number; y: number } | null;
  cooldownMs: number;
  currentTargetId: string | null;
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
  pathIndex: number;
  pathT: number;
  alive: boolean;
};

export type WaveDef = {
  waveNumber: number;
  entries: { creepId: string; count: number; spawnDelayMs: number }[];
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

export type ShopOffer = {
  slotIndex: number;
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
  | "ERA_FREEZE"
  | "RUN_DEFEAT"
  | "RUN_VICTORY";

export type Projectile = {
  id: string;
  from: { x: number; y: number };
  toCreepId: string;
  damage: number;
  aoeRadius: number;
  ttlMs: number;
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
  creeps: CreepInstance[];
  projectiles: Projectile[];
  rngSeed: number;
  metaApplied: {
    interestCap: number;
    rangeMult: number;
    mergedAsBonus: number;
    benchCapacity: number;
    eraThresholds: EraConfig[];
  };
  /** Phase 1 debug: last tile click result for UI inspect */
  lastTileClick: {
    x: number;
    y: number;
    placeable: boolean;
  } | null;
};
