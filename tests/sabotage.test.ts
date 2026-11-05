import { describe, expect, it } from "vitest";
import { MAP } from "../src/content/map";
import {
  SABOTAGE_FORK_OFFSET,
  SABOTAGE_SLOW_MULT,
} from "../src/content/pathSabotage";
import {
  moveCreepAlongPath,
  sabotageDivertOffset,
  sabotageSpeedMult,
  worldPosFromPath,
} from "../src/core/pathing";
import { createInitialRunState, createStore } from "../src/core/store";
import type { CreepInstance, PathSabotageInstance } from "../src/core/types";

function makeCreep(pathIndex = 0, pathT = 0): CreepInstance {
  const pos = worldPosFromPath(pathIndex, pathT, MAP);
  return {
    instanceId: "e1",
    defId: "creep_grunt",
    hp: 40,
    maxHp: 40,
    pathIndex,
    pathT,
    x: pos.x,
    y: pos.y,
    alive: true,
  };
}

describe("path sabotage", () => {
  it("slow_segment applies SABOTAGE_SLOW_MULT on covered indices", () => {
    const items: PathSabotageInstance[] = [
      {
        instanceId: "s1",
        defId: "sabotage_tar_slick",
        pathIndex: 4,
        placed: true,
      },
    ];
    expect(sabotageSpeedMult(4, items)).toBe(SABOTAGE_SLOW_MULT);
    expect(sabotageSpeedMult(7, items)).toBe(SABOTAGE_SLOW_MULT);
    expect(sabotageSpeedMult(8, items)).toBe(1);
  });

  it("brief_fork applies a non-zero lateral divert mid-span", () => {
    const items: PathSabotageInstance[] = [
      {
        instanceId: "s2",
        defId: "sabotage_signal_flare",
        pathIndex: 3,
        placed: true,
      },
    ];
    const mid = sabotageDivertOffset(4, 0.5, items, MAP);
    const mag = Math.hypot(mid.x, mid.y);
    expect(mag).toBeGreaterThan(0.2);
    expect(mag).toBeLessThanOrEqual(SABOTAGE_FORK_OFFSET + 1e-6);

    const outside = sabotageDivertOffset(20, 0, items, MAP);
    expect(outside.x).toBe(0);
    expect(outside.y).toBe(0);
  });

  it("divert offset shifts world position without changing pathIndex", () => {
    const items: PathSabotageInstance[] = [
      {
        instanceId: "s3",
        defId: "sabotage_signal_flare",
        pathIndex: 2,
        placed: true,
      },
    ];
    const creep = makeCreep(2, 0.4);
    const divert = sabotageDivertOffset(2, 0.4, items, MAP);
    const { creep: moved } = moveCreepAlongPath(creep, 0, 16, MAP, 1, divert);
    expect(moved.pathIndex).toBe(2);
    expect(Math.hypot(moved.x - creep.x, moved.y - creep.y)).toBeGreaterThan(0.1);
  });

  it("store places sabotage on path tiles only (not blocking placeables)", () => {
    const store = createStore(createInitialRunState(8));
    const next = store.getState();
    // Inject an unplaced sabotage
    next.pathSabotages.push({
      instanceId: "sab_test",
      defId: "sabotage_tar_slick",
      pathIndex: null,
      placed: false,
    });
    store.selectSabotage("sab_test");
    // Placeable non-path tile should not place sabotage
    store.clickTile(1, 1);
    expect(store.getState().pathSabotages[0]!.placed).toBe(false);
    // Path tile places it
    const pathTile = MAP.path[6]!;
    store.selectSabotage("sab_test");
    store.clickTile(pathTile.x, pathTile.y);
    const placed = store.getState().pathSabotages[0]!;
    expect(placed.placed).toBe(true);
    expect(placed.pathIndex).toBe(6);
  });
});
