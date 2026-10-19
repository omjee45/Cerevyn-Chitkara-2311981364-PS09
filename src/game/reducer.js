import { LEVELS, SYMBOLS } from './levels.js';
import { shuffle } from './random.js';

// Setup fresh board with duplicated and shuffled cards
export function newGame(level, seed, gameId) {
  const config = LEVELS[level];
  const selectedSymbols = SYMBOLS.slice(0, config.pairs);
  const deckSymbols = shuffle(
    selectedSymbols.flatMap((s) => [s, s]),
    seed
  );

  const cards = deckSymbols.map((symbol, id) => ({
    id,
    symbol,
    faceUp: false,
    matched: false,
  }));

  return {
    gameId,
    level,
    seed,
    cards,
    firstPick: null,
    secondPick: null,
    status: 'ready',
    moves: 0,
    pairs: 0,
    startedAt: null,
    endedAt: null,
  };
}

// Active playing time in milliseconds
export function getElapsedMs(state, now) {
  if (state.startedAt === null) {
    return 0;
  }
  if (state.endedAt !== null) {
    return Math.max(0, state.endedAt - state.startedAt);
  }
  return Math.max(0, now - state.startedAt);
}

// Pure game reducer
export function gameReducer(state, action) {
  switch (action.type) {
    case 'FLIP': {
      // Block clicks if resolving or already won
      if (state.status === 'resolving' || state.status === 'won') {
        return state;
      }

      const card = state.cards.find((c) => c.id === action.cardId);
      // Ignore click if card is missing, open, or matched
      if (!card || card.faceUp || card.matched) {
        return state;
      }

      const isFirstFlip = state.startedAt === null;
      const startedAt = isFirstFlip ? action.now : state.startedAt;

      // First card of the pair
      if (state.firstPick === null) {
        return {
          ...state,
          startedAt,
          status: 'playing',
          firstPick: card.id,
          cards: state.cards.map((c) =>
            c.id === card.id ? { ...c, faceUp: true } : c
          ),
        };
      }

      // Second card of the pair
      const firstCard = state.cards.find((c) => c.id === state.firstPick);
      const isMatch = firstCard.symbol === card.symbol;
      const newMoves = state.moves + 1;

      if (isMatch) {
        const newPairs = state.pairs + 1;
        const isWon = newPairs === LEVELS[state.level].pairs;

        return {
          ...state,
          moves: newMoves,
          pairs: newPairs,
          status: isWon ? 'won' : 'playing',
          firstPick: null,
          secondPick: null,
          endedAt: isWon ? action.now : null,
          cards: state.cards.map((c) =>
            c.id === card.id || c.id === firstCard.id
              ? { ...c, faceUp: true, matched: true }
              : c
          ),
        };
      }

      // Mismatch: keep both revealed until RESOLVE
      return {
        ...state,
        moves: newMoves,
        status: 'resolving',
        secondPick: card.id,
        cards: state.cards.map((c) =>
          c.id === card.id ? { ...c, faceUp: true } : c
        ),
      };
    }

    case 'RESOLVE': {
      // Ignore if game changed or not in resolving state
      if (action.gameId !== state.gameId || state.status !== 'resolving') {
        return state;
      }

      return {
        ...state,
        status: 'playing',
        firstPick: null,
        secondPick: null,
        cards: state.cards.map((c) =>
          c.id === state.firstPick || c.id === state.secondPick
            ? { ...c, faceUp: false }
            : c
        ),
      };
    }

    case 'RESTART': {
      // Create new game with incremented gameId
      return newGame(action.level, action.seed, state.gameId + 1);
    }

    default:
      return state;
  }
}
