import { describe, expect, it } from "vitest";
import {
  applyDraftCounter,
  rollDraftDuel,
  shouldOfferDraftDuel,
} from "../src/core/draftDuel";
import { createInitialRunState, createStore } from "../src/core/store";

describe("draft duel", () => {
  it("rolls 3 anonymized rivals with counters", () => {
    const { duel } = rollDraftDuel(50, 2);
    expect(duel.rivals).toHaveLength(3);
    expect(duel.era).toBe(2);
    for (const r of duel.rivals) {
      expect(r.codename).toMatch(/^Rival /);
      expect(r.counterId).toBeTruthy();
      expect(r.stats.dps).toBeTruthy();
    }
  });

  it("applyDraftCounter stacks traits uncapped", () => {
    const state = createInitialRunState(4);
    state.currentEra = 2;
    applyDraftCounter(state, "anti_ballistic");
    expect(state.modifiers.ballisticDamageBonus).toBeCloseTo(0.08);
    expect(state.activeDraftCounter).toBe("anti_ballistic");
    expect(state.draftDuelCompletedEra).toBe(2);
    applyDraftCounter(state, "anti_ballistic");
    expect(state.modifiers.ballisticDamageBonus).toBeCloseTo(0.16);
  });

  it("anti_siege reduces leak; anti_tempo grants free reroll", () => {
    const state = createInitialRunState(5);
    state.currentEra = 3;
    applyDraftCounter(state, "anti_siege");
    expect(state.modifiers.leakDamageReduction).toBe(1);
    applyDraftCounter(state, "anti_tempo");
    expect(state.gambit.freeRerollsRemaining).toBeGreaterThanOrEqual(1);
  });

  it("store pickDraftCounter applies and clears sheet", () => {
    const store = createStore(createInitialRunState(8));
    store.startNewRun(8, "deep_coffers");
    expect(store.debugForceDraftDuel().ok).toBe(true);
    expect(store.getState().draftDuel?.rivals).toHaveLength(3);
    expect(store.pickDraftCounter(0).ok).toBe(true);
    expect(store.getState().draftDuel).toBeNull();
    expect(store.getState().activeDraftCounter).toBeTruthy();
  });

  it("shouldOfferDraftDuel once per era after era 1", () => {
    const state = createInitialRunState(1);
    expect(shouldOfferDraftDuel(state)).toBe(false);
    state.currentEra = 2;
    expect(shouldOfferDraftDuel(state)).toBe(true);
    state.draftDuelCompletedEra = 2;
    expect(shouldOfferDraftDuel(state)).toBe(false);
  });
});
