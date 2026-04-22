# IMPLEMENTATION_PHASE2.md — Core Game Logic (Headless)

> **Immutable execution blueprint for Phase 2.**
> Do not deviate from this document during implementation. All scope changes must be recorded in
> `IMPLEMENTATION_PLAN.md` and a new blueprint issued before work resumes.

---

## 0. Context Snapshot

| Item | Value |
|---|---|
| Phase | 2 of 10 |
| Goal | All game logic in `game.js`, zero DOM dependency, fully testable from the browser console |
| Source of truth | `requirements.md` §2, §7, §8 |
| Depends on | Phase 1 complete (`game.js` exists, `window.Game` stub present) |
| Blocks | Phase 3 (rendering needs the stable `window.Game` API) |
| Deliverable | `game.js` only — headless, no render, no events |

---

## 1. Architectural Design

### 1.1 Board data model

The board is a **flat `Array(100)`** of tile objects — row-major order, index `r * GRID_COLS + c`.
A flat array is chosen over a 2D array because it is simpler to iterate, serialize, and copy.

```js
// Tile object shape — frozen contract used by all phases
{
  state:         'hidden' | 'revealed' | 'flagged',
  isMine:        boolean,
  adjacentCount: number   // 0–8; only meaningful when !isMine
}
```

A tile starts as `{ state: 'hidden', isMine: false, adjacentCount: 0 }`.

### 1.2 Game state machine

```
  newGame()
      │
      ▼
   'idle'  ──── revealTile() called ────▶  _placeMines()  ──▶  'active'
      │                                                              │
      │                                               ┌─────────────┤
      │                                               ▼             ▼
      │                                           'won'          'lost'
      │                                               │             │
      └───────────────── newGame() ◀─────────────────┘─────────────┘
```

```js
// Module-level mutable state (never exported directly)
let board     = [];        // Array(100) of tile objects
let gamePhase = 'idle';    // 'idle' | 'active' | 'won' | 'lost'
```

`'idle'` means mines have NOT been placed yet (first click pending).
`'active'` means mines are placed and game is in progress.
`'won'` / `'lost'` means game over — all grid input is locked.

### 1.3 `GameEvent` return-type contract

`revealTile()` always returns a `GameEvent` object. Phase 3 will pattern-match on `type` to
drive the renderer. This contract is locked here and must not change in later phases.

```js
// type: 'noop' — no state change occurred
{ type: 'noop' }

// type: 'revealed' — one or more tiles were revealed (including flood-fill)
{ type: 'revealed', tiles: [{ row, col }, ...] }

// type: 'win' — last safe tile revealed; tiles includes flood-fill chain if applicable
{ type: 'win', tiles: [{ row, col }, ...] }

// type: 'loss' — a mine was revealed
{
  type:          'loss',
  triggeredTile: { row, col },
  allMines:      [{ row, col }, ...],  // ALL mine positions (for passive reveal)
  wrongFlags:    [{ row, col }, ...]   // safe tiles that were flagged (for × indicator)
}
```

`toggleFlag()` returns `void` — it never changes game phase.

### 1.4 Public API surface (`window.Game`)

```js
window.Game = {
  newGame(),          // () → void
  revealTile(row, col), // (number, number) → GameEvent
  toggleFlag(row, col), // (number, number) → void
  getMineCount(),      // () → number  (MINE_COUNT − flags placed)
  getBoard(),          // () → Array<TileCopy>  (shallow copy, safe for Phase 3 reads)
  getGamePhase(),      // () → 'idle' | 'active' | 'won' | 'lost'
}
```

`getBoard()` returns a shallow copy of each tile object (`board.map(t => ({ ...t }))`).
Phase 3 reads this snapshot; it never mutates it. The original `board` array is private.

### 1.5 Private helper signatures

```js
// Linear index from (row, col)
function _idx(row, col) → number

// Bounds check
function _inBounds(row, col) → boolean

// All valid 8-way neighbors of (row, col) — only in-bounds positions
function _getNeighbors(row, col) → [{ row, col }, ...]

// Place MINE_COUNT mines, excluding the clicked cell and its neighbors
function _placeMines(excludeRow, excludeCol) → void

// Calculate adjacentCount for every non-mine tile (called once after _placeMines)
function _calcAdjacency() → void

// Iterative BFS flood-fill starting at (startRow, startCol)
// Reveals all connected empty (count=0) tiles and their numbered border tiles
// Does NOT reveal flagged tiles
// Returns array of all newly revealed {row, col} positions
function _floodFill(startRow, startCol) → [{ row, col }, ...]

// Returns true if all non-mine tiles are 'revealed'
function _checkWin() → boolean
```

### 1.6 Mine placement algorithm

Uses **partial Fisher-Yates** — O(eligible) time, no rejection-sampling loop, no infinite-loop
risk. With 100 tiles, ≥ 91 eligible (max exclusion is 9 tiles on an interior click), and only
15 mines needed, this is always sufficient.

```
1. Build exclusion set S: clicked tile + all valid neighbors.
2. Build pool: all indices 0–99 NOT in S.
3. Partial Fisher-Yates: for i in [0, MINE_COUNT):
     j = random integer in [i, pool.length)
     swap pool[i] ↔ pool[j]
     mark board[pool[i]].isMine = true
```

### 1.7 Flood-fill algorithm (iterative BFS)

```
queue = [startTile]
visited = Set { startIdx }

while queue not empty:
    tile = queue.shift()
    if tile.state !== 'flagged':       ← flagged tiles are never auto-revealed
        tile.state = 'revealed'
        push {row,col} to revealedList

    if tile.adjacentCount === 0:       ← only expand from empty tiles
        for each neighbor n of tile:
            if n not in visited
            AND board[n].state !== 'revealed'
            AND board[n].state !== 'flagged'
            AND !board[n].isMine:
                visited.add(n)
                queue.push(n)
return revealedList
```

The `!isMine` guard in the neighbor check is a safety net — a correctly placed mine will
never have `adjacentCount === 0` unless surrounded by no mines, which can't happen for the mine
itself. The guard is kept for defensive correctness.

---

## 2. File-Level Strategy

### `game.js` — sole file changed in Phase 2

| Section | What changes |
|---|---|
| Constants block (top) | Keep `GRID_ROWS`, `GRID_COLS`, `MINE_COUNT` unchanged |
| Module-level state | ADD: `let board`, `let gamePhase` |
| Private helpers | ADD: `_idx`, `_inBounds`, `_getNeighbors` |
| Mine placement | ADD: `_placeMines` |
| Adjacency | ADD: `_calcAdjacency` |
| Flood fill | ADD: `_floodFill` |
| Public API | ADD: `newGame`, `revealTile`, `toggleFlag`, `getMineCount`, `getBoard`, `getGamePhase` |
| DOM bootstrap | KEEP: `buildGrid()` and `DOMContentLoaded` listener unchanged |
| `window.Game` export | REPLACE `{}` with the full public API object |

**Zero `document.`, `window.location`, `element.`, or DOM API references may appear in any
function above the DOM bootstrap section.** This is verified by a grep check in the protocol.

### No other files change in Phase 2

`index.html`, `style.css`, `todo.md`, `done.md` are all touched only at the end of the phase
for documentation updates.

---

## 3. Atomic Execution Steps

Each step is **Plan → Act → Validate**. Steps must be executed in order.

---

### Step 2.1 — Add module-level state variables

**Plan**: Insert `board` and `gamePhase` immediately after the constants block. These are the
only two pieces of mutable module-level state. No other mutable state is allowed at module scope.

**Act**:
```js
// === MODULE STATE ===
let board     = [];      // Array(100) of tile objects; populated by newGame()
let gamePhase = 'idle';  // 'idle' | 'active' | 'won' | 'lost'
```

**Validate**:
- Open browser console: `typeof board === 'undefined'` → `true` (board is module-scoped, not
  on `window`). Confirm `window.board` is `undefined`.
- After `Game.newGame()` is implemented (Step 2.3), verify `board.length === 100`.

---

### Step 2.2 — Implement private geometry helpers

**Plan**: These three helpers are used by every other function. Implement them first.

**Act**:
```js
// === PRIVATE HELPERS ===

function _idx(row, col) {
  return row * GRID_COLS + col;
}

function _inBounds(row, col) {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

function _getNeighbors(row, col) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (_inBounds(nr, nc)) neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}
```

**Validate**:
```js
// Console checks after exposing helpers via window.Game (or temporarily):
console.assert(_idx(0, 0) === 0, '_idx(0,0)');
console.assert(_idx(0, 9) === 9, '_idx(0,9)');
console.assert(_idx(9, 9) === 99, '_idx(9,9)');
console.assert(_idx(1, 0) === 10, '_idx(1,0)');

console.assert(_inBounds(0, 0) === true, 'in-bounds corner');
console.assert(_inBounds(9, 9) === true, 'in-bounds far corner');
console.assert(_inBounds(-1, 0) === false, 'out-of-bounds row negative');
console.assert(_inBounds(0, 10) === false, 'out-of-bounds col overflow');

// Corner (0,0) → 3 neighbors
console.assert(_getNeighbors(0, 0).length === 3, 'corner has 3 neighbors');
// Edge (0,5) → 5 neighbors
console.assert(_getNeighbors(0, 5).length === 5, 'edge has 5 neighbors');
// Interior (5,5) → 8 neighbors
console.assert(_getNeighbors(5, 5).length === 8, 'interior has 8 neighbors');
```

---

### Step 2.3 — Implement `newGame()`

**Plan**: Reset all module state. Create 100 fresh tile objects. Do NOT place mines — mines are
deferred to the first `revealTile()` call.

**Act**:
```js
function newGame() {
  gamePhase = 'idle';
  board = Array.from({ length: GRID_ROWS * GRID_COLS }, () => ({
    state: 'hidden',
    isMine: false,
    adjacentCount: 0,
  }));
}
```

**Validate**:
```js
Game.newGame();
const b = Game.getBoard();  // implement getBoard first in Step 2.9, or validate after
console.assert(b.length === 100, 'board length');
console.assert(b.every(t => t.state === 'hidden'), 'all tiles hidden');
console.assert(b.every(t => t.isMine === false), 'no mines after newGame');
console.assert(b.every(t => t.adjacentCount === 0), 'adjacency zeroed');
console.assert(Game.getGamePhase() === 'idle', 'phase is idle');
```

---

### Step 2.4 — Implement `_placeMines(excludeRow, excludeCol)`

**Plan**: Build an exclusion set from the clicked tile and its neighbors. Build an eligible
pool from the remaining 91–97 tile indices. Use a partial Fisher-Yates shuffle to select
exactly `MINE_COUNT` positions. Mark those tile positions as `isMine: true`.

**Act**:
```js
function _placeMines(excludeRow, excludeCol) {
  const excluded = new Set();
  excluded.add(_idx(excludeRow, excludeCol));
  for (const n of _getNeighbors(excludeRow, excludeCol)) {
    excluded.add(_idx(n.row, n.col));
  }

  const pool = [];
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (!excluded.has(i)) pool.push(i);
  }

  // Partial Fisher-Yates: shuffle only the first MINE_COUNT positions
  for (let i = 0; i < MINE_COUNT; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    board[pool[i]].isMine = true;
  }
}
```

**Validate**:
```js
Game.newGame();
// Manually trigger mine placement for testing
_placeMines(5, 5);  // call private fn directly for this test only
const b = Game.getBoard();
const mines = b.filter(t => t.isMine);
console.assert(mines.length === 15, 'exactly 15 mines placed');
// Check excluded zone is clean
console.assert(!b[_idx(5, 5)].isMine,   'clicked tile is not a mine');
console.assert(!b[_idx(4, 4)].isMine,   'NW neighbor is not a mine');
console.assert(!b[_idx(4, 5)].isMine,   'N neighbor is not a mine');
console.assert(!b[_idx(5, 4)].isMine,   'W neighbor is not a mine');
// Run 50 times to check statistical correctness of placement
let allSafe = true;
for (let i = 0; i < 50; i++) {
  Game.newGame();
  _placeMines(0, 0); // corner — only 4 tiles excluded
  const board_ = Game.getBoard();
  if (board_[_idx(0, 0)].isMine || board_[_idx(0, 1)].isMine ||
      board_[_idx(1, 0)].isMine || board_[_idx(1, 1)].isMine) {
    allSafe = false; break;
  }
}
console.assert(allSafe, '50-run corner exclusion always holds');
```

---

### Step 2.5 — Implement `_calcAdjacency()`

**Plan**: Iterate every non-mine tile. Count mine neighbors. Write result into
`tile.adjacentCount`. Called once, immediately after `_placeMines`.

**Act**:
```js
function _calcAdjacency() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = board[_idx(r, c)];
      if (tile.isMine) continue;
      let count = 0;
      for (const n of _getNeighbors(r, c)) {
        if (board[_idx(n.row, n.col)].isMine) count++;
      }
      tile.adjacentCount = count;
    }
  }
}
```

**Validate**:
```js
// Deterministic test: manually set mine positions
Game.newGame();
// Place mine at (0,0) and (0,1) to test (0,2) adjacency
board[_idx(0, 0)].isMine = true;
board[_idx(0, 1)].isMine = true;
_calcAdjacency();
const b = Game.getBoard();
console.assert(b[_idx(0, 2)].adjacentCount === 1, '(0,2) borders 1 mine: (0,1)');
// (1,2) borders (0,1): that's 1 mine
console.assert(b[_idx(1, 2)].adjacentCount === 1, '(1,2) borders 1 mine');
// (1,1) borders both (0,0) and (0,1): 2 mines
console.assert(b[_idx(1, 1)].adjacentCount === 2, '(1,1) borders 2 mines');
// Mine tiles themselves: adjacentCount unchanged (stays 0 — irrelevant but consistent)
console.assert(b[_idx(0, 0)].adjacentCount === 0, 'mine adjacentCount unchanged');
```

---

### Step 2.6 — Implement `_floodFill(startRow, startCol)`

**Plan**: Iterative BFS. The queue starts with the initial tile. A `visited` Set prevents
re-queuing. A tile is added to the output list when revealed. Expansion only occurs from
empty (count=0) tiles. Flagged tiles are **never** auto-revealed. Returns the list of all
newly revealed positions.

**Act**:
```js
function _floodFill(startRow, startCol) {
  const revealed = [];
  const queue = [{ row: startRow, col: startCol }];
  const visited = new Set([_idx(startRow, startCol)]);

  while (queue.length > 0) {
    const { row, col } = queue.shift();
    const tile = board[_idx(row, col)];

    // Flagged tiles are never auto-revealed by flood fill
    if (tile.state === 'flagged') continue;

    tile.state = 'revealed';
    revealed.push({ row, col });

    // Only expand BFS from empty tiles — numbered tiles are revealed but not expanded
    if (tile.adjacentCount === 0) {
      for (const n of _getNeighbors(row, col)) {
        const ni = _idx(n.row, n.col);
        if (!visited.has(ni) && board[ni].state !== 'revealed' &&
            board[ni].state !== 'flagged' && !board[ni].isMine) {
          visited.add(ni);
          queue.push(n);
        }
      }
    }
  }

  return revealed;
}
```

**Validate**:
```js
// Construct a board with no mines → flood fill from (0,0) must reveal all 100 tiles
Game.newGame();
// Leave all isMine = false, all adjacentCount = 0 (default from newGame)
const revealed = _floodFill(0, 0);
console.assert(revealed.length === 100, 'all-empty board: flood fill reveals 100 tiles');
console.assert(Game.getBoard().every(t => t.state === 'revealed'), 'all tiles revealed');

// Verify BFS is iterative — no stack overflow possible
// (100 tiles is trivially safe, but the absence of recursion is the key invariant)
```

---

### Step 2.7 — Implement `_checkWin()`

**Plan**: A win occurs when every non-mine tile is `'revealed'`. Flagged non-mine tiles count
as un-revealed. Mine tiles can be in any state (hidden, flagged — irrelevant). This check is
called once after every reveal operation, after the BFS queue drains.

**Act**:
```js
function _checkWin() {
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (!board[i].isMine && board[i].state !== 'revealed') return false;
  }
  return true;
}
```

**Validate**:
```js
// Board where all non-mine tiles are revealed → win
Game.newGame();
board[0].isMine = true; // one mine at index 0
_calcAdjacency();
// Reveal all non-mine tiles manually
for (let i = 1; i < 100; i++) board[i].state = 'revealed';
console.assert(_checkWin() === true, 'win detected when all non-mines revealed');

// One non-mine tile still hidden → no win
board[50].state = 'hidden';
console.assert(_checkWin() === false, 'no win when a non-mine tile is hidden');

// Flagged non-mine tile → no win
board[50].state = 'flagged';
console.assert(_checkWin() === false, 'flagged non-mine does not satisfy win condition');
```

---

### Step 2.8 — Implement `revealTile(row, col)`

**Plan**: Central dispatcher. Handles all guard conditions before delegating to placement,
flood fill, or direct reveal. Always returns a `GameEvent`. The first call (gamePhase='idle')
triggers mine placement + adjacency calculation.

**Guard order** (must be in this order to prevent state corruption):
1. `gamePhase === 'won' || gamePhase === 'lost'` → return noop (input locked)
2. `!_inBounds(row, col)` → return noop (defensive; Phase 3 should never send out-of-bounds)
3. `tile.state === 'flagged'` → return noop (flagged tiles block reveal per §2.4)
4. `tile.state === 'revealed'` → return noop (already revealed per §2.4)
5. `gamePhase === 'idle'` → place mines + calc adjacency + set phase to 'active'
6. `tile.isMine` → trigger loss sequence
7. `tile.adjacentCount === 0` → flood fill
8. Otherwise → reveal single numbered tile

**Act**:
```js
function revealTile(row, col) {
  if (gamePhase === 'won' || gamePhase === 'lost') return { type: 'noop' };
  if (!_inBounds(row, col)) return { type: 'noop' };

  const tile = board[_idx(row, col)];
  if (tile.state === 'flagged') return { type: 'noop' };
  if (tile.state === 'revealed') return { type: 'noop' };

  // First click: place mines now, excluding this tile and its neighbors
  if (gamePhase === 'idle') {
    _placeMines(row, col);
    _calcAdjacency();
    gamePhase = 'active';
  }

  // Mine hit → loss
  if (tile.isMine) {
    tile.state = 'revealed';
    gamePhase = 'lost';

    const allMines = [];
    const wrongFlags = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const t = board[_idx(r, c)];
        if (t.isMine) allMines.push({ row: r, col: c });
        if (t.state === 'flagged' && !t.isMine) wrongFlags.push({ row: r, col: c });
      }
    }

    return { type: 'loss', triggeredTile: { row, col }, allMines, wrongFlags };
  }

  // Empty tile → BFS flood fill
  if (tile.adjacentCount === 0) {
    const tiles = _floodFill(row, col);
    if (_checkWin()) {
      gamePhase = 'won';
      return { type: 'win', tiles };
    }
    return { type: 'revealed', tiles };
  }

  // Numbered tile → reveal only this tile
  tile.state = 'revealed';
  if (_checkWin()) {
    gamePhase = 'won';
    return { type: 'win', tiles: [{ row, col }] };
  }
  return { type: 'revealed', tiles: [{ row, col }] };
}
```

**Validate**:
```js
// Guard: input locked after loss
Game.newGame();
Game.revealTile(5, 5); // plant mines
const b = Game.getBoard();
let minePos;
for (let r = 0; r < 10; r++) {
  for (let c = 0; c < 10; c++) {
    if (b[r*10+c].isMine) { minePos = {row:r, col:c}; break; }
  }
  if (minePos) break;
}
const lossEvent = Game.revealTile(minePos.row, minePos.col);
console.assert(lossEvent.type === 'loss', 'loss event type');
console.assert(Game.getGamePhase() === 'lost', 'phase is lost');
const afterLoss = Game.revealTile(0, 0);
console.assert(afterLoss.type === 'noop', 'input locked after loss');

// Guard: flagged tile returns noop
Game.newGame();
Game.revealTile(5, 5);
Game.toggleFlag(0, 0);
const flaggedResult = Game.revealTile(0, 0);
console.assert(flaggedResult.type === 'noop', 'flagged tile returns noop');
```

---

### Step 2.9 — Implement `toggleFlag(row, col)` and remaining API

**Plan**: `toggleFlag` flips `hidden ↔ flagged`. No-ops on revealed tiles and out-of-bounds.
No-ops on locked game phases (`won`/`lost` — per requirements §7.5, grid is fully locked).
Then implement `getMineCount`, `getBoard`, and `getGamePhase`.

**Act**:
```js
function toggleFlag(row, col) {
  if (gamePhase === 'won' || gamePhase === 'lost') return;
  if (!_inBounds(row, col)) return;
  const tile = board[_idx(row, col)];
  if (tile.state === 'revealed') return;
  tile.state = tile.state === 'flagged' ? 'hidden' : 'flagged';
}

function getMineCount() {
  let flags = 0;
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (board[i].state === 'flagged') flags++;
  }
  return MINE_COUNT - flags;
}

function getBoard() {
  return board.map(t => ({ ...t }));
}

function getGamePhase() {
  return gamePhase;
}
```

**Validate**:
```js
// toggleFlag basic cycle
Game.newGame();
Game.revealTile(5, 5); // plant mines; result ignored
Game.toggleFlag(9, 9);
console.assert(Game.getBoard()[99].state === 'flagged', 'tile flagged');
Game.toggleFlag(9, 9);
console.assert(Game.getBoard()[99].state === 'hidden', 'tile unflagged');

// toggleFlag no-op on revealed tile
const revRes = Game.revealTile(0, 0);
// (0,0) was excluded from mines; it's safe
Game.toggleFlag(0, 0); // state is 'revealed'
console.assert(Game.getBoard()[0].state === 'revealed', 'no flag on revealed tile');

// getMineCount
Game.newGame();
Game.revealTile(5, 5);
console.assert(Game.getMineCount() === 15, 'getMineCount: 0 flags');
Game.toggleFlag(9, 9);
console.assert(Game.getMineCount() === 14, 'getMineCount: 1 flag');
// Over-flagging: place 16 flags
let flagCount = 1;
outer: for (let r = 0; r < 10; r++) {
  for (let c = 0; c < 10; c++) {
    const t = Game.getBoard()[r*10+c];
    if (t.state === 'hidden' && !(r===9 && c===9)) {
      Game.toggleFlag(r, c);
      flagCount++;
      if (flagCount === 16) break outer;
    }
  }
}
console.assert(Game.getMineCount() === 15 - 16, 'getMineCount: 16 flags → -1');

// getBoard returns a copy (mutation should not affect internal board)
Game.newGame();
const snap = Game.getBoard();
snap[0].state = 'revealed'; // mutate copy
console.assert(Game.getBoard()[0].state === 'hidden', 'getBoard returns a copy');
```

---

### Step 2.10 — Wire `window.Game` export and call `newGame()` on load

**Plan**: Replace the `window.Game = {}` stub with the real API object. Also call `newGame()`
at the end of the `DOMContentLoaded` handler so the board is initialized immediately when the
page loads (Phase 3 will depend on this).

**Act** — update the `DOMContentLoaded` handler and the export:
```js
document.addEventListener('DOMContentLoaded', () => {
  newGame();   // ← ADD: initialize game state on page load
  buildGrid(); // ← keep from Phase 1
});

window.Game = {
  newGame,
  revealTile,
  toggleFlag,
  getMineCount,
  getBoard,
  getGamePhase,
};
```

**Validate**:
```js
// All six public API members are present
['newGame','revealTile','toggleFlag','getMineCount','getBoard','getGamePhase']
  .forEach(fn => console.assert(typeof window.Game[fn] === 'function', 'API: ' + fn));

// Board is initialized on page load (no explicit newGame() call needed from console)
console.assert(Game.getBoard().length === 100, 'board auto-initialized on load');
console.assert(Game.getGamePhase() === 'idle', 'phase is idle on load');
```

---

### Step 2.11 — Console verification: first-click safety (50 runs)

**Plan**: Statistically verify that `revealTile` on the first click never returns a loss event
and that the clicked tile and its neighbors are never mines.

**Act** — paste into console:
```js
let failCount = 0;
for (let i = 0; i < 50; i++) {
  Game.newGame();
  const row = Math.floor(Math.random() * 10);
  const col = Math.floor(Math.random() * 10);
  const ev = Game.revealTile(row, col);
  if (ev.type === 'loss') { failCount++; continue; }
  const b = Game.getBoard();
  // Check clicked tile and all its neighbors
  const check = [{row,col}, ..._getNeighbors(row,col)];
  for (const pos of check) {
    if (b[pos.row*10+pos.col].isMine) { failCount++; break; }
  }
}
console.assert(failCount === 0, `FAIL: ${failCount}/50 first clicks hit mine or neighbor`);
console.log('V: first-click safety — 0 failures in 50 runs');
```

**Validate**: zero `FAIL` lines in console output.

---

### Step 2.12 — Console verification: flood fill + win detection

**Plan**: Force a complete win by repeatedly revealing all non-mine tiles. Confirm the final
`revealTile` call returns `{ type: 'win' }` and `getGamePhase()` returns `'won'`.

**Act** — paste into console:
```js
Game.newGame();
Game.revealTile(5, 5); // plant mines
let winEvent = null;
let iterations = 0;
while (winEvent === null && iterations < 200) {
  iterations++;
  const b = Game.getBoard();
  let acted = false;
  for (let r = 0; r < 10 && !acted; r++) {
    for (let c = 0; c < 10 && !acted; c++) {
      const t = b[r*10+c];
      if (!t.isMine && t.state === 'hidden') {
        const ev = Game.revealTile(r, c);
        if (ev.type === 'win') winEvent = ev;
        acted = true;
      }
    }
  }
  if (!acted) break; // no more hidden non-mine tiles
}
console.assert(winEvent !== null, 'FAIL: win never triggered');
console.assert(winEvent.type === 'win', 'FAIL: last event is not win');
console.assert(Game.getGamePhase() === 'won', 'FAIL: phase is not won');
const finalB = Game.getBoard();
const unrevealed = finalB.filter(t => !t.isMine && t.state !== 'revealed');
console.assert(unrevealed.length === 0, 'FAIL: non-mine tiles still hidden after win');
console.log('V: win detection — PASS (iterations: ' + iterations + ')');
```

**Validate**: `winEvent` is found, phase is `'won'`, zero non-mine unrevealed tiles.

---

### Step 2.13 — Console verification: flood fill terminates (no infinite loop)

**Act** — paste into console:
```js
// Run 20 games; in each, do the first click and measure revealed tile count
let maxRevealed = 0;
for (let i = 0; i < 20; i++) {
  Game.newGame();
  const ev = Game.revealTile(Math.floor(Math.random()*10), Math.floor(Math.random()*10));
  if (ev.tiles) maxRevealed = Math.max(maxRevealed, ev.tiles.length);
  console.assert(Game.getBoard().filter(t=>t.state==='revealed').length <= 100,
    'FAIL run ' + i + ': more than 100 tiles revealed');
}
console.log('V: flood fill terminates — max revealed in first click: ' + maxRevealed);
```

---

### Step 2.14 — Console verification: loss detection and `wrongFlags`

**Act** — paste into console:
```js
Game.newGame();
Game.revealTile(5, 5); // plant mines
const b = Game.getBoard();

// Flag a known safe tile
let safePos;
for (let r = 0; r < 10; r++) {
  for (let c = 0; c < 10; c++) {
    if (!b[r*10+c].isMine && b[r*10+c].state === 'hidden') { safePos = {row:r,col:c}; break; }
  }
  if (safePos) break;
}
Game.toggleFlag(safePos.row, safePos.col);

// Find a mine to trigger
let minePos;
for (let r = 0; r < 10; r++) {
  for (let c = 0; c < 10; c++) {
    if (b[r*10+c].isMine) { minePos = {row:r,col:c}; break; }
  }
  if (minePos) break;
}
const lossEv = Game.revealTile(minePos.row, minePos.col);

console.assert(lossEv.type === 'loss', 'FAIL: event type');
console.assert(lossEv.allMines.length === 15, 'FAIL: allMines count');
console.assert(lossEv.wrongFlags.length >= 1, 'FAIL: wrongFlags missing safe flag');
console.assert(
  lossEv.wrongFlags.some(p => p.row === safePos.row && p.col === safePos.col),
  'FAIL: known wrong flag not in wrongFlags'
);
console.assert(
  lossEv.triggeredTile.row === minePos.row && lossEv.triggeredTile.col === minePos.col,
  'FAIL: triggeredTile mismatch'
);
console.log('V: loss detection — PASS');
```

---

### Step 2.15 — No-DOM grep check

**Act**:
```bash
grep -n "document\.\|\.getElementById\|\.querySelector\|\.innerHTML\|\.textContent\|\.classList\|\.style\." game.js
```

**Validate**: zero matches above the `// === DOM BOOTSTRAP ===` section marker.
Any match in the logic section above the bootstrap is a hard failure.

---

### Step 2.16 — Update `todo.md` and `done.md`

**Plan**: Mark all Phase 2 items as done in `todo.md`. Add Phase 3 forward-reference entries.
Write Phase 2 completion record to `done.md`.

**Exact Phase 3 entries to append to `todo.md`**:
```markdown
## Phase 3 — Rendering and Interaction

- [ ] Create render.js with render() as pure state-to-DOM projection
- [ ] Add data-state and data-count attributes to tile elements in render()
- [ ] Render tile state as CSS classes: tile--hidden, tile--revealed, tile--flagged
- [ ] Display adjacency number as text content in revealed numbered tiles
- [ ] Update mine counter display after every action
- [ ] Wire left-click → revealTile(), re-render
- [ ] Wire right-click → toggleFlag(), preventDefault, re-render
- [ ] Wire mascot button → newGame(), render()
- [ ] Apply state--win / state--loss class to body on game end
- [ ] Block all grid input after win or loss (not the mascot button)
- [ ] Manual play-through: win and loss both reachable
- [ ] Manual: right-click context menu suppressed on grid, not elsewhere
- [ ] Manual: flagged tile blocks reveal
- [ ] Verify no console errors in Chrome and Firefox
- [ ] Update todo.md with Phase 4 entries
```

---

## 4. Edge Case & Boundary Audit

| # | Failure mode | Condition | Mitigation |
|---|---|---|---|
| E1 | First click places mine on clicked tile | `_placeMines` excludion logic wrong | Exclusion set always includes `_idx(excludeRow, excludeCol)` itself — verified in Step 2.4 |
| E2 | Corner click excludes only 4 tiles, not 9 | Top-left (0,0) has 3 neighbors → exclusion = {self + 3} = 4 | `_getNeighbors` only returns in-bounds positions; pool shrinks accordingly; 15 mines always fit |
| E3 | Flood fill skips numbered border tiles | BFS expansion guard is wrong | Expansion only blocked when `adjacentCount > 0`; the tile is still **revealed**, just not expanded |
| E4 | Flood fill reveals flagged tiles | BFS does not check flag state | Guard: `tile.state === 'flagged'` causes `continue` in BFS loop — flagged tile stays flagged |
| E5 | Win fires mid-flood-fill before all tiles revealed | `_checkWin` called inside BFS loop | `_checkWin` is only called **after** `_floodFill` returns, not inside it |
| E6 | Infinite loop in flood fill | BFS queue grows unbounded | `visited` Set prevents re-queuing; guard `!board[ni].isMine` prevents mines entering queue |
| E7 | `revealTile` called with out-of-bounds args | Defensive; Phase 3 should not produce this | `_inBounds` guard returns noop immediately |
| E8 | `toggleFlag` on a revealed tile changes state | No guard on revealed state | Guard: `if (tile.state === 'revealed') return` in `toggleFlag` |
| E9 | `revealTile` on flagged tile reveals it | Missing flag guard | Guard: `if (tile.state === 'flagged') return { type: 'noop' }` — second guard in `revealTile` |
| E10 | Mine counter goes negative | > 15 flags placed | `getMineCount` returns `MINE_COUNT - flags` unclamped — correct per §7.4 ("may display negative") |
| E11 | `revealTile` called after game ends | No game-phase guard | First guard: `if (gamePhase === 'won' \|\| gamePhase === 'lost') return noop` |
| E12 | `toggleFlag` called after game ends | Per §7.5, grid locked on win/loss | First guard in `toggleFlag`: same game-phase check |
| E13 | Adjacency wrong for mine tiles | `_calcAdjacency` sets count on mines | Guard: `if (tile.isMine) continue` — mine tiles keep `adjacentCount: 0` (irrelevant but consistent) |
| E14 | `getBoard()` returns live reference | Caller mutates internal state | `board.map(t => ({ ...t }))` returns shallow copy — confirmed in Step 2.9 validation |
| E15 | `_placeMines` re-runs on second reveal | `gamePhase` not updated to 'active' | `gamePhase = 'active'` is set in `revealTile` immediately after `_placeMines` completes |
| E16 | `allMines` in loss event missing triggered mine | Loop includes it regardless | Loop iterates all 100 tiles; triggered mine's `isMine` is `true` before reveal — included |
| E17 | Incorrectly flagged mine included in `wrongFlags` | Mine tile is flagged — not a "wrong" flag | `wrongFlags` guard: `t.state === 'flagged' && !t.isMine` — mines correctly excluded |
| E18 | `newGame()` called mid-game leaves stale board | Partial board state from previous game | `newGame()` rebuilds the entire `board` array from scratch via `Array.from` |

---

## 5. Verification Protocol

### 5.1 Pre-commit grep checks (must all pass)

| ID | Command | Expected result |
|---|---|---|
| G1 | `grep -n "document\." game.js` | No matches above the `DOM BOOTSTRAP` section |
| G2 | `grep -n "getElementById\|querySelector" game.js` | No matches above `DOM BOOTSTRAP` |
| G3 | `grep -c "function " game.js` | ≥ 12 (3 from Phase 1 + 9 new functions) |
| G4 | `grep -n "window\.Game" game.js` | Exactly 1 match (the export assignment) |
| G5 | `grep -n "for.*of\|\.forEach\|\.map\|\.filter" game.js` | All uses inside named functions, not at module scope |

### 5.2 Console assertions (paste each block; must produce zero `FAIL` lines)

| ID | Assertion block | Description |
|---|---|---|
| C1 | Step 2.2 validate block | Geometry helpers correct |
| C2 | Step 2.3 validate block | `newGame()` resets correctly |
| C3 | Step 2.4 validate block | Mine placement: correct count, exclusion always holds |
| C4 | Step 2.5 validate block | Adjacency calculation correct for known layout |
| C5 | Step 2.6 validate block | Flood fill: all-empty board reveals 100 tiles |
| C6 | Step 2.7 validate block | Win check: correct true/false for various states |
| C7 | Step 2.8 validate block | `revealTile` guards: locked input, flagged tile noop |
| C8 | Step 2.9 validate block | `toggleFlag`, `getMineCount`, `getBoard` immutability |
| C9 | Step 2.10 validate block | All 6 API members present; board auto-initialized |
| C10 | Step 2.11 (50-run loop) | First-click safety: 0 failures in 50 runs |
| C11 | Step 2.12 | Win detection triggers on final reveal |
| C12 | Step 2.13 (20-run loop) | Flood fill always terminates; ≤ 100 reveals |
| C13 | Step 2.14 | Loss event: correct type, allMines, wrongFlags |

### 5.3 Manual checks

| ID | Check | Expected result |
|---|---|---|
| M1 | Open `index.html` in Chrome (file://) | No console errors on load |
| M2 | Open `index.html` in Firefox (file://) | No console errors on load |
| M3 | Console: `Game.getGamePhase()` immediately after load | `'idle'` |
| M4 | Console: `Game.getBoard().length` | `100` |
| M5 | Console: `Game.getMineCount()` before first reveal | `15` |
| M6 | Console: `Game.revealTile(5,5)` (first click) | Returns `{ type: 'revealed' | 'win' }`, never `'loss'` |
| M7 | Console: `Game.getBoard().filter(t => t.isMine).length` after M6 | `15` |
| M8 | Console: mines DO NOT appear at (5,5) or its neighbors after M6 | `Game.getBoard()[55].isMine === false` |
| M9 | Console: `Game.getGamePhase()` after M6 | `'active'` |
| M10 | `buildGrid()` still works (100 tiles in DOM) | `document.querySelectorAll('.tile').length === 100` |
| M11 | `window.Game` is not a plain `{}` any more | `typeof window.Game.revealTile === 'function'` |
| M12 | No infinite loop or hang on any console test | All console assertions complete within 1 second |

### 5.4 Exit criteria (must all pass before moving to `done.md`)

- All G1–G5 grep checks pass.
- All C1–C13 console blocks pass with zero `FAIL` output.
- All M1–M12 manual checks pass.
- `game.js` contains zero DOM API references above the `DOM BOOTSTRAP` section.
- Flood fill proof: Step 2.6's all-empty scenario reveals exactly 100 tiles.
- Win proof: Step 2.12's forced-win scenario fires `{ type: 'win' }` and `getGamePhase() === 'won'`.
- Loss proof: Step 2.14's scenario fires `{ type: 'loss' }` with correct `allMines` (length 15) and `wrongFlags`.

---

## 6. Code Scaffolding

The following is the **complete final shape of `game.js`** after Phase 2. All existing Phase 1
content is preserved; all Phase 2 additions are clearly sectioned.

```js
// === CONSTANTS ===
const GRID_ROWS  = 10;
const GRID_COLS  = 10;
const MINE_COUNT = 15;

// === MODULE STATE ===
let board     = [];      // Array(100) of tile objects
let gamePhase = 'idle';  // 'idle' | 'active' | 'won' | 'lost'

// === PRIVATE HELPERS ===

function _idx(row, col) {
  return row * GRID_COLS + col;
}

function _inBounds(row, col) {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

function _getNeighbors(row, col) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (_inBounds(nr, nc)) neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}

// === MINE PLACEMENT ===

function _placeMines(excludeRow, excludeCol) {
  const excluded = new Set();
  excluded.add(_idx(excludeRow, excludeCol));
  for (const n of _getNeighbors(excludeRow, excludeCol)) {
    excluded.add(_idx(n.row, n.col));
  }

  const pool = [];
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (!excluded.has(i)) pool.push(i);
  }

  for (let i = 0; i < MINE_COUNT; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    board[pool[i]].isMine = true;
  }
}

// === ADJACENCY ===

function _calcAdjacency() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = board[_idx(r, c)];
      if (tile.isMine) continue;
      let count = 0;
      for (const n of _getNeighbors(r, c)) {
        if (board[_idx(n.row, n.col)].isMine) count++;
      }
      tile.adjacentCount = count;
    }
  }
}

// === FLOOD FILL ===

function _floodFill(startRow, startCol) {
  const revealed = [];
  const queue = [{ row: startRow, col: startCol }];
  const visited = new Set([_idx(startRow, startCol)]);

  while (queue.length > 0) {
    const { row, col } = queue.shift();
    const tile = board[_idx(row, col)];

    if (tile.state === 'flagged') continue;

    tile.state = 'revealed';
    revealed.push({ row, col });

    if (tile.adjacentCount === 0) {
      for (const n of _getNeighbors(row, col)) {
        const ni = _idx(n.row, n.col);
        if (!visited.has(ni) && board[ni].state !== 'revealed' &&
            board[ni].state !== 'flagged' && !board[ni].isMine) {
          visited.add(ni);
          queue.push(n);
        }
      }
    }
  }

  return revealed;
}

// === WIN CHECK ===

function _checkWin() {
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (!board[i].isMine && board[i].state !== 'revealed') return false;
  }
  return true;
}

// === PUBLIC API ===

function newGame() {
  gamePhase = 'idle';
  board = Array.from({ length: GRID_ROWS * GRID_COLS }, () => ({
    state: 'hidden',
    isMine: false,
    adjacentCount: 0,
  }));
}

function revealTile(row, col) {
  if (gamePhase === 'won' || gamePhase === 'lost') return { type: 'noop' };
  if (!_inBounds(row, col)) return { type: 'noop' };

  const tile = board[_idx(row, col)];
  if (tile.state === 'flagged') return { type: 'noop' };
  if (tile.state === 'revealed') return { type: 'noop' };

  if (gamePhase === 'idle') {
    _placeMines(row, col);
    _calcAdjacency();
    gamePhase = 'active';
  }

  if (tile.isMine) {
    tile.state = 'revealed';
    gamePhase = 'lost';

    const allMines = [];
    const wrongFlags = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const t = board[_idx(r, c)];
        if (t.isMine) allMines.push({ row: r, col: c });
        if (t.state === 'flagged' && !t.isMine) wrongFlags.push({ row: r, col: c });
      }
    }

    return { type: 'loss', triggeredTile: { row, col }, allMines, wrongFlags };
  }

  if (tile.adjacentCount === 0) {
    const tiles = _floodFill(row, col);
    if (_checkWin()) {
      gamePhase = 'won';
      return { type: 'win', tiles };
    }
    return { type: 'revealed', tiles };
  }

  tile.state = 'revealed';
  if (_checkWin()) {
    gamePhase = 'won';
    return { type: 'win', tiles: [{ row, col }] };
  }
  return { type: 'revealed', tiles: [{ row, col }] };
}

function toggleFlag(row, col) {
  if (gamePhase === 'won' || gamePhase === 'lost') return;
  if (!_inBounds(row, col)) return;
  const tile = board[_idx(row, col)];
  if (tile.state === 'revealed') return;
  tile.state = tile.state === 'flagged' ? 'hidden' : 'flagged';
}

function getMineCount() {
  let flags = 0;
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (board[i].state === 'flagged') flags++;
  }
  return MINE_COUNT - flags;
}

function getBoard() {
  return board.map(t => ({ ...t }));
}

function getGamePhase() {
  return gamePhase;
}

// === DOM BOOTSTRAP (Phase 1 — do not add game logic below this line) ===

function buildGrid() {
  const grid = document.getElementById('grid');
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.row = r;
      tile.dataset.col = c;
      grid.appendChild(tile);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  newGame();
  buildGrid();
});

// === PUBLIC WINDOW EXPORT ===

window.Game = {
  newGame,
  revealTile,
  toggleFlag,
  getMineCount,
  getBoard,
  getGamePhase,
};
```

---

## 7. Implementation Notes & Traps

### 7.1 Why `queue.shift()` and not `queue.pop()`

`queue.shift()` gives BFS (FIFO). `queue.pop()` would give DFS (LIFO). Both are correct for
flood fill on this board size (100 tiles), but BFS is specified in the plan and is more
predictable for debugging. On a 100-element board there is no performance difference.

### 7.2 The `'idle'` phase is essential

Do NOT remove the `'idle'` phase or merge it with `'active'`. The two-phase design is the
entire first-click safety mechanism. If mines were placed in `newGame()` instead, first-click
safety would require a regeneration loop (rejected in §2.1 of requirements). The `'idle'`
state cleanly encodes "mines not yet placed" with zero branching overhead.

### 7.3 `getBoard()` shallow copy scope

Each tile object is `{ state, isMine, adjacentCount }` — three scalar properties.
`{ ...t }` is a complete copy. If future phases add nested objects to tiles, this must be
updated to a deep copy. Document that assumption here.

### 7.4 `wrongFlags` collects ONLY safe-tile flags

A mine that was correctly flagged appears in `allMines` but NOT in `wrongFlags`.
This matches requirements §8.5: incorrectly flagged safe tiles show an `×` indicator; correctly
flagged mines are shown as intact donuts (no `×`). The Phase 3/5 renderer depends on this
distinction being pre-computed by the game logic, not re-derived in the render layer.

### 7.5 No `'idle'` re-entry

Once `gamePhase` transitions from `'idle'` → `'active'`, `_placeMines` is never called again.
`newGame()` resets `gamePhase` back to `'idle'`, which is the only valid path to re-entry.
This invariant is implicit in the code but critical — double-calling `_placeMines` would
place 30 mines on a 100-tile board.
