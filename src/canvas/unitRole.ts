/**
 * Map content tags / defId → silhouette / sprite family.
 * Shared by procedural stubs and the sprite atlas catalog.
 * Prefer UnitDef.roleShape when present so expanded roster units get role kits.
 */

import { getUnitDef } from "../content/units";

export type UnitRole =
  | "melee"
  | "ballistic"
  | "siege"
  | "support"
  | "energy"
  | "swarm"
  | "generic";

/** Map content tags / roleShape → silhouette family (sprite kits key off defId). */
export function unitRole(defId: string, tags: string[] = []): UnitRole {
  const def = getUnitDef(defId);
  if (def?.roleShape) return def.roleShape;
  // Prefer explicit defId overrides for distinct roster reads
  switch (defId) {
    case "unit_spearman":
    case "unit_knight":
    case "unit_clubber":
    case "unit_pikeman":
    case "unit_steam_knight":
    case "unit_riot_shield":
    case "unit_plasma_blade":
      return "melee";
    case "unit_slinger":
    case "unit_archer":
    case "unit_musket":
    case "unit_gatling":
    case "unit_m16_soldier":
    case "unit_sniper":
    case "unit_net_hunter":
    case "unit_crossbow":
      return "ballistic";
    case "unit_boulder_roll":
    case "unit_catapult":
    case "unit_cannon":
    case "unit_rpg":
    case "unit_rail_turret":
    case "unit_sapper":
    case "unit_mortar":
      return "siege";
    case "unit_tribe_drummer":
    case "unit_monk":
    case "unit_medic_steam":
    case "unit_drone_spotter":
    case "unit_shield_bot":
    case "unit_banner_bearer":
    case "unit_hack_node":
      return "support";
    case "unit_laser_grid":
    case "unit_bone_shaman":
    case "unit_flare_gunner":
    case "unit_ew_jammer":
    case "unit_orbit_laser":
      return "energy";
    case "unit_nano_swarm":
    case "unit_torch_pack":
    case "unit_war_hounds":
    case "unit_coal_beetles":
    case "unit_drone_swarm":
    case "unit_pixel_mites":
      return "swarm";
    default:
      break;
  }
  const t = tags.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes("melee"))) return "melee";
  if (t.some((x) => x.includes("siege"))) return "siege";
  if (t.some((x) => x.includes("support"))) return "support";
  if (t.some((x) => x.includes("energy"))) return "energy";
  if (t.some((x) => x.includes("swarm"))) return "swarm";
  if (t.some((x) => x.includes("ballistic"))) return "ballistic";
  return "generic";
}
