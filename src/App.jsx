import { useReducer, useState, useEffect } from 'react';
import { LEVELS } from './game/levels.js';
import { newGame, gameReducer, getElapsedMs } from './game/reducer.js';
import { getNextLevel } from './game/adapt.js';
import { saveResult, loadResults } from './game/storage.js';

function getInitialSeed() {
  if (typeof window === 'undefined') return 1;
  const params = new URLSearchParams(window.location.search);
  const seedParam = params.get('seed');
  if (seedParam !== null && !isNaN(Number(seedParam))) {
    return Number(seedParam);
  }
  return Math.floor(Math.random() * 100000);
}

export default function App() {
  const [initialSeed] = useState(getInitialSeed);
  const [state, dispatch] = useReducer(gameReducer, null, () =>
    newGame('easy', initialSeed, 1)
  );

  const [now, setNow] = useState(Date.now);
  const [savedHistory, setSavedHistory] = useState(() => loadResults());
  const [winSummary, setWinSummary] = useState(null);

  // Updates active elapsed time display every 250 ms while the game is actively played.
  useEffect(() => {
    if (state.status !== 'playing') {
      return;
    }
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(timer);
  }, [state.status]);

  // Resolves mismatched pair back face-down after the level-specific delay.
  useEffect(() => {
    if (state.status !== 'resolving') {
      return;
    }
    const delay = LEVELS[state.level].mismatchDelayMs;
    const timerId = setTimeout(() => {
      dispatch({ type: 'RESOLVE', gameId: state.gameId });
    }, delay);

    return () => clearTimeout(timerId);
  }, [state.status, state.gameId, state.level]);

  // Evaluates performance adaptation and saves the result once when a win is achieved.
  useEffect(() => {
    if (state.status !== 'won') {
      setWinSummary(null);
      return;
    }

    const elapsedSeconds = Math.round(getElapsedMs(state, Date.now()) / 1000);
    const adaptation = getNextLevel(state.level, state.moves, elapsedSeconds);

    const record = {
      finishedAt: new Date().toLocaleTimeString(),
      level: state.level,
      seed: state.seed,
      moves: state.moves,
      pairs: state.pairs,
      seconds: elapsedSeconds,
      nextLevel: adaptation.nextLevel,
      reason: adaptation.reason,
    };

    saveResult(record);
    setSavedHistory(loadResults());
    setWinSummary({
      seconds: elapsedSeconds,
      nextLevel: adaptation.nextLevel,
      reason: adaptation.reason,
    });
  }, [state.status, state.gameId]);

  const activeElapsedSeconds = Math.floor(getElapsedMs(state, now) / 1000);

  function handleCardClick(cardId) {
    dispatch({ type: 'FLIP', cardId, now: Date.now() });
  }

  function handleRestart() {
    dispatch({ type: 'RESTART', level: state.level, seed: state.seed });
  }

  function handlePlayNextRound() {
    if (!winSummary) return;
    const newSeed = Math.floor(Math.random() * 100000);
    dispatch({ type: 'RESTART', level: winSummary.nextLevel, seed: newSeed });
  }

  function handleReplayLevel() {
    const newSeed = Math.floor(Math.random() * 100000);
    dispatch({ type: 'RESTART', level: state.level, seed: newSeed });
  }

  return (
    <div className="container">
      <header>
        <h1>PS09 Adaptive Memory Matching Game</h1>
        <p className="instructions">
          Click any card to reveal it, then find its matching partner.
          Mismatched pairs will flip back over after a short delay.
          Your speed and move count will automatically adjust your next round's difficulty!
        </p>
      </header>

      <section className="stats-bar">
        <span><strong>Level:</strong> {state.level.toUpperCase()}</span>
        <span><strong>Moves:</strong> {state.moves}</span>
        <span><strong>Pairs:</strong> {state.pairs} / {LEVELS[state.level].pairs}</span>
        <span><strong>Time:</strong> {activeElapsedSeconds}s</span>
        <button className="btn-secondary" onClick={handleRestart}>Restart</button>
      </section>

      <main>
        <div
          className="card-grid"
          style={{ gridTemplateColumns: `repeat(${LEVELS[state.level].columns}, 1fr)` }}
        >
          {state.cards.map((card) => (
            <button
              key={card.id}
              className={`card ${card.faceUp ? 'face-up' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              {card.faceUp || card.matched ? card.symbol : '?'}
            </button>
          ))}
        </div>

        {winSummary && (
          <section className="result-panel">
            <h2>Round Won! 🎉</h2>
            <p>Completed in <strong>{state.moves} moves</strong> and <strong>{winSummary.seconds} seconds</strong>.</p>
            <p className="reason-text">{winSummary.reason}</p>
            <div className="button-group">
              <button className="btn-primary" onClick={handlePlayNextRound}>
                Play next round ({winSummary.nextLevel.toUpperCase()})
              </button>
              <button className="btn-secondary" onClick={handleReplayLevel}>
                Replay this level
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="history-section">
        <h3>Recent Games (Last 5)</h3>
        {savedHistory.length === 0 ? (
          <p className="empty-text">No completed rounds saved yet.</p>
        ) : (
          <ul className="history-list">
            {savedHistory.slice(0, 5).map((item, index) => (
              <li key={index} className="history-item">
                <span>{item.finishedAt} — <strong>{item.level.toUpperCase()}</strong>: {item.moves} moves, {item.seconds}s</span>
                <span className="history-reason">Next: {item.nextLevel.toUpperCase()} ({item.reason})</span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </div>
  );
}
