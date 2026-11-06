import type { DoctrineDef, DoctrineId } from "../core/types";

/**
 * Commander Doctrine — pick 1 at run start (New Run → mobile sheet).
 * Effects persist for the whole run and show as a tiny HUD chip.
 */
export const DOCTRINE_DEFS: DoctrineDef[] = [
  {
    id: "ballistic_overclock",
    name: "Ballistic Overclock",
    blurb: "Ballistic shop weight up. Ballistic units +12% attack speed.",
  },
  {
    id: "support_aura",
    name: "Support Aura",
    blurb: "Support units grant nearby allies +10% damage.",
  },
  {
    id: "merge_gambler",
    name: "Merge Gambler",
    blurb: "+2 gold on every pairwise merge. Buff chips appear more often.",
  },
  {
    id: "path_warden",
    name: "Path Warden",
    blurb: "Start with a mild mid-path slow (3 waves). Sabotage costs −1g.",
  },
  {
    id: "deep_coffers",
    name: "Deep Coffers",
    blurb: "+5 starting gold. +1 interest on every wave payout.",
  },
];

export function getDoctrineDef(id: DoctrineId): DoctrineDef | undefined {
  return DOCTRINE_DEFS.find((d) => d.id === id);
}

export function doctrineShortLabel(id: DoctrineId): string {
  const def = getDoctrineDef(id);
  if (!def) return id;
  // Tiny HUD chip — first word or short name
  const map: Record<DoctrineId, string> = {
    ballistic_overclock: "Ballistic",
    support_aura: "Support",
    merge_gambler: "Gambler",
    path_warden: "Warden",
    deep_coffers: "Coffers",
  };
  return map[id] ?? def.name;
}
