import type { DraftCounterDef, DraftCounterId } from "../core/types";

/**
 * Draft duel counter traits — single-player generated rivals.
 * Once per era: pick one counter that applies for the next segment.
 * Traits stack uncapped with other run traits.
 */
export const DRAFT_COUNTER_DEFS: DraftCounterDef[] = [
  {
    id: "anti_ballistic",
    name: "Scatter Mesh",
    blurb: "Your Ballistic units +8% damage (stacks uncapped).",
    rivalHint: "Rival leans Ballistic DPS",
  },
  {
    id: "anti_swarm",
    name: "Sweep Protocol",
    blurb: "Next wave creeps −8% HP.",
    rivalHint: "Rival floods swarm packs",
  },
  {
    id: "anti_siege",
    name: "Core Brace",
    blurb: "Leak damage taken −1 (min 1) for this segment.",
    rivalHint: "Rival banks on siege leaks",
  },
  {
    id: "anti_economy",
    name: "Audit Spike",
    blurb: "+1 interest next payout.",
    rivalHint: "Rival stacks interest / gold",
  },
  {
    id: "anti_tempo",
    name: "Tempo Break",
    blurb: "+1 free shop reroll this prep.",
    rivalHint: "Rival refreshes shop aggressively",
  },
];

export function getDraftCounterDef(
  id: DraftCounterId,
): DraftCounterDef | undefined {
  return DRAFT_COUNTER_DEFS.find((d) => d.id === id);
}
