import { describe, it, expect } from 'vitest';
import { getNextLevel } from '../src/game/adapt.js';
import { saveResult, loadResults } from '../src/game/storage.js';

describe('Adaptation Logic (Phase 2)', () => {
  it('case 1: Easy win with moves <= 14 and seconds <= 60 promotes to Hard with real numbers', () => {
    const result = getNextLevel('easy', 12, 45);
    expect(result.nextLevel).toBe('hard');
    expect(result.reason).toContain('12 moves');
    expect(result.reason).toContain('45 s');
    expect(result.reason).toContain('14 moves');
    expect(result.reason).toContain('60 s');
  });

  it('case 2: Easy win exceeding limits stays on Easy with real numbers', () => {
    const result = getNextLevel('easy', 18, 70);
    expect(result.nextLevel).toBe('easy');
    expect(result.reason).toContain('18 moves');
    expect(result.reason).toContain('70 s');
    expect(result.reason).toContain('14 moves');
    expect(result.reason).toContain('60 s');
  });

  it('case 3: Hard win with moves >= 30 or seconds >= 150 demotes to Easy with real numbers', () => {
    const result = getNextLevel('hard', 32, 120);
    expect(result.nextLevel).toBe('easy');
    expect(result.reason).toContain('32 moves');
    expect(result.reason).toContain('120 s');
    expect(result.reason).toContain('30 moves');
    expect(result.reason).toContain('150 s');
  });

  it('case 4: Hard win staying below thresholds stays on Hard with real numbers', () => {
    const result = getNextLevel('hard', 22, 110);
    expect(result.nextLevel).toBe('hard');
    expect(result.reason).toContain('22 moves');
    expect(result.reason).toContain('110 s');
    expect(result.reason).toContain('30 moves');
    expect(result.reason).toContain('150 s');
  });
});

describe('Anonymous Storage (Phase 2)', () => {
  function createFakeStorage(initialData = null) {
    const store = new Map();
    if (initialData !== null) {
      store.set('ps09_memory_game_results', initialData);
    }
    return {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, val) => store.set(key, String(val)),
    };
  }

  it('saved results are capped at 20', () => {
    const fake = createFakeStorage();

    for (let i = 1; i <= 25; i++) {
      saveResult(
        {
          finishedAt: '12:00:00',
          level: 'easy',
          seed: i,
          moves: 10 + i,
          pairs: 8,
          seconds: 30 + i,
          nextLevel: 'hard',
          reason: `Won round ${i}`,
        },
        fake
      );
    }

    const saved = loadResults(fake);
    expect(saved).toHaveLength(20);
    // Most recent (round 25) should be first
    expect(saved[0].seed).toBe(25);
    expect(saved[19].seed).toBe(6);
  });

  it('corrupt or invalid storage returns an empty list', () => {
    const brokenJsonStorage = createFakeStorage('{"broken json');
    expect(loadResults(brokenJsonStorage)).toEqual([]);

    const nonArrayStorage = createFakeStorage('{"some": "object"}');
    expect(loadResults(nonArrayStorage)).toEqual([]);

    const nullStorage = createFakeStorage(null);
    expect(loadResults(nullStorage)).toEqual([]);
  });
});
