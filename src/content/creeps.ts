import {
  BOSS_LEAK_DAMAGE,
  STANDARD_LEAK_DAMAGE,
} from "../core/constants";
import type { CreepDef } from "../core/types";

/** Placeholder creep catalog — art-last circles by type. */
export const CREEP_DEFS: CreepDef[] = [
  {
    id: "creep_runner",
    name: "Runner",
    isBoss: false,
    maxHp: 18,
    speed: 2.4,
    armor: 0,
    leakDamage: STANDARD_LEAK_DAMAGE,
  },
  {
    id: "creep_grunt",
    name: "Grunt",
    isBoss: false,
    maxHp: 40,
    speed: 1.4,
    armor: 0,
    leakDamage: STANDARD_LEAK_DAMAGE,
  },
  {
    id: "creep_tank",
    name: "Tank",
    isBoss: false,
    maxHp: 120,
    speed: 0.75,
    armor: 2,
    leakDamage: STANDARD_LEAK_DAMAGE,
  },
  {
    id: "creep_swarm",
    name: "Swarmling",
    isBoss: false,
    maxHp: 10,
    speed: 1.8,
    armor: 0,
    leakDamage: STANDARD_LEAK_DAMAGE,
  },
  {
    id: "creep_boss",
    name: "Boss",
    isBoss: true,
    maxHp: 600,
    speed: 0.55,
    armor: 4,
    leakDamage: BOSS_LEAK_DAMAGE,
  },
];

export function getCreepDef(id: string): CreepDef | undefined {
  return CREEP_DEFS.find((c) => c.id === id);
}
