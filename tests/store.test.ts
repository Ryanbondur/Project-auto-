import { describe, expect, it } from "vitest";
import { createInitialRunState, createStore } from "../src/core/store";
import { isPlaceableTile, isPathTile } from "../src/content/map";
import { ERA_CONFIGS } from "../src/content/eras";

describe("Phase 1 store + content", () => {
  it("boots a RunState in SHOP_PREP with stub shop and units", () => {
    const state = createInitialRunState(7);
    expect(state.phase).toBe("SHOP_PREP");
    expect(state.gold).toBe(10);
    expect(state.baseHp).toBe(100);
    expect(state.currentEra).toBe(1);
    expect(state.shop.offers).toHaveLength(5);
    expect(state.bench.length).toBeGreaterThanOrEqual(1);
    expect(state.board.length).toBeGreaterThanOrEqual(1);
    expect(state.metaApplied.eraThresholds).toHaveLength(5);
  });

  it("era table matches master-spec slot counts", () => {
    expect(ERA_CONFIGS.map((e) => e.maxBoardSlots)).toEqual([5, 6, 7, 8, 9]);
  });

  it("clickTile records placeability", () => {
    const store = createStore(createInitialRunState());
    // Known path tile from map builder
    expect(isPathTile(0, 2)).toBe(true);
    store.clickTile(0, 2);
    expect(store.getState().lastTileClick).toEqual({
      x: 0,
      y: 2,
      placeable: false,
    });

    expect(isPlaceableTile(1, 1)).toBe(true);
    store.clickTile(1, 1);
    expect(store.getState().lastTileClick?.placeable).toBe(true);
  });
});
