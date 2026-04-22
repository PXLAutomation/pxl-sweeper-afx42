## Phase 1 — Project scaffold and static HTML structure ✅

**Completed**: 2026-04-22

### Deliverables
- `index.html` — full HTML skeleton with #status-bar, #mine-counter, #mascot, #grid, #aria-announcer
- `style.css` — CSS reset, :root palette variables, grid container layout, .sr-only utility
- `game.js` — constants (GRID_ROWS, GRID_COLS, MINE_COUNT), buildGrid(), window.Game stub

### Verification
- All 14 manual checks (V1–V14) passed
- All console assertions pass with zero FAIL output
- 100 tile divs confirmed in DOM
- image-rendering: pixelated confirmed on #grid and .tile
- No console errors on file:// load

### Decisions recorded
- Hidden tile base color: peach (#ffb7b2), locked as --color-peach in :root
- File split: 3-file bundle (index.html + style.css + game.js)
- Tile size: 48px, locked as --tile-size in :root

### Deferred to later phases
- Tile raised/flat visual effects → Phase 4
- Number colors and pixel font → Phase 4
- Sprite art → Phase 5
- Responsive tile scaling → Phase 4
- All event listeners except DOMContentLoaded → Phase 3

---

## Phase 2 — Core game logic (headless) ✅

**Completed**: 2026-04-22

### Deliverables
- `game.js` — complete game logic: board model, mine placement, adjacency, flood fill, win/loss detection, full public API

### Architecture
- Board: flat Array(100) of `{ state, isMine, adjacentCount }` tile objects
- Game state machine: `'idle'` → `'active'` → `'won'`/`'lost'`
- `'idle'` phase encodes first-click safety: mines placed only on first `revealTile()` call
- Mine placement: partial Fisher-Yates on eligible pool (clicked tile + ≤8 neighbors excluded)
- Flood fill: iterative BFS — no recursion, `visited` Set prevents loops
- `GameEvent` contract locked: `{ type: 'noop'|'revealed'|'win'|'loss', ... }`
- `loss` event pre-computes `allMines` and `wrongFlags` for Phase 3 renderer

### Public API on `window.Game`
- `newGame()`, `revealTile(r,c)`, `toggleFlag(r,c)`, `getMineCount()`, `getBoard()`, `getGamePhase()`

### Verification
- 162 Node.js assertions passed, 0 failures
- All grep checks passed: zero DOM refs above DOM BOOTSTRAP section
- First-click safety: 50-run loop — 0 failures (corner + interior)
- Flood fill: 20-run loop — always 1–100 tiles revealed, no hang
- Win detection: forced-reveal of all safe tiles → `{ type: 'win' }` confirmed
- Loss detection: mine reveal returns correct `allMines` (15), `wrongFlags`, `triggeredTile`
- `getMineCount` negative value (16 flags → -1) confirmed
- `getBoard()` confirmed to return copy (external mutation does not affect internal state)

### Decisions recorded
- `getBoard()` shallow copy is complete for current tile shape (3 scalar fields); note: must update to deep copy if nested objects added to tile in future phases
- `wrongFlags` excludes correctly-flagged mines — renderer distinction pre-computed in game logic

### Deferred to later phases
- DOM rendering → Phase 3
- Event wiring (click, right-click, mascot) → Phase 3
- Visual tile states → Phase 4
