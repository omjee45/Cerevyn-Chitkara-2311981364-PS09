# PS09 Adaptive Memory Matching Game

[![CI](https://github.com/omjee45/Cerevyn-Chitkara-2311981364-PS09/actions/workflows/ci.yml/badge.svg)](https://github.com/omjee45/Cerevyn-Chitkara-2311981364-PS09/actions/workflows/ci.yml)

---

### Candidate Information
- **Problem ID**: PS09 (Adaptive Memory Matching Game)
- **Candidate Name**: `Omjee Kumar`
- **Roll Number**: `2311981364`
- **Degree & Branch**: `<B.Tech Computer Science>`
- **Institution**: Chitkara University

---

## 1. Problem Overview

The objective of this project is to build a minimal, lightweight, zero-dependency browser-based memory matching game. The game presents players with a card grid, matches pairs of emoji cards, tracks moves and active elapsed time, blocks invalid and rapid clicks, and dynamically adapts difficulty between rounds based on performance thresholds.

### Key Capabilities
- **Seed-based reproducible shuffle**: Enables deterministic card arrangements for testing and interview demonstration using `?seed=<number>`.
- **Two difficulty levels**:
  - **Easy**: 4×4 grid (8 pairs, 16 cards), 1000 ms mismatch preview delay.
  - **Hard**: 4×6 grid (12 pairs, 24 cards), 600 ms mismatch preview delay.
- **Strict click and timer handling**: Rapid third selections are blocked during mismatches, repeated clicks on the same card or matched cards are ignored, and restarts cleanly cancel pending timers.
- **Dynamic difficulty adaptation**: Promotes or demotes level with a clear, factual explanation displaying real game statistics.
- **Anonymous session persistence**: Automatically records the last 20 completed sessions to `localStorage` without collecting user identities.

---

## 2. Approach: Why a Single Pure Reducer

All core game rules reside inside one pure JavaScript reducer function: `gameReducer(state, action)` in `src/game/reducer.js`.

### Why this design was chosen:
1. **Total Separation of Logic and Presentation**: The reducer contains zero timers, zero React hooks, and zero browser APIs. It is a deterministic mathematical state machine: `(State, Action) => NewState`.
2. **Effortless Unit Testing**: Because game rules do not depend on `setTimeout` or DOM events, every single edge case (double clicks, resolving locks, win states) can be tested synchronously in Vitest without complex timer mocking.
3. **Transparent Interview Explanation**: Any rule can be explained line-by-line in under two minutes by simply walking through the reducer's `switch` cases.
4. **React Only Renders and Times**: React acts purely as a presentation layer (`App.jsx`), managing UI buttons and running `useEffect` timers that dispatch pure actions (`FLIP`, `RESOLVE`, `RESTART`).

---

## 3. Why JavaScript

- **Assessment Guidelines**: Plain JavaScript was selected to keep the code minimal, lean, and directly runnable without build-step compilation friction.
- **Self-Documenting Code**: State shapes, actions, and card objects are documented using JSDoc type annotations at the top of `src/game/reducer.js`.
- **Test-Driven Safety**: A comprehensive suite of 16 unit tests in Vitest validates card counts, shuffle determinism, pair matching, timer cancellations, and edge cases, providing safety and reliability.

---

## 4. Setup, Run, and Test Instructions

### Environment & Package Versions
- **Node.js**: `v20.x` or higher (LTS)
- **React**: `^19.2.4`
- **Vite**: `^8.0.4`
- **Vitest**: `^2.1.9`

### Commands

Open your terminal and navigate to the project directory:

```bash
# Navigate to the project folder
cd recalla

# 1. Install dependencies
npm install

# 2. Run the test suite (16 unit tests)
npm test

# 3. Build the production bundle
npm run build

# 4. Start local development server
npm run dev
```

The game will be available at `http://localhost:5173/`.

---

## 5. Seeded Sessions (`?seed=`)

To run a reproducible session with an identical card arrangement, pass the `?seed=` query parameter in the URL:

```
http://localhost:5173/?seed=1
```

- When `?seed=1` is provided, the card layout strictly matches `sample_data/session_fixtures.json`.
- If no `seed` parameter is specified, a random 5-digit seed is generated on load.

---

## 7. Screenshots

*(Screenshots can be placed in `docs/screenshots/`)*

- **Initial Ready State**: ``
- **Active Game with Matched Pairs**: `[ Placeholder: Gameplay in progress ]`
- **Mismatch Resolution**: `[ Placeholder: Resolving state with 2 cards revealed ]`
- **Victory Modal & Adaptation Reason**: `![alt text](image.png)`
- **Hard Difficulty Board (4x6)**: `[ Placeholder: 24-card grid ]`

---

## 8. Repository Structure

```
d:\Recalla
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline (Node 20 LTS, test, build)
├── docs/
│   ├── game-rules.md          # Complete game mechanics, timing, and adaptation thresholds
│   └── azure-plan.md          # Azure Static Web Apps cloud hosting design
├── sample_data/
│   └── session_fixtures.json  # Seed 1 layout and scripted test sessions
├── recalla/                   # Application root
│   ├── src/
│   │   ├── game/
│   │   │   ├── random.js      # Mulberry32 PRNG and Fisher-Yates shuffle
│   │   │   ├── levels.js      # Grid dimensions, emoji symbols, and thresholds
│   │   │   ├── reducer.js     # Single pure reducer containing all game rules
│   │   │   ├── adapt.js       # Difficulty adaptation logic and explanation text
│   │   │   └── storage.js     # Anonymous localStorage persistence (20 item cap)
│   │   ├── App.jsx            # Single-page UI, timers, and event dispatches
│   │   ├── main.jsx           # React DOM mounting
│   │   └── index.css          # Minimal clean styling (no external CSS libraries)
│   ├── tests/
│   │   ├── game.test.js       # 10 core logic tests (rules, clicks, restarts, fixtures)
│   │   └── adapt_storage.test.js # 6 tests for adaptation cases, reasons, storage cap
│   ├── index.html             # HTML5 entry point
│   ├── package.json           # Scripts and dependencies (React, Vite, Vitest)
│   └── vite.config.js         # Vite build configuration
├── .env.example               # Declares no secrets or environment variables needed
├── .gitignore                 # Excludes node_modules, dist, and .env
└── README.md                  # Project overview and documentation
```

---

## 9. Known Limitations

- **Client Storage Only**: High scores and game history are persisted in browser `localStorage`. Scores are not shared across different devices or browsers.
- **No Sound Effects**: Kept strictly silent to minimize complexity and dependencies.
- **Accessibility**: Standard HTML button elements are used.

---
