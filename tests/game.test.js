import { describe, it, expect } from 'vitest';
import { shuffle } from '../src/game/random.js';
import { newGame, gameReducer, getElapsedMs } from '../src/game/reducer.js';
import fixtureData from '../sample_data/session_fixtures.json';

describe('Game Logic (Phase 1)', () => {
  it('same seed gives the same shuffle order, and a different seed gives a different one', () => {
    const symbols = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓'];
    const order1 = shuffle(symbols, 42);
    const order2 = shuffle(symbols, 42);
    const order3 = shuffle(symbols, 99);

    expect(order1).toEqual(order2);
    expect(order1).not.toEqual(order3);
  });

  it('the Easy deck has 16 cards and 8 pairs', () => {
    const game = newGame('easy', 1, 1);
    expect(game.cards).toHaveLength(16);

    // Verify each symbol appears exactly twice
    const symbolCounts = {};
    for (const card of game.cards) {
      symbolCounts[card.symbol] = (symbolCounts[card.symbol] || 0) + 1;
    }

    const uniqueSymbols = Object.keys(symbolCounts);
    expect(uniqueSymbols).toHaveLength(8);
    for (const count of Object.values(symbolCounts)) {
      expect(count).toBe(2);
    }
  });

  it('a match marks both cards as matched and adds 1 pair', () => {
    let state = newGame('easy', 1, 1);
    const firstCard = state.cards[0];
    const matchingCard = state.cards.find(
      (c) => c.id !== firstCard.id && c.symbol === firstCard.symbol
    );

    state = gameReducer(state, { type: 'FLIP', cardId: firstCard.id, now: 1000 });
    state = gameReducer(state, { type: 'FLIP', cardId: matchingCard.id, now: 1100 });

    expect(state.pairs).toBe(1);
    expect(state.moves).toBe(1);
    expect(state.cards[firstCard.id].matched).toBe(true);
    expect(state.cards[matchingCard.id].matched).toBe(true);
    expect(state.status).toBe('playing');
    expect(state.firstPick).toBeNull();
    expect(state.secondPick).toBeNull();
  });

  it('a mismatch sets resolving, and RESOLVE flips both cards back', () => {
    let state = newGame('easy', 1, 1);
    const firstCard = state.cards[0];
    const mismatchCard = state.cards.find((c) => c.symbol !== firstCard.symbol);

    state = gameReducer(state, { type: 'FLIP', cardId: firstCard.id, now: 1000 });
    state = gameReducer(state, { type: 'FLIP', cardId: mismatchCard.id, now: 1100 });

    expect(state.status).toBe('resolving');
    expect(state.moves).toBe(1);
    expect(state.pairs).toBe(0);
    expect(state.cards[firstCard.id].faceUp).toBe(true);
    expect(state.cards[mismatchCard.id].faceUp).toBe(true);

    state = gameReducer(state, { type: 'RESOLVE', gameId: state.gameId });

    expect(state.status).toBe('playing');
    expect(state.firstPick).toBeNull();
    expect(state.secondPick).toBeNull();
    expect(state.cards[firstCard.id].faceUp).toBe(false);
    expect(state.cards[mismatchCard.id].faceUp).toBe(false);
  });

  it('a third click is ignored while resolving', () => {
    let state = newGame('easy', 1, 1);
    const firstCard = state.cards[0];
    const mismatchCard = state.cards.find((c) => c.symbol !== firstCard.symbol);
    const thirdCard = state.cards.find(
      (c) => c.id !== firstCard.id && c.id !== mismatchCard.id
    );

    state = gameReducer(state, { type: 'FLIP', cardId: firstCard.id, now: 1000 });
    state = gameReducer(state, { type: 'FLIP', cardId: mismatchCard.id, now: 1100 });
    expect(state.status).toBe('resolving');

    const stateBeforeThird = state;
    state = gameReducer(state, { type: 'FLIP', cardId: thirdCard.id, now: 1200 });

    // The third click is ignored
    expect(state).toBe(stateBeforeThird);
    expect(state.cards[thirdCard.id].faceUp).toBe(false);
  });

  it('a repeat click on the same card is ignored and does not count as a move', () => {
    let state = newGame('easy', 1, 1);
    state = gameReducer(state, { type: 'FLIP', cardId: 0, now: 1000 });
    const afterFirst = state;

    state = gameReducer(state, { type: 'FLIP', cardId: 0, now: 1050 });

    expect(state).toBe(afterFirst);
    expect(state.moves).toBe(0);
    expect(state.firstPick).toBe(0);
  });

  it('a click on a matched card is ignored', () => {
    let state = newGame('easy', 1, 1);
    const firstCard = state.cards[0];
    const matchingCard = state.cards.find(
      (c) => c.id !== firstCard.id && c.symbol === firstCard.symbol
    );

    state = gameReducer(state, { type: 'FLIP', cardId: firstCard.id, now: 1000 });
    state = gameReducer(state, { type: 'FLIP', cardId: matchingCard.id, now: 1100 });
    expect(state.pairs).toBe(1);

    const afterMatch = state;
    state = gameReducer(state, { type: 'FLIP', cardId: firstCard.id, now: 1200 });

    expect(state).toBe(afterMatch);
    expect(state.moves).toBe(1);
  });

  it('matching all pairs gives won and sets endedAt', () => {
    let state = newGame('easy', 1, 1);
    const perfectClicks = fixtureData.sessions.perfect_play.clicks;

    let time = 1000;
    for (const cardId of perfectClicks) {
      state = gameReducer(state, { type: 'FLIP', cardId, now: time });
      time += 100;
    }

    expect(state.status).toBe('won');
    expect(state.pairs).toBe(8);
    expect(state.moves).toBe(8);
    expect(state.startedAt).toBe(1000);
    expect(state.endedAt).toBe(time - 100);

    // Verify getElapsedMs returns fixed duration on win
    const elapsed = getElapsedMs(state, 99999);
    expect(elapsed).toBe(state.endedAt - state.startedAt);
  });

  it('RESTART gives a fresh game, and a RESOLVE from the old gameId is ignored', () => {
    let state = newGame('easy', 1, 1);
    state = gameReducer(state, { type: 'FLIP', cardId: 0, now: 1000 });
    state = gameReducer(state, { type: 'FLIP', cardId: 1, now: 1100 });
    expect(state.status).toBe('resolving');

    const restarted = gameReducer(state, { type: 'RESTART', level: 'easy', seed: 2 });
    expect(restarted.gameId).toBe(2);
    expect(restarted.status).toBe('ready');
    expect(restarted.cards.every((c) => !c.faceUp)).toBe(true);

    // Old RESOLVE from gameId 1 arrives after restart
    const ignored = gameReducer(restarted, { type: 'RESOLVE', gameId: 1 });
    expect(ignored).toBe(restarted);
  });

  it('a scripted fixture session gives the expected moves and pairs', () => {
    // Session 1: perfect play
    let state1 = newGame('easy', fixtureData.seed, 1);
    for (const cardId of fixtureData.sessions.perfect_play.clicks) {
      state1 = gameReducer(state1, { type: 'FLIP', cardId, now: Date.now() });
    }
    expect(state1.moves).toBe(fixtureData.sessions.perfect_play.expected.moves);
    expect(state1.pairs).toBe(fixtureData.sessions.perfect_play.expected.pairs);
    expect(state1.status).toBe(fixtureData.sessions.perfect_play.expected.status);

    // Session 2: one mismatch then win
    let state2 = newGame('easy', fixtureData.seed, 1);
    for (const cardId of fixtureData.sessions.one_mismatch_then_win.clicks) {
      state2 = gameReducer(state2, { type: 'FLIP', cardId, now: Date.now() });
    }
    expect(state2.status).toBe('resolving');

    state2 = gameReducer(state2, { type: 'RESOLVE', gameId: state2.gameId });
    expect(state2.status).toBe('playing');

    for (const cardId of fixtureData.sessions.one_mismatch_then_win.subsequentClicks) {
      state2 = gameReducer(state2, { type: 'FLIP', cardId, now: Date.now() });
    }
    expect(state2.moves).toBe(fixtureData.sessions.one_mismatch_then_win.expected.moves);
    expect(state2.pairs).toBe(fixtureData.sessions.one_mismatch_then_win.expected.pairs);
    expect(state2.status).toBe(fixtureData.sessions.one_mismatch_then_win.expected.status);
  });
});
