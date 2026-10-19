# Game Rules and Mechanics: PS09 Adaptive Memory Matching Game

This document details all game rules, timing definitions, difficulty adaptations, and state management mechanisms implemented in the application.

---

## 1. Core Card Rules

The game is played on a grid of face-down cards containing pairs of identical emoji symbols:

1. **Card Selection (`FLIP`)**:
   - The player clicks any face-down card to reveal its emoji symbol.
   - If it is the first card of a turn, it stays face up awaiting the second pick.
   - If it is the second card of a turn, the turn counter (`moves`) increments by 1, and the two revealed cards are compared.

2. **Matching Pair**:
   - If the two symbols match, both cards transition to `matched: true` and remain permanently revealed in green.
   - The `pairs` counter increments by 1.
   - If all required pairs are matched, the game transitions to `status: 'won'` and the completion timestamp is recorded.

3. **Mismatched Pair (`RESOLVE`)**:
   - If the two symbols differ, the game enters `status: 'resolving'`.
   - Both mismatched cards stay visible for a level-specific delay (1000 ms on Easy, 600 ms on Hard) so the player can memorize their positions.
   - When the delay expires, the `RESOLVE` action flips both cards face down, and the game returns to `status: 'playing'`.

4. **Input Protection & Blocked Selections**:
   - **Third selection blocked**: While status is `'resolving'`, all card clicks are completely ignored.
   - **Repeat click blocked**: Clicking a card that is already face up is ignored and does not count as a move.
   - **Matched card blocked**: Clicking any previously matched card is ignored.
   - **Post-win blocked**: When status is `'won'`, card clicks are ignored.

---

## 2. Elapsed Active Time

**Definition:** Elapsed active time is measured exclusively while the player is actively solving the board.

- **Start Condition**: Active time begins (`startedAt`) on the player's very first card flip. Time spent on the initial screen before flipping any card is **not** counted.
- **End Condition**: Active time stops (`endedAt`) at the exact millisecond the final matching pair is flipped (`status: 'won'`).
- **Formula**:
  - `ready`: `0 ms`
  - `playing` or `resolving`: `currentTime - startedAt`
  - `won`: `endedAt - startedAt`

---

## 3. Levels Table

| Level | Grid Dimensions | Total Cards | Total Pairs | Mismatch Delay (`mismatchDelayMs`) |
| :--- | :--- | :--- | :--- | :--- |
| **Easy** (Default) | 4 columns × 4 rows | 16 | 8 pairs | 1000 ms (1.0 s) |
| **Hard** | 4 columns × 6 rows | 24 | 12 pairs | 600 ms (0.6 s) |

---

## 4. Adaptation Thresholds and Reason Strings

When a round is won, the player's performance (`moves` and active `seconds`) is evaluated against documented thresholds to decide the next difficulty. The game always displays an explanatory sentence:

| Current Level | Condition | Next Level | Reason Text Pattern |
| :--- | :--- | :--- | :--- |
| **Easy** | `moves <= 14` AND `seconds <= 60` | **Hard** (Promote) | *"You won in {moves} moves and {seconds} s. The limit to move up is 14 moves and 60 s, so the next round is Hard."* |
| **Easy** | Exceeds either threshold | **Easy** (Stay) | *"You won in {moves} moves and {seconds} s. To move up requires at most 14 moves and 60 s, so the next round stays Easy."* |
| **Hard** | `moves >= 30` OR `seconds >= 150` | **Easy** (Demote) | *"You won in {moves} moves and {seconds} s. The threshold to move down is 30 moves or 150 s, so the next round is Easy."* |
| **Hard** | Below both thresholds | **Hard** (Stay) | *"You won in {moves} moves and {seconds} s. You stayed below the demotion threshold of 30 moves and 150 s, so the next round stays Hard."* |

All thresholds are centralized in `src/game/levels.js` for easy configuration.

---

## 5. How Restart Cancels Pending Timers

Restarting a game immediately isolates the board from any previous delayed actions through two complementary safeguards:

1. **React Effect Cleanup (`clearTimeout`)**:
   - The mismatch resolution timer is created in a React `useEffect` listening to `[state.status, state.gameId, state.level]`.
   - The effect's cleanup function returns `() => clearTimeout(timerId)`. When Restart is clicked or state changes, React immediately clears the pending timeout, preventing it from executing.
2. **State `gameId` Monotonic Counter**:
   - Every `RESTART` action increments `gameId` by 1 (`state.gameId + 1`).
   - The `RESOLVE` action carries the originating `gameId`.
   - If an old timer callback ever fired, the pure `gameReducer` checks:
     `if (action.gameId !== state.gameId || state.status !== 'resolving') return state;`
   - Because the `gameId` has incremented, the stale action is immediately discarded with zero side-effects.

---

## 6. Anonymous Local Storage

Game round completions are recorded locally in the browser:

- **Storage Key**: `ps09_memory_game_results`
- **Capacity**: Capped at the last 20 completed sessions (newest first).
- **Data Attributes Recorded**:
  - `finishedAt` (localized timestamp string)
  - `level` (`'easy'` or `'hard'`)
  - `seed` (numeric shuffle seed)
  - `moves` (total pair flip attempts)
  - `pairs` (matched pairs count)
  - `seconds` (active duration)
  - `nextLevel` (adapted difficulty level)
  - `reason` (explanatory adaptation sentence)
- **Strict Anonymity**: No names, email addresses, IP addresses, or tracking identifiers are collected or stored.
- **Resilience**: Storage reads and writes are wrapped in `try/catch`. Missing, invalid, or corrupted data gracefully returns an empty list (`[]`) without crashing.

---

## 7. Seeded Reproducibility (`?seed=`)

- The application uses the **Mulberry32** 32-bit pseudo-random number generator combined with the **Fisher-Yates** shuffle algorithm.
- Providing a query parameter in the browser URL (e.g., `http://localhost:5173/?seed=1`) guarantees an identical card order every time.
- If no seed is passed in the URL, a random 5-digit integer seed is generated automatically.
