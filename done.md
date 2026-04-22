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

## Phase 3 — Rendering and Interaction ✅

**Completed**: 2026-04-22

### Deliverables
- `render.js` — new file: pure state-to-DOM projection (`render()`), visual state derivation (`_visualState()`), and all DOM event wiring (DOMContentLoaded)
- `style.css` — 6 tile state classes + body win/loss indicators + pointer-events grid lock
- `index.html` — added `<script defer src="render.js"></script>` after game.js

### Architecture
- `render.js` reads exclusively from `window.Game` API; contains zero game logic
- Event delegation on `#grid` (one `click` + one `contextmenu` listener, not 100)
- `contextmenu` scoped to `#grid` only — right-click outside grid is not suppressed
- Input lock via CSS `pointer-events: none` on `body.state--win/loss #grid`; mascot unaffected
- ARIA announcements fire only on phase transition (not on every render call)
- `game.js` untouched — `window.Game` API is the stable contract

### Visual state mapping (6 states from 3 game states)
| game state | phase | isMine | CSS class         |
|------------|-------|--------|-------------------|
| hidden     | any   | false  | `tile--hidden`    |
| hidden     | lost  | true   | `tile--mine`      |
| flagged    | any   | any    | `tile--flagged`   |
| flagged    | lost  | false  | `tile--wrong-flag`|
| revealed   | any   | false  | `tile--revealed`  |
| revealed   | lost  | true   | `tile--mine`      |

### Verification
- 7 grep checks (G1–G7): all passed
- 35 Node.js assertions (custom DOM stub): 35 passed, 0 failed
  - C1: initial DOM state — all 100 tiles hidden, counter 15, no body classes, data-state/count set
  - C2: reveal and flag — phase transitions, mine counter, flag toggle
  - C3: flagged tile blocks reveal — noop confirmed
  - C4: loss state — body class, mine tiles, ARIA announcement
  - C5: win state — body class, ARIA announcement
  - C6: new game reset — all state cleared, counter reset, ARIA cleared
  - C7: mine counter negative (16 flags → -1)
  - Extra: wrong-flag rendering, ARIA one-shot (no re-announce on second render)

### Decisions recorded
- `_visualState()` is a pure function — no DOM access; maps tile+phase→visual state string
- Phase 3 mine background (#f4827a) is identical for triggered and passive mines; Phase 4/5 will distinguish via `data-triggered="true"`
- Body outline (`outline: 3px solid`) used as Phase 3 placeholder for win/loss indicator; replaced in Phase 4

### Deferred to later phases
- Raised tile effect, number colors, pixel font → Phase 4
- Flag pennant sprite, donut sprites, mascot face states → Phase 5
- Mascot surprised/win/loss state wiring → Phase 5
- Touch long-press (mobile flagging) → Phase 6
- Tile reveal animation → Phase 7

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
