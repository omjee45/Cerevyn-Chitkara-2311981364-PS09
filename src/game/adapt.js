import { ADAPTATION_THRESHOLDS } from './levels.js';

// Evaluates player performance on win and decides whether to adjust difficulty.
export function getNextLevel(level, moves, seconds) {
  if (level === 'easy') {
    const { maxMoves, maxSeconds } = ADAPTATION_THRESHOLDS.easyToHard;
    const promoted = moves <= maxMoves && seconds <= maxSeconds;

    if (promoted) {
      return {
        nextLevel: 'hard',
        reason: `You won in ${moves} moves and ${seconds} s. The limit to move up is ${maxMoves} moves and ${maxSeconds} s, so the next round is Hard.`,
      };
    }

    return {
      nextLevel: 'easy',
      reason: `You won in ${moves} moves and ${seconds} s. To move up requires at most ${maxMoves} moves and ${maxSeconds} s, so the next round stays Easy.`,
    };
  }

  // Hard level adaptation
  const { minMoves, minSeconds } = ADAPTATION_THRESHOLDS.hardToEasy;
  const demoted = moves >= minMoves || seconds >= minSeconds;

  if (demoted) {
    return {
      nextLevel: 'easy',
      reason: `You won in ${moves} moves and ${seconds} s. The threshold to move down is ${minMoves} moves or ${minSeconds} s, so the next round is Easy.`,
    };
  }

  return {
    nextLevel: 'hard',
    reason: `You won in ${moves} moves and ${seconds} s. You stayed below the demotion threshold of ${minMoves} moves and ${minSeconds} s, so the next round stays Hard.`,
  };
}
