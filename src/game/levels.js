export const LEVELS = {
  easy: {
    columns: 4,
    pairs: 8,
    mismatchDelayMs: 1000,
  },
  hard: {
    columns: 4,
    pairs: 12,
    mismatchDelayMs: 600,
  },
};

// 12 distinct emoji symbols provide up to 12 unique pairs for the Hard level.
export const SYMBOLS = [
  '🍎', '🍌', '🍒', '🍇', '🍉', '🍓',
  '🍋', '🥝', '🍑', '🍍', '🥑', '🥥',
];

// Single config object for win-adaptation thresholds.
export const ADAPTATION_THRESHOLDS = {
  easyToHard: {
    maxMoves: 14,
    maxSeconds: 60,
  },
  hardToEasy: {
    minMoves: 30,
    minSeconds: 150,
  },
};
