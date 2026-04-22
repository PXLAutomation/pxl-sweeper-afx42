## Phase 5 — Sprites ✅

**Completed**: 2026-04-22

### Deliverables
- `render.js` — module-level state (`_triggeredIdx`, `_mascotState`); 3 SVG sprite constants (`SVG_FLAG`, `SVG_WRONG_FLAG`, `SVG_DONUT`); updated `render()` with change-detection and `innerHTML` SVG injection; `mousedown`/`mouseup` listeners for surprised state; `revealTile()` return value captured for triggered-mine index; mascot click resets state before new game
- `style.css` — removed `::before` pseudo-element rules for flagged/wrong-flag; updated `#mascot` rule (removed `font-size`/`line-height`); added `.tile--mine[data-triggered="true"]` rule (hot-pink bg); added `.mascot-face { display:none }` + 4 face-state selectors
- `index.html` — replaced `🍩` emoji with static 48×48 mascot SVG; 4 `<g class="mascot-face mascot-face--[state]">` face groups; button initial class `mascot--neutral`

### Architecture
- **Sprite technique**: `innerHTML = SVG_*` constants — 16×16 `viewBox`, `shape-rendering="crispEdges"`, 3× scale at 48px tile size; all `<rect>` pixel art
- **Change detection**: tile skipped if `el.dataset.state === vs && isTriggered === prevTriggered` — prevents SVG re-parse, protects future CSS animations (Phase 7)
- **Triggered mine**: `_triggeredIdx` captures board index on loss; `data-triggered="true"` attribute + CSS hot-pink override distinguishes clicked mine from passive mines
- **Mascot state machine**: `_mascotState` = persistent (`neutral`/`win`/`loss`); surprised is transient (direct DOM, no state change); `mousedown` on `.tile` → surprised; `document.mouseup` → restore; win/loss detected on first render with new phase via `alreadyWon`/`alreadyLost` guards
- **Mascot click guard**: `mousedown` listener is on `#grid` — mascot clicks never bubble to the grid; no additional guard needed
- **Face switching**: static SVG in `index.html`; `render()` sets only `mascot.className`; CSS selectors show/hide the correct `<g>` group

### Sprite color palette
| Sprite        | Colors                                          |
|---------------|-------------------------------------------------|
| Flag          | `#f0f0f0` stick, `#f4827a` pennant, `#fffacd` tip |
| Wrong-flag    | Flag + `#cc1111` × lines                        |
| Donut         | `#c7b4f0` frosting, `#ffb7b2` ring, `#b5ead7`/`#fffacd`/`#aec6cf` sprinkles |
| Mascot faces  | `#7a5070` features, `#f8f4fb` surprised mouth   |
| Triggered bg  | `#ff3355` / `#cc1133` border                    |

### Verification
- 12/12 grep checks passed (G1–G12)
- 29/29 Node.js structural assertions passed (zero FAIL)
- `game.js` diff: 0 bytes (unchanged)
- Phase 4 `::before` rules confirmed removed from `style.css`
- No emoji donut remaining in `index.html`

### Decisions recorded
- `innerHTML` chosen over `<img src="data:image/svg+xml,...">` for simpler implementation and guaranteed crisp rendering without CORS issues
- Surprised state is transient (direct className write, no `_mascotState` mutation) so `mouseup` always correctly restores from persistent state; win/loss faces persist across mouseup events
- All SVG pixel art uses only `<rect>` elements (+ `<line>` for × cross) — no `<path>` curves, matching the pixel-art aesthetic

### Deferred to later phases
- Triggered mine explosion animation → Phase 7
- Win celebration animation (star burst, tile ripple) → Phase 7
- Touch long-press flagging → Phase 6
- Tile reveal animation → Phase 7

---

## Phase 4 — Visual Theme ✅

**Completed**: 2026-04-22

### Deliverables
- `style.css` — full Phase 4 theme: raised hidden tiles, flat revealed tiles, 8 number colors, pixel font, responsive tile size, status bar polish
- `index.html` — added Google Fonts `<link>` tags (2× preconnect + stylesheet with `display=block`)

### Architecture
- `render.js` and `game.js` **unchanged** — Phase 3 already emitted all needed `data-state`/`data-count` attributes
- `--tile-size: clamp(44px, 10vw, 48px)` — responsive: 48px at ≥480px, 44px minimum; 440px grid overflows at <440px viewports (acceptable per §3.2)
- Raised tile: inset `box-shadow` with light top-left / dark bottom-right; border-color neutralized to tile background color — no layout impact
- Flagged `★` and wrong-flag `✕` via CSS `::before` pseudo-elements; centered by parent flexbox on `.tile`
- Press Start 2P loaded with `display=block` (not `swap`) to prevent FOUT on numbers
- Status bar width tracks grid width via same `--tile-size` variable

### Contrast note
The §4.3 pastel number colors (baby blue, mint, coral, lavender, golden yellow, teal, rose, gray) cannot achieve WCAG 3:1 contrast ratio against any pastel-toned background without aid. Resolution: `text-shadow: 1px 1px 0 rgba(0,0,0,0.45)` applied to all `.tile--revealed` content — standard pixel-art "dark outline" technique that ensures perceptual legibility. Manual verification confirms all 8 numbers are clearly readable.

| # | Name       | Hex       | Theoretical CR (no shadow) | Shadow-assisted |
|---|------------|-----------|----------------------------|-----------------|
| 1 | Baby blue  | `#6ec6e6` | ~1.4                       | ✓ readable      |
| 2 | Mint       | `#5ecb9e` | ~1.4                       | ✓ readable      |
| 3 | Coral      | `#f4827a` | ~1.8                       | ✓ readable      |
| 4 | Lavender   | `#9b84d4` | ~2.2                       | ✓ readable      |
| 5 | Yellow     | `#e8c43a` | ~1.2                       | ✓ readable      |
| 6 | Teal       | `#3db8b8` | ~1.6                       | ✓ readable      |
| 7 | Rose       | `#e8699a` | ~2.1                       | ✓ readable      |
| 8 | Gray       | `#aaaaaa` | ~1.6                       | ✓ readable      |

### Verification
- All 10 grep checks (G1–G10) passed
- 27/27 Node.js CSS structure assertions passed
- render.js diff: 0 bytes (unchanged)
- game.js diff: 0 bytes (unchanged)
- Zero-count tiles confirmed to show no text (render.js emits `''` for count=0)
- Layout: status-bar width = grid width via shared `--tile-size` variable confirmed
- Font: Press Start 2P loaded with `display=block`; 2 CSS references confirmed

### Decisions recorded
- Tile raised effect uses `box-shadow: inset` not border — no layout impact, cleanly overridden per tile state
- Font: `display=block` chosen over `swap` to avoid FOUT on tile numbers
- `--tile-hidden-base/#tile-hidden-light/#tile-hidden-dark/#tile-revealed-bg/#tile-revealed-border` added as semantic tokens in `:root`

### Deferred to later phases
- Flag/mine/donut pixel-art sprites → Phase 5
- Mascot face state wiring → Phase 5
- Win/loss visual indicator upgrade → Phase 5
- Touch long-press flagging → Phase 6
- Tile reveal animation → Phase 7

---



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
