# IMPLEMENTATION_PHASE3.md — Functional Board Rendering and Basic Interaction

> **Status**: Blueprint — do not implement until reviewed.
> **Depends on**: Phase 2 complete; `window.Game` API stable.
> **Delivers**: A fully playable game with no visual polish — colored CSS divs only. Win, loss, flagging, mine counter, and New Game all work correctly.

---

## 1. Architectural Design

### 1.1 Module Boundary

Phase 3 introduces a single new file: `render.js`. Its exclusive responsibility is **DOM mutation**. All game logic remains in `game.js`. The contract between the two modules is the `window.Game` API.

```
game.js  ─── window.Game ──▶  render.js
  (logic)                       (DOM)
```

`render.js` calls `Game.getBoard()`, `Game.getGamePhase()`, and `Game.getMineCount()` as read-only data sources. It calls `Game.revealTile()`, `Game.toggleFlag()`, `Game.newGame()` as commands. It never reads internal module state directly.

### 1.2 render() Contract

`render()` is a **pure state-to-DOM projection** — given the same game state it always produces the same DOM result. It has no side effects beyond DOM mutation. It does not call `newGame()` or any game-mutating functions.

```
render() ─reads─▶ Game.getBoard()      → Array<TileCopy>
         ─reads─▶ Game.getGamePhase()  → 'idle'|'active'|'won'|'lost'
         ─reads─▶ Game.getMineCount()  → number
         ─writes─▶ .tile class/dataset/textContent (100 elements)
         ─writes─▶ document.body classList
         ─writes─▶ #mine-counter textContent
         ─writes─▶ #aria-announcer textContent (only on phase transition)
```

### 1.3 Visual State Derivation

The game logic tile has three states (`hidden`, `revealed`, `flagged`). The renderer maps this to six **visual states** by combining tile state with `gamePhase` and `isMine`:

| tile.state | gamePhase | tile.isMine | Visual state   | CSS class            |
|------------|-----------|-------------|----------------|----------------------|
| `hidden`   | any       | false       | `hidden`       | `tile--hidden`       |
| `hidden`   | `lost`    | true        | `mine`         | `tile--mine`         |
| `flagged`  | any       | true/false  | `flagged`      | `tile--flagged`      |
| `flagged`  | `lost`    | false       | `wrong-flag`   | `tile--wrong-flag`   |
| `revealed` | any       | false       | `revealed`     | `tile--revealed`     |
| `revealed` | `lost`    | true        | `mine`         | `tile--mine`         |

> Note: the triggered mine (`tile.state === 'revealed' && tile.isMine`) and passive mines (`tile.state === 'hidden' && tile.isMine && phase === 'lost'`) both map to `tile--mine`. Phase 4/5 will distinguish them via `data-triggered="true"`. In Phase 3 there are no sprites, so both render identically.

The visual state derivation function (pure, no DOM access):

```javascript
function _visualState(tile, phase) {
  if (tile.state === 'revealed') return tile.isMine ? 'mine' : 'revealed';
  if (tile.state === 'flagged')  return (phase === 'lost' && !tile.isMine) ? 'wrong-flag' : 'flagged';
  // hidden
  return (phase === 'lost' && tile.isMine) ? 'mine' : 'hidden';
}
```

### 1.4 Data Attributes on Tile Elements

After `render()`, every `.tile` element has:

| Attribute      | Value                                               | Purpose                            |
|----------------|-----------------------------------------------------|------------------------------------|
| `data-row`     | 0–9 (set by `buildGrid()`, never changed)           | Row lookup in event handlers       |
| `data-col`     | 0–9 (set by `buildGrid()`, never changed)           | Col lookup in event handlers       |
| `data-state`   | visual state string (`hidden`, `revealed`, `mine`, …) | CSS hooks; Phase 4 number styling  |
| `data-count`   | adjacentCount (0–8; always set even on mines/flags) | Phase 4 number color rules         |

### 1.5 Event Listener Architecture

All tile events use **event delegation on `#grid`** — one listener per event type rather than 100 listeners. This scales correctly and makes removal/re-registration trivial if needed in later phases.

```
#grid  ──click──▶  handleClick(e)    → e.target.closest('.tile') → revealTile
       ──contextmenu──▶  handleRightClick(e)  → toggleFlag; e.preventDefault()
#mascot ──click──▶  handleNewGame()  → Game.newGame(); render()
```

**Critical scoping rule**: `contextmenu` listener is on `#grid`, NOT on `document` or `body`. This ensures the context menu is suppressed only when right-clicking within the grid, not elsewhere on the page.

### 1.6 Input Lock Mechanism

Grid input is locked on win/loss via CSS `pointer-events: none` on `#grid` when `body.state--win` or `body.state--loss`. This is the single source of truth for locking — no JS `if (phase === …)` guards are needed in the event handlers (the events simply never fire). The mascot `#mascot` is outside `#grid` so its events are unaffected.

```css
body.state--win #grid,
body.state--loss #grid {
  pointer-events: none;
}
```

### 1.7 ARIA Announcement Strategy

The `#aria-announcer` (`aria-live="polite"`) announces only on phase **transitions**. It is cleared when `newGame()` is called. The transition check uses the body class state _before_ the class toggle in render():

```javascript
const alreadyWon  = document.body.classList.contains('state--win');
const alreadyLost = document.body.classList.contains('state--loss');

// … toggle classes …

if (phase === 'won'  && !alreadyWon)  announcer.textContent = 'You win! Board cleared.';
if (phase === 'lost' && !alreadyLost) announcer.textContent = 'Game over! You hit a mine.';
```

### 1.8 Script Loading Order

Both `game.js` and `render.js` use the `defer` attribute. With `defer`:

1. Both scripts execute (in document order) after HTML is fully parsed.
2. DOMContentLoaded fires after all `defer` scripts have executed.
3. Both scripts register `DOMContentLoaded` listeners.
4. The listeners fire in registration order: game.js first (`newGame()`, `buildGrid()`), render.js second (`render()`, event wiring).

This guarantees `window.Game` exists and the 100 tile `<div>` elements exist before `render()` is called for the first time.

---

## 2. File-Level Strategy

### 2.1 Files to Create

| File        | Responsibility                                                                 |
|-------------|--------------------------------------------------------------------------------|
| `render.js` | `render()` function; `_visualState()` helper; all DOM event wiring; DOMContentLoaded init |

### 2.2 Files to Modify

| File         | Change                                                               | Lines affected       |
|--------------|----------------------------------------------------------------------|----------------------|
| `index.html` | Add `<script defer src="render.js"></script>` after `game.js` line  | Line 22 (after game.js) |
| `style.css`  | Add 6 tile state classes + body state classes + pointer-events lock  | Append to existing   |

### 2.3 Files NOT to Modify

| File      | Reason                                                                  |
|-----------|-------------------------------------------------------------------------|
| `game.js` | Phase 2 logic is complete. `window.Game` API is the stable contract. The existing `DOMContentLoaded` in `game.js` calls `newGame()` and `buildGrid()` — this is untouched. |

---

## 3. Atomic Execution Steps

### Step 3.1 — Create render.js with render() as pure state-to-DOM projection

**Plan**

Create `render.js` with the `render()` function. It reads game state and writes the DOM. No logic, no side effects beyond DOM.

**Act**

Create `/home/maarten/stack/pxl-sweeper-afx42/render.js` with the full scaffolding from §6.

**Validate**

- `grep -n "Game\." render.js | grep -v "window\.Game"` — all Game calls are `Game.*()` calls (no window.Game re-assignment).
- `grep -n "newGame\|revealTile\|toggleFlag" render.js` — must return 0 hits (render.js does not call game-mutating functions; only event handlers do).
- File must contain exactly one function named `render`.

---

### Step 3.2 — Add data-state and data-count attributes to tile elements in render()

**Plan**

Inside `render()`'s tile loop, set `el.dataset.state` and `el.dataset.count` on each tile element after computing the visual state.

**Act**

Ensure the tile loop inside `render()` includes:
```javascript
el.dataset.state = vs;
el.dataset.count = tile.adjacentCount;
```

**Validate**

Open DevTools → inspect any tile after page load. Confirm:
```javascript
document.querySelector('.tile').dataset.state  // 'hidden'
document.querySelector('.tile').dataset.count  // '0'
```

---

### Step 3.3 — Render tile state as CSS classes: tile--hidden, tile--revealed, tile--flagged

**Plan**

`render()` sets `el.className = 'tile tile--' + vs` (where `vs` is the visual state). Add corresponding CSS rules to `style.css`.

**Act**

In `style.css` append:
```css
.tile--hidden    { background: var(--color-peach); }
.tile--revealed  { background: #e8d8c0; }       /* flat, slightly darker */
.tile--flagged   { background: var(--color-peach); }  /* same as hidden for now */
.tile--mine      { background: #f4827a; }        /* coral-pink for all mines in Phase 3 */
.tile--wrong-flag{ background: #f4827a; }
```

**Validate**

Console assertion after page load:
```javascript
// All tiles start hidden
document.querySelectorAll('.tile--hidden').length === 100  // true
document.querySelectorAll('.tile--revealed').length === 0  // true
```

Right-click a tile (if events are wired — do after Step 3.6):
```javascript
document.querySelector('.tile--flagged')  // not null
```

---

### Step 3.4 — Display adjacency number as text content in revealed numbered tiles

**Plan**

In the tile loop:
- If `vs === 'revealed'` and `tile.adjacentCount > 0`: set `el.textContent = tile.adjacentCount`.
- Otherwise: set `el.textContent = ''` (clear any previous content).

**Act**

```javascript
el.textContent = (vs === 'revealed' && tile.adjacentCount > 0) ? tile.adjacentCount : '';
```

**Validate**

Left-click a numbered tile (after events are wired). The tile must show a digit. Empty tiles must show no text. `document.querySelector('.tile--revealed').textContent` should be `''` for a zero-count tile.

---

### Step 3.5 — Update mine counter display after every action

**Plan**

`render()` sets `#mine-counter` text content to `Game.getMineCount()`.

**Act**

```javascript
document.getElementById('mine-counter').textContent = Game.getMineCount();
```

Called unconditionally on every `render()` invocation.

**Validate**

Initial render: mine counter reads `15`. After right-clicking 3 tiles: reads `12`. After right-clicking one of those 3 again (toggle off): reads `13`. After right-clicking 16 tiles: reads `-1`.

---

### Step 3.6 — Wire left-click → revealTile(), re-render

**Plan**

Add a delegated `'click'` listener on `#grid`. Extract `data-row`/`data-col` from the clicked `.tile` element. Call `Game.revealTile(row, col)` then `render()`.

**Act**

In the render.js DOMContentLoaded:
```javascript
document.getElementById('grid').addEventListener('click', e => {
  const tile = e.target.closest('.tile');
  if (!tile) return;
  const row = parseInt(tile.dataset.row, 10);
  const col = parseInt(tile.dataset.col, 10);
  Game.revealTile(row, col);
  render();
});
```

Note: no phase guard needed in JS — `Game.revealTile` returns `{ type: 'noop' }` for won/lost, and the CSS `pointer-events: none` prevents the event from firing anyway.

**Validate**

- Left-clicking a hidden tile changes it to `tile--revealed`. 
- Left-clicking an already-revealed tile does nothing (no error, no state change).
- Left-clicking a flagged tile does nothing (tile stays flagged).
- An empty tile triggers flood fill: multiple tiles revealed simultaneously.

---

### Step 3.7 — Wire right-click → toggleFlag(), preventDefault, re-render

**Plan**

Add a delegated `'contextmenu'` listener on `#grid`. Call `e.preventDefault()` unconditionally (this suppresses the context menu when right-clicking anywhere on the grid, even on non-tile areas). Then extract tile, call `Game.toggleFlag()`, call `render()`.

**Act**

```javascript
document.getElementById('grid').addEventListener('contextmenu', e => {
  e.preventDefault();
  const tile = e.target.closest('.tile');
  if (!tile) return;
  const row = parseInt(tile.dataset.row, 10);
  const col = parseInt(tile.dataset.col, 10);
  Game.toggleFlag(row, col);
  render();
});
```

**Validate**

- Right-clicking a hidden tile → `tile--flagged` class applied, mine counter decreases by 1.
- Right-clicking a flagged tile → returns to `tile--hidden`, mine counter increases by 1.
- Right-clicking a revealed tile → nothing changes.
- Right-clicking the mascot button (outside grid) → browser context menu DOES appear.
- Right-clicking outside the grid entirely → browser context menu appears.

---

### Step 3.8 — Wire mascot button → newGame(), render()

**Plan**

Add a `'click'` listener on `#mascot`. Call `Game.newGame()`, clear the ARIA announcer, then `render()`.

**Act**

```javascript
document.getElementById('mascot').addEventListener('click', () => {
  Game.newGame();
  document.getElementById('aria-announcer').textContent = '';
  render();
});
```

**Validate**

- Click mascot mid-game: all tiles reset to `tile--hidden`, mine counter resets to 15, body state classes removed.
- Click mascot after win: same as above; `state--win` class removed from body.
- Click mascot after loss: same; `state--loss` removed.
- No console errors on any mascot click.

---

### Step 3.9 — Apply state--win / state--loss class to body on game end

**Plan**

In `render()`, toggle `state--win` and `state--loss` on `document.body`, capturing the previous state before toggling for ARIA announcement logic.

**Act**

```javascript
const alreadyWon  = document.body.classList.contains('state--win');
const alreadyLost = document.body.classList.contains('state--loss');

document.body.classList.toggle('state--win',  phase === 'won');
document.body.classList.toggle('state--loss', phase === 'lost');

const announcer = document.getElementById('aria-announcer');
if (phase === 'won'  && !alreadyWon)  announcer.textContent = 'You win! Board cleared.';
if (phase === 'lost' && !alreadyLost) announcer.textContent = 'Game over! You hit a mine.';
```

Add CSS rules in `style.css`:
```css
body.state--win  { outline: 3px solid var(--color-mint); }    /* temporary Phase 3 indicator */
body.state--loss { outline: 3px solid #f4827a; }              /* temporary Phase 3 indicator */
```

**Validate**

Trigger a loss:
```javascript
document.body.classList.contains('state--loss')  // true
document.body.classList.contains('state--win')   // false
document.getElementById('aria-announcer').textContent  // 'Game over! You hit a mine.'
```

---

### Step 3.10 — Block all grid input after win or loss (not the mascot button)

**Plan**

Add CSS rule applying `pointer-events: none` to `#grid` when body has a terminal state class.

**Act**

In `style.css`:
```css
body.state--win #grid,
body.state--loss #grid {
  pointer-events: none;
}
```

**Validate**

After loss:
```javascript
// In DevTools computed styles panel for #grid:
// pointer-events: none
getComputedStyle(document.getElementById('grid')).pointerEvents  // 'none'
getComputedStyle(document.getElementById('mascot')).pointerEvents  // 'auto'
```

Click grid after loss: no change to board state. Click mascot: game resets correctly.

---

### Step 3.11 — Add render.js to index.html

**Plan**

Add `<script defer src="render.js"></script>` after the `game.js` script tag. Order is critical: `game.js` must be first so `window.Game` is set up before `render.js`'s DOMContentLoaded runs.

**Act**

In `index.html`, change:
```html
  <script defer src="game.js"></script>
```
to:
```html
  <script defer src="game.js"></script>
  <script defer src="render.js"></script>
```

**Validate**

```javascript
// In browser console, after DOMContentLoaded:
typeof render           // 'undefined' (render is not on window)
typeof Game.newGame     // 'function'
document.querySelectorAll('.tile--hidden').length  // 100
```

---

### Step 3.12 — Manual play-through: win and loss both reachable

**Plan**

Manual verification that both game-end states are reachable and display correctly.

**Act**

**Loss path**:
1. Open `index.html` in Chrome.
2. Play until a mine is hit, OR use console to force-reveal a mine:
   ```javascript
   // Find a mine location
   const b = Game.getBoard();
   // first click to place mines
   Game.revealTile(0,0); render();
   const b2 = Game.getBoard();
   const mine = b2.findIndex(t => t.isMine && t.state !== 'revealed');
   const row = Math.floor(mine/10), col = mine%10;
   Game.revealTile(row, col); render();
   ```
3. Verify: `body.state--loss`, all mines show `tile--mine`, wrong flags show `tile--wrong-flag`, ARIA text set.

**Win path**:
1. New game, then use console:
   ```javascript
   Game.newGame(); render();
   Game.revealTile(5,5); render(); // place mines, first click
   // Reveal all non-mine tiles
   const b = Game.getBoard();
   for (let r=0; r<10; r++) for (let c=0; c<10; c++) {
     if (!b[r*10+c].isMine) { Game.revealTile(r,c); }
   }
   render();
   ```
2. Verify: `body.state--win`, ARIA text set.

**Validate**

All items in the manual verification protocol (§5.2) pass.

---

### Step 3.13 — Manual: right-click context menu suppressed on grid, not elsewhere

**Plan**

Verify `contextmenu` scoping is correct.

**Validate**

- Right-click on any `.tile`: no context menu appears.
- Right-click on the page background (outside grid): context menu appears.
- Right-click on `#mascot`: context menu appears (mascot is not in the grid).
- Right-click on `#status-bar`: context menu appears.

---

### Step 3.14 — Manual: flagged tile blocks reveal

**Validate**

1. Right-click a hidden tile: it becomes `tile--flagged`.
2. Left-click the same tile: it stays `tile--flagged` (no reveal).
3. Right-click again: it becomes `tile--hidden`.
4. Left-click: it now reveals correctly.

---

### Step 3.15 — Verify no console errors in Chrome and Firefox

**Validate**

Open DevTools Console in Chrome (and Firefox). Perform:
- Page load
- First click
- Several reveals and flags
- A loss
- A new game
- A win

Zero errors, zero warnings (warnings about deprecated APIs or favicon 404s are acceptable if present before Phase 3; do not introduce new ones).

---

## 4. Edge Case & Boundary Audit

### EC-01: getBoard() exposes isMine — security non-issue
`render.js` reads `tile.isMine` from `getBoard()` to compute visual states on loss. This is intentional; `getBoard()` is a client-side read. There is no server or cheat-prevention requirement. The data is used only on `gamePhase === 'lost'` for visual display.

### EC-02: First render before first click
`render()` is called in DOMContentLoaded after `Game.newGame()`. At this point `gamePhase === 'idle'`, all tiles are `hidden`, no mines placed. `getBoard()` returns 100 tiles with `isMine: false`. All tiles render as `tile--hidden`. Mine counter shows `15`. This is correct.

### EC-03: Flood fill renders all revealed tiles at once
`Game.revealTile()` on an empty tile runs the full BFS internally and updates all affected tiles' `state` to `'revealed'` before returning. `render()` is called once after the return. All revealed tiles are reflected in a single render pass. No incremental/animated reveal in Phase 3.

### EC-04: Right-click on a revealed tile
`Game.toggleFlag(r, c)` on a revealed tile is a no-op (game logic guard: `if (tile.state === 'revealed') return`). `render()` is still called, but nothing changes. Zero risk of error.

### EC-05: Right-click outside tile area within grid container
`#grid` may have small gaps or the click may land on the grid background between tiles. `e.target.closest('.tile')` returns `null`. The handler returns early. `Game.toggleFlag` is NOT called. `render()` is NOT called. The context menu IS suppressed (because `e.preventDefault()` is called unconditionally before the null check). This is acceptable — suppressing context menu on the grid background is expected UX.

### EC-06: Multiple rapid clicks
The game has no async operations. All state mutations are synchronous. Rapid clicks are handled sequentially. No debounce needed.

### EC-07: Mascot click during active game
`Game.newGame()` resets `gamePhase` to `'idle'` and resets all board tiles. `render()` then reflects the idle state. All tiles become `tile--hidden`. Body state classes are removed. Mine counter resets to 15. The ARIA announcer is cleared. No stale state can persist.

### EC-08: wrong-flag rendering
`tile--wrong-flag` is only assigned when `phase === 'lost' && tile.state === 'flagged' && !tile.isMine`. A correctly flagged mine (`state === 'flagged' && isMine === true`) renders as `tile--flagged` even on loss. This is correct — only *incorrect* flags get the wrong-flag class.

### EC-09: Mine counter negative value
`Game.getMineCount()` returns `MINE_COUNT - flags` unclamped. With 16 flags placed, `getMineCount()` returns `-1`. `render()` sets `#mine-counter.textContent = -1`. This is correct per requirements §7.4 and §8.4. No additional handling needed.

### EC-10: render() called idempotently
Calling `render()` twice in a row produces the same DOM. There is no state that accumulates across calls. This is critical for the mascot button behavior — calling `newGame()` then `render()` always produces a clean board.

### EC-11: tile--mine class on loss for hidden mine tiles
When the game is lost, mines whose `state` is still `'hidden'` (never revealed by the player) must be shown. The visual state logic maps `tile.state === 'hidden' && tile.isMine && phase === 'lost'` → `'mine'`. The CSS for `tile--mine` distinguishes these tiles visually. In Phase 3, both triggered and passive mines share the same class — Phase 4/5 adds `data-triggered` to distinguish them.

### EC-12: DOMContentLoaded order guarantee
`render.js`'s DOMContentLoaded fires after `game.js`'s because `game.js` is listed first and with `defer` scripts, listeners register in script execution order. However, this guarantee relies on both scripts using `defer` (not `async`) and `game.js` being listed first in HTML. If either condition changes, the boot sequence breaks. The blueprint locks both scripts to `defer` in document order.

### EC-13: `closest('.tile')` on nested elements
If future phases add child elements inside `.tile` (e.g., sprite divs), `e.target` could be a child, not the `.tile` itself. `e.target.closest('.tile')` handles this correctly — it traverses up the DOM tree. Phase 3 tiles have no children (only text content), but this pattern is future-safe.

### EC-14: parseInt with radix
`parseInt(tile.dataset.row, 10)` and `parseInt(tile.dataset.col, 10)` — always use radix 10. `dataset.row` is a string like `"0"` which is fine, but `"08"` or `"09"` would be misinterpreted as octal without radix. Row/col values 0–9 are safe, but the explicit radix is a correctness invariant.

---

## 5. Verification Protocol

### 5.1 Grep/Static Checks

Run after creating render.js, before opening in browser:

```bash
# G1: render.js must not contain 'document' in the logic section (only in event wiring)
# Just a sanity check — render.js IS a DOM file, so DOM access is expected.
# Instead, check that game logic is NOT duplicated in render.js:
grep -n "_placeMines\|_floodFill\|_calcAdjacency\|_checkWin" render.js
# Expected: 0 lines

# G2: contextmenu listener must be on #grid, not document or window
grep -n "contextmenu" render.js
# Expected: exactly 1 hit; must contain 'grid'

# G3: game.js must not be modified
git diff game.js
# Expected: empty (no changes to game.js)

# G4: render.js exports nothing on window
grep -n "window\." render.js
# Expected: 0 hits (render.js does not pollute window)

# G5: Both script tags present and in correct order in index.html
grep -n "script" index.html
# Expected: game.js appears before render.js; both have defer

# G6: pointer-events lock present in CSS
grep -n "pointer-events" style.css
# Expected: 1+ hits with 'none' value

# G7: body state classes toggled in render()
grep -n "state--win\|state--loss" render.js
# Expected: 4+ hits (2 toggle calls, 2 ARIA checks)
```

### 5.2 Console Assertion Blocks

Open `index.html` in browser, open DevTools Console, paste each block:

**Block C1 — Initial DOM state after load**
```javascript
const assert = (label, val) => console.log(val ? `✓ ${label}` : `✗ FAIL: ${label}`);

assert('100 tiles exist', document.querySelectorAll('.tile').length === 100);
assert('All tiles hidden on load', document.querySelectorAll('.tile--hidden').length === 100);
assert('No revealed tiles on load', document.querySelectorAll('.tile--revealed').length === 0);
assert('Mine counter shows 15', document.getElementById('mine-counter').textContent === '15');
assert('No body state class', !document.body.classList.contains('state--win') && !document.body.classList.contains('state--loss'));
assert('data-state is hidden on tile[0]', document.querySelector('.tile').dataset.state === 'hidden');
assert('data-count is 0 on tile[0]', document.querySelector('.tile').dataset.count === '0');
```

**Block C2 — Reveal and flag**
```javascript
const assert = (label, val) => console.log(val ? `✓ ${label}` : `✗ FAIL: ${label}`);

// Simulate a left click on tile (5,5)
Game.revealTile(5, 5);
render();
assert('Phase is active after first reveal', Game.getGamePhase() === 'active');
assert('At least 1 tile revealed', document.querySelectorAll('.tile--revealed').length >= 1);
assert('No mine-counter change if no flags', document.getElementById('mine-counter').textContent === '15');

// Flag a hidden tile
const hiddenTile = document.querySelector('.tile--hidden');
const r = parseInt(hiddenTile.dataset.row, 10);
const c = parseInt(hiddenTile.dataset.col, 10);
Game.toggleFlag(r, c);
render();
assert('One flagged tile', document.querySelectorAll('.tile--flagged').length === 1);
assert('Mine counter decremented', document.getElementById('mine-counter').textContent === '14');

// Un-flag it
Game.toggleFlag(r, c);
render();
assert('No flagged tiles after toggle', document.querySelectorAll('.tile--flagged').length === 0);
assert('Mine counter restored', document.getElementById('mine-counter').textContent === '15');
```

**Block C3 — Reveal flagged tile (must be no-op)**
```javascript
const assert = (label, val) => console.log(val ? `✓ ${label}` : `✗ FAIL: ${label}`);

Game.newGame();
render();
const hiddenTile = document.querySelector('.tile--hidden');
const r = parseInt(hiddenTile.dataset.row, 10);
const c = parseInt(hiddenTile.dataset.col, 10);
Game.toggleFlag(r, c);
render();
assert('Tile is flagged', hiddenTile.classList.contains('tile--flagged'));
Game.revealTile(r, c); // must be noop
render();
assert('Tile still flagged after left-click', hiddenTile.classList.contains('tile--flagged'));
```

**Block C4 — Loss state**
```javascript
const assert = (label, val) => console.log(val ? `✓ ${label}` : `✗ FAIL: ${label}`);

Game.newGame(); render();
Game.revealTile(5, 5); render(); // place mines
const b = Game.getBoard();
const mineIdx = b.findIndex(t => t.isMine);
const mr = Math.floor(mineIdx / 10), mc = mineIdx % 10;
Game.revealTile(mr, mc); render();

assert('Phase is lost', Game.getGamePhase() === 'lost');
assert('body has state--loss', document.body.classList.contains('state--loss'));
assert('body does NOT have state--win', !document.body.classList.contains('state--win'));
assert('Mine tiles rendered', document.querySelectorAll('.tile--mine').length >= 1);
assert('ARIA announcer has text', document.getElementById('aria-announcer').textContent.length > 0);
assert('Grid pointer-events none', getComputedStyle(document.getElementById('grid')).pointerEvents === 'none');
assert('Mascot pointer-events auto', getComputedStyle(document.getElementById('mascot')).pointerEvents === 'auto');
```

**Block C5 — Win state**
```javascript
const assert = (label, val) => console.log(val ? `✓ ${label}` : `✗ FAIL: ${label}`);

Game.newGame(); render();
Game.revealTile(5, 5); render();
const b = Game.getBoard();
for (let r = 0; r < 10; r++) {
  for (let c = 0; c < 10; c++) {
    if (!b[r*10+c].isMine) Game.revealTile(r, c);
  }
}
render();
assert('Phase is won', Game.getGamePhase() === 'won');
assert('body has state--win', document.body.classList.contains('state--win'));
assert('body does NOT have state--loss', !document.body.classList.contains('state--loss'));
assert('ARIA announcer has text', document.getElementById('aria-announcer').textContent.length > 0);
assert('Grid locked', getComputedStyle(document.getElementById('grid')).pointerEvents === 'none');
```

**Block C6 — New Game reset**
```javascript
const assert = (label, val) => console.log(val ? `✓ ${label}` : `✗ FAIL: ${label}`);

// Start from a loss state
Game.newGame(); render();
Game.revealTile(5, 5); render();
const b = Game.getBoard();
const mineIdx = b.findIndex(t => t.isMine);
Game.revealTile(Math.floor(mineIdx/10), mineIdx%10); render();
assert('In loss state', document.body.classList.contains('state--loss'));

// Reset
Game.newGame(); render(); // simulates mascot click (minus ARIA clear)
assert('state--loss removed', !document.body.classList.contains('state--loss'));
assert('state--win removed', !document.body.classList.contains('state--win'));
assert('All tiles hidden', document.querySelectorAll('.tile--hidden').length === 100);
assert('Mine counter reset', document.getElementById('mine-counter').textContent === '15');
assert('Phase is idle', Game.getGamePhase() === 'idle');
```

**Block C7 — Mine counter negative value**
```javascript
const assert = (label, val) => console.log(val ? `✓ ${label}` : `✗ FAIL: ${label}`);

Game.newGame(); render();
const tiles = document.querySelectorAll('.tile');
// Flag 16 tiles (more than MINE_COUNT=15)
for (let i = 0; i < 16; i++) {
  const r = parseInt(tiles[i].dataset.row, 10);
  const c = parseInt(tiles[i].dataset.col, 10);
  Game.toggleFlag(r, c);
}
render();
assert('Mine counter is -1 with 16 flags', document.getElementById('mine-counter').textContent === '-1');
```

### 5.3 Manual Checks

| ID  | Check                                                                                      | Pass condition                                                |
|-----|--------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| M1  | Open `index.html` in Chrome. No console errors.                                            | Zero errors in Console tab                                    |
| M2  | Open `index.html` in Firefox. No console errors.                                           | Zero errors in Console tab                                    |
| M3  | Left-click a tile. It reveals.                                                             | Tile changes color; number or empty                           |
| M4  | Left-click an empty tile. Flood fill occurs.                                               | Multiple tiles reveal simultaneously                          |
| M5  | Right-click a tile. Context menu does NOT appear. Tile becomes flagged.                    | No browser menu; tile changes class                           |
| M6  | Right-click a flagged tile. It unflagged.                                                  | Tile returns to hidden state                                  |
| M7  | Left-click a flagged tile. Nothing happens.                                                | Tile stays flagged                                            |
| M8  | Right-click outside the grid (on page background). Context menu appears.                  | Standard browser context menu shows                           |
| M9  | Play to a mine reveal. All mines visible. Grid locked. Mascot clickable.                   | `body.state--loss` present; grid has `pointer-events: none`   |
| M10 | After loss, click mascot. Board resets. No state classes.                                  | All tiles hidden; mine counter 15; body classes removed       |
| M11 | Reach win state (reveal all non-mine tiles). Body class `state--win` applied.              | Grid locked; mascot still works                               |
| M12 | After win, click mascot. Board resets cleanly.                                             | Same as M10                                                   |
| M13 | Over-flag (place 16 flags). Mine counter shows `-1`.                                       | Negative value displayed; no error                            |
| M14 | Inspect tile in DevTools. `data-state`, `data-count`, `data-row`, `data-col` all present. | All four attributes on every `.tile` element                  |
| M15 | Right-click the mascot button. Context menu appears (not suppressed).                     | Browser context menu shows                                    |

---

## 6. Code Scaffolding

### 6.1 render.js — Complete Template

```javascript
// === RENDER ===
// Pure state-to-DOM projection. Reads from window.Game; writes to the DOM.
// Called once after every game action. No game logic here.

function _visualState(tile, phase) {
  if (tile.state === 'revealed') return tile.isMine ? 'mine' : 'revealed';
  if (tile.state === 'flagged')  return (phase === 'lost' && !tile.isMine) ? 'wrong-flag' : 'flagged';
  return (phase === 'lost' && tile.isMine) ? 'mine' : 'hidden';
}

function render() {
  const boardState = Game.getBoard();
  const phase      = Game.getGamePhase();
  const tileDivs   = document.getElementById('grid').querySelectorAll('.tile');

  // Body state classes — capture before toggling for ARIA transition detection
  const alreadyWon  = document.body.classList.contains('state--win');
  const alreadyLost = document.body.classList.contains('state--loss');

  document.body.classList.toggle('state--win',  phase === 'won');
  document.body.classList.toggle('state--loss', phase === 'lost');

  // Mine counter
  document.getElementById('mine-counter').textContent = Game.getMineCount();

  // Tiles
  boardState.forEach((tile, i) => {
    const el = tileDivs[i];
    const vs = _visualState(tile, phase);

    el.className       = 'tile tile--' + vs;
    el.dataset.state   = vs;
    el.dataset.count   = tile.adjacentCount;
    el.textContent     = (vs === 'revealed' && tile.adjacentCount > 0) ? tile.adjacentCount : '';
  });

  // ARIA announcements — only on phase transition
  const announcer = document.getElementById('aria-announcer');
  if (phase === 'won'  && !alreadyWon)  announcer.textContent = 'You win! Board cleared.';
  if (phase === 'lost' && !alreadyLost) announcer.textContent = 'Game over! You hit a mine.';
}

// === EVENT WIRING ===

document.addEventListener('DOMContentLoaded', () => {
  const grid   = document.getElementById('grid');
  const mascot = document.getElementById('mascot');

  // Left-click: reveal tile
  grid.addEventListener('click', e => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    Game.revealTile(parseInt(tile.dataset.row, 10), parseInt(tile.dataset.col, 10));
    render();
  });

  // Right-click: toggle flag (context menu suppressed on grid only)
  grid.addEventListener('contextmenu', e => {
    e.preventDefault();
    const tile = e.target.closest('.tile');
    if (!tile) return;
    Game.toggleFlag(parseInt(tile.dataset.row, 10), parseInt(tile.dataset.col, 10));
    render();
  });

  // Mascot: new game
  mascot.addEventListener('click', () => {
    Game.newGame();
    document.getElementById('aria-announcer').textContent = '';
    render();
  });

  // Initial render (board already initialised by game.js DOMContentLoaded)
  render();
});
```

### 6.2 style.css Additions

Append to the end of `style.css`:

```css
/* === Tile state classes (Phase 3) === */

.tile--hidden {
  background: var(--color-peach);
  cursor: pointer;
}

.tile--revealed {
  background: #e8d8c0;
  cursor: default;
}

.tile--flagged {
  background: var(--color-peach);
  cursor: pointer;
}

.tile--mine {
  background: #f4827a;
  cursor: default;
}

.tile--wrong-flag {
  background: #f4827a;
  cursor: default;
}

/* === Game end state indicators (Phase 3 placeholders — replaced in Phase 4) === */

body.state--win {
  outline: 3px solid var(--color-mint);
}

body.state--loss {
  outline: 3px solid #f4827a;
}

/* === Input lock on game end (grid only; mascot remains active) === */

body.state--win #grid,
body.state--loss #grid {
  pointer-events: none;
}
```

### 6.3 index.html Script Block Change

Replace:
```html
  <script defer src="game.js"></script>
```

With:
```html
  <script defer src="game.js"></script>
  <script defer src="render.js"></script>
```

---

## 7. Exit Criteria

Move to `DONE.md` only when **all** of the following are verified:

- [ ] `render.js` exists and passes all grep checks (G1–G7).
- [ ] All 7 console assertion blocks (C1–C7) pass with zero `✗ FAIL` lines.
- [ ] All 15 manual checks (M1–M15) pass.
- [ ] `render()` reads only from `window.Game`; contains no game logic.
- [ ] `contextmenu` listener is scoped to `#grid`, not `document`/`window`.
- [ ] `game.js` is unchanged (verify with `git diff game.js`).
- [ ] No console errors in Chrome or Firefox.
- [ ] `TODO.md` updated with Phase 4 entries before `DONE.md` write.
