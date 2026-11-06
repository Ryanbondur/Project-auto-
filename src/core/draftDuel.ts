import { DRAFT_COUNTER_DEFS } from "../content/draftCounters";
import { createRng } from "./rng";
import type {
  DraftCounterId,
  DraftDuelState,
  DraftRivalSummary,
  RunModifiers,
  RunState,
  RunTraitId,
} from "./types";

const RIVAL_ARCHETYPES: {
  label: string;
  stats: { dps: string; economy: string; board: string };
  counters: DraftCounterId[];
}[] = [
  {
    label: "Ballistic line",
    stats: { dps: "High ballistic", economy: "Avg gold", board: "4–5 pads" },
    counters: ["anti_ballistic", "anti_tempo"],
  },
  {
    label: "Swarm flood",
    stats: { dps: "AoE lean", economy: "Low bank", board: "Dense bench" },
    counters: ["anti_swarm", "anti_siege"],
  },
  {
    label: "Siege leak",
    stats: { dps: "Slow heavies", economy: "Interest stack", board: "Front pads" },
    counters: ["anti_siege", "anti_economy"],
  },
  {
    label: "Tempo shopper",
    stats: { dps: "Mixed stars", economy: "Reroll heavy", board: "Flex slots" },
    counters: ["anti_tempo", "anti_economy"],
  },
  {
    label: "Support nest",
    stats: { dps: "Aura core", economy: "Stable", board: "Clustered" },
    counters: ["anti_ballistic", "anti_swarm"],
  },
];

/**
 * Roll 3 anonymized rival summaries + a counter pick per rival.
 * Purely single-player generated — no multiplayer.
 */
export function rollDraftDuel(
  seed: number,
  era: number,
): { duel: DraftDuelState; nextSeed: number } {
  const rand = createRng(seed);
  const pool = [...RIVAL_ARCHETYPES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  const rivals: DraftRivalSummary[] = pool.slice(0, 3).map((arch, idx) => {
    const counter =
      arch.counters[Math.floor(rand() * arch.counters.length)] ??
      arch.counters[0]!;
    const def = DRAFT_COUNTER_DEFS.find((d) => d.id === counter);
    return {
      id: `rival_${era}_${idx}`,
      codename: `Rival ${String.fromCharCode(65 + idx)}`,
      archetype: arch.label,
      stats: arch.stats,
      counterId: counter,
      counterLabel: def?.name ?? counter,
      counterBlurb: def?.blurb ?? "",
    };
  });
  // Ensure distinct counters when possible
  const used = new Set<DraftCounterId>();
  for (const r of rivals) {
    if (!used.has(r.counterId)) {
      used.add(r.counterId);
      continue;
    }
    const alt = DRAFT_COUNTER_DEFS.find((d) => !used.has(d.id));
    if (alt) {
      r.counterId = alt.id;
      r.counterLabel = alt.name;
      r.counterBlurb = alt.blurb;
      used.add(alt.id);
    }
  }
  const nextSeed = (seed + 1 + Math.floor(rand() * 1e9)) >>> 0;
  return {
    duel: { rivals, era },
    nextSeed,
  };
}

/**
 * Apply the counter trait for the next segment. Stacks uncapped.
 */
export function applyDraftCounter(
  state: RunState,
  counterId: DraftCounterId,
): void {
  const m = state.modifiers;
  state.activeDraftCounter = counterId;
  state.draftDuel = null;
  state.draftDuelCompletedEra = state.currentEra;

  switch (counterId) {
    case "anti_ballistic":
      m.ballisticDamageBonus += 0.08;
      pushTrait(m, "ballistic_damage");
      break;
    case "anti_swarm":
      m.nextWaveHpMult = Math.max(0.1, m.nextWaveHpMult - 0.08);
      pushTrait(m, "creep_hp_cut");
      break;
    case "anti_siege":
      m.leakDamageReduction += 1;
      pushTrait(m, "leak_brace");
      break;
    case "anti_economy":
      m.interestBonusNextPayout += 1;
      pushTrait(m, "interest_bonus");
      break;
    case "anti_tempo":
      m.freeRerolls += 1;
      state.gambit.freeRerollsRemaining += 1;
      break;
    default: {
      const _exhaustive: never = counterId;
      void _exhaustive;
    }
  }
}

function pushTrait(m: RunModifiers, id: RunTraitId): void {
  m.traits.push(id);
}

export function shouldOfferDraftDuel(state: RunState): boolean {
  if (state.draftDuel) return false;
  if (state.draftDuelCompletedEra >= state.currentEra) return false;
  // Offer once per era after era unlock (era >= 2) or at era 1 never —
  // first draft is after first era discovery (entering era 2+).
  return state.currentEra >= 2;
}
