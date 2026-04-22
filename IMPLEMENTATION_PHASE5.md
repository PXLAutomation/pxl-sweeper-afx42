# IMPLEMENTATION_PHASE5.md — Pixel-Art Sprites: Flags, Donuts, and Mascot

> **Status**: Blueprint — do not implement until reviewed.
> **Depends on**: Phase 4 complete; tile layout and sizing are stable.
> **Delivers**: All placeholder CSS indicators replaced by pixel-art SVG sprites; mascot has four face states wired to game events; triggered mine visually distinct from passive mines.

---

## 1. Architectural Design

### 1.1 Scope Boundary

Phase 5 is **SVG pixel art + JS event wiring**. No new game logic. `game.js` is **not touched**.

Three files change:
- `render.js` — SVG constants, `_triggeredIdx`/`_mascotState` module state, updated `render()`, updated event wiring
- `style.css` — remove Phase 4 `::before` rules; add triggered-mine CSS; add mascot state CSS
- `index.html` — replace `🍩` emoji with the mascot SVG (4 face groups)

### 1.2 Sprite Technique: Inline SVG via `innerHTML`

All tile sprites (flag, wrong-flag, donut) are **SVG strings injected as `innerHTML`** on the tile `<div>` inside `render()`.

Rationale:
- Gives full pixel-art control at any resolution
- No external files; page stays < 100 KB
- Works with existing `image-rendering: pixelated` CSS on `.tile`
- The flag/donut SVGs are small constants (~300–600 bytes each); parsing overhead per render is negligible when combined with the **change-detection optimization** (§1.5)

All sprites use `viewBox="0 0 16 16"` rendered at 48 × 48 CSS px = **3× scale**. Each SVG "pixel" = one `<rect width="1" height="1">`. Anti-aliasing is suppressed via `shape-rendering="crispEdges"` on the `<svg>` element.

### 1.3 Module-Level State Added to `render.js`

```javascript
// Index of the tile the player clicked when they hit a mine (-1 if none).
let _triggeredIdx = -1;

// Persistent mascot face state: 'neutral' | 'win' | 'loss'
// (Surprised is transient — applied directly to DOM without changing this value.)
let _mascotState = 'neutral';
```

Both are reset to their defaults on every new-game action.

### 1.4 Triggered-Mine Detection Flow

The click handler captures the return value of `Game.revealTile()`:

```javascript
const evt = Game.revealTile(row, col);
if (evt.type === 'loss') {
    _triggeredIdx = row * 10 + col;
}
render();
```

Inside `render()`, the triggered mine receives `data-triggered="true"` which a CSS rule uses to paint the hot-pink background. All other `tile--mine` tiles get the intact-donut background and SVG.

On new game: `_triggeredIdx = -1` (reset in the mascot click handler before calling `render()`).

### 1.5 Change-Detection Optimization in `render()`

The previous render() called `el.textContent = …` on every tile on every render call, which is safe but unnecessary for unchanged tiles. With SVG `innerHTML`, repeated re-injection is more expensive (SVG must be parsed each time) AND will interfere with CSS animations added in Phase 7 (re-setting innerHTML resets animation state).

The fix: **skip updating a tile if its visual state has not changed.**

```javascript
boardState.forEach((tile, i) => {
    const el = tileDivs[i];
    const vs = _visualState(tile, phase);
    const isTriggered = (vs === 'mine' && i === _triggeredIdx);

    // Skip if nothing changed
    if (el.dataset.state === vs &&
        (el.dataset.triggered === 'true') === isTriggered) return;

    // … update el.className, dataset, and content …
});
```

`el.dataset.state` holds the visual state string that was last rendered. It is set on every tile update, so it is always accurate after the first `render()` call.

### 1.6 Mascot State Machine

```
Initial:   _mascotState = 'neutral'
           DOM: mascot.className = 'mascot--neutral'

mousedown on .tile:
           DOM: mascot.className = 'mascot--surprised'
           (does NOT change _mascotState — this is transient)

mouseup on document:
           DOM: mascot.className = 'mascot--' + _mascotState
           (restores from _mascotState → 'neutral' if game active,
            'win'/'loss' if game over)

revealTile → 'won':
           _mascotState = 'win'    (set inside render())
           DOM: mascot.className = 'mascot--win'

revealTile → 'lost':
           _mascotState = 'loss'   (set inside render())
           DOM: mascot.className = 'mascot--loss'

mascot click (New Game):
           _mascotState = 'neutral'
           DOM: mascot.className = 'mascot--neutral'
```

**Guard: mousedown on mascot itself must NOT trigger surprised.**
`e.target.closest('.tile')` returns `null` for clicks inside `#mascot`. The mousedown handler checks this and returns early.

### 1.7 CSS Mascot State Architecture

The mascot SVG (defined once in `index.html`) contains four `<g>` face groups:

```html
<g class="mascot-face mascot-face--neutral">…</g>
<g class="mascot-face mascot-face--surprised">…</g>
<g class="mascot-face mascot-face--win">…</g>
<g class="mascot-face mascot-face--loss">…</g>
```

CSS:
```css
.mascot-face { display: none; }
#mascot.mascot--neutral   .mascot-face--neutral   { display: block; }
#mascot.mascot--surprised .mascot-face--surprised { display: block; }
#mascot.mascot--win       .mascot-face--win       { display: block; }
#mascot.mascot--loss      .mascot-face--loss      { display: block; }
```

`render.js` manages only `mascot.className`. The SVG itself is never re-written.

### 1.8 Sprite Color Palette

| Element               | Color       | Source        |
|-----------------------|-------------|---------------|
| Flag stick + base     | `#f0f0f0`   | Off-white     |
| Flag pennant          | `#f4827a`   | §4.3 coral    |
| Flag star tip         | `#fffacd`   | Soft yellow   |
| Wrong-flag × stroke   | `#cc1111`   | Dark red      |
| Donut frosting        | `#c7b4f0`   | Lavender      |
| Donut ring            | `#ffb7b2`   | Peach         |
| Donut sprinkle 1      | `#b5ead7`   | Mint          |
| Donut sprinkle 2      | `#fffacd`   | Soft yellow   |
| Donut sprinkle 3      | `#aec6cf`   | Baby blue     |
| Mascot face features  | `#7a5070`   | Dark plum     |
| Mascot surprised mouth| `#f8f4fb`   | Page bg (open)|
| Triggered mine bg     | `#ff3355`   | Vivid hot pink|
| Triggered mine border | `#cc1133`   | Dark red-pink |

### 1.9 Sprite Pixel Art Design (16×16 grid, 3× = 48px display)

#### Flag — shape reference
```
col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
r 2: .  .  .  .  .  W  C  C  C  C  C  ★  .  .  .  .
r 3: .  .  .  .  .  W  C  C  C  C  .  .  .  .  .  .
r 4: .  .  .  .  .  W  C  C  .  .  .  .  .  .  .  .
r 5: .  .  .  .  .  W  .  .  .  .  .  .  .  .  .  .
...  .  .  .  .  .  W  .  .  .  .  .  .  .  .  .  .  (rows 6-11)
r12: .  .  .  W  W  W  W  W  .  .  .  .  .  .  .  .
```
W = `#f0f0f0`, C = `#f4827a`, ★ = `#fffacd`

#### Intact Donut — shape reference
```
col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
r 2: .  .  .  .  .  .  F  s  F  .  .  .  .  .  .  .   ← top arc (s=sprinkle)
r 3: .  .  .  .  F  F  F  F  F  F  s  F  .  .  .  .
r 4: .  .  .  F  s  F  _  _  _  F  F  F  F  .  .  .   ← _ = hole
r 5: .  .  .  F  F  _  _  _  _  _  _  F  F  .  .  .
r 6: .  .  .  P  P  _  _  _  _  _  _  P  P  .  .  .   ← peach ring starts
r 7: .  .  .  P  P  _  _  _  _  _  _  P  P  .  .  .
r 8: .  .  .  P  P  _  _  _  _  _  _  P  P  .  .  .
r 9: .  .  .  P  P  P  _  _  _  P  P  P  P  .  .  .
r10: .  .  .  .  P  P  P  P  P  P  P  P  .  .  .  .
r11: .  .  .  .  .  .  P  P  P  P  .  .  .  .  .  .   ← bottom arc
```
F = frosting (`#c7b4f0`), P = peach (`#ffb7b2`), s = sprinkle, _ = transparent hole

The triggered mine uses the same donut SVG. Its hot-pink background comes from CSS (`.tile--mine[data-triggered="true"]`).

#### Mascot — face states in 16×16 hole area (x=5–10, y=5–8)
```
Face eye/mouth positions (all within transparent hole x=5–10):

NEUTRAL:   eyes at (5,5)(6,5)(9,5)(10,5) — 2×1 dots × 2
           mouth at (6,8)(7,8)(8,8)(9,8) — flat 4px line

SURPRISED: eyes at (5,5)(6,5)(5,6)(6,6) and (9,5)(10,5)(9,6)(10,6) — 2×2 wide
           mouth at (6,7)(9,7)(7,8)(8,8) — open "O" rect minus interior

WIN:       eyes as ★ cross: top+(5,6)(6,5)(6,7)(7,6) and (9,6)(10,5)(10,7)(11,6)
           smile: (5,8)(10,8) corners + (6,9)(7,9)(8,9)(9,9) bottom arc

LOSS:      eyes as × cross: (5,5)(6,6) + (6,5)(5,6) and (9,5)(10,6) + (10,5)(9,6)
           frown: (5,8)(10,8) corners + (7,7)(8,7) middle-high
```

---

## 2. File-Level Strategy

| File         | Changes                                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------------------------|
| `render.js`  | Add SVG string constants; add `_triggeredIdx`/`_mascotState`; update `render()` with change-detection + SVG injection; capture `revealTile` return value; add `mousedown`/`mouseup` listeners; reset state on new game |
| `style.css`  | Remove `.tile--flagged::before` and `.tile--wrong-flag::before` rules; add `.tile--mine[data-triggered="true"]` rule; add 4 mascot state CSS rules |
| `index.html` | Replace `🍩` emoji with full mascot SVG; add `class="mascot--neutral"` to `#mascot` button |
| `game.js`    | **Not touched.** |

---

## 3. Atomic Execution Steps

### Step 3.1 — Implement flag sprite SVG constant in render.js

**Plan**

Add `const SVG_FLAG` at the top of `render.js` as a template-literal SVG string. The flag is a white stick, triangular coral pennant, and soft-yellow star pixel at the tip. The SVG uses `style="width:100%;height:100%"` so it fills the tile exactly.

**Act**

At the top of `render.js`, before any function definitions:
```javascript
const SVG_FLAG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="10" fill="#f0f0f0"/><rect x="3" y="12" width="5" height="1" fill="#f0f0f0"/><rect x="6" y="2" width="6" height="1" fill="#f4827a"/><rect x="6" y="3" width="4" height="1" fill="#f4827a"/><rect x="6" y="4" width="2" height="1" fill="#f4827a"/><rect x="11" y="2" width="1" height="1" fill="#fffacd"/></svg>`;
```

**Validate**

```javascript
// In DevTools console — paste the SVG_FLAG value to a temporary div
const d = document.createElement('div');
d.style = 'width:48px;height:48px;background:#ffb7b2';
d.innerHTML = SVG_FLAG_VALUE;  // paste the SVG string
document.body.appendChild(d);
// Expected: peach tile with a white stick left-center, coral triangular pennant, yellow tip pixel
```

---

### Step 3.2 — Implement wrong-flag SVG constant in render.js

**Plan**

Same flag SVG + two red `<line>` elements crossing diagonally. `stroke-width="1.5"` at 16-unit viewBox = 4.5 CSS px at 3× — clearly visible. `stroke-linecap="square"` makes line ends blocky (pixel art style). `shape-rendering="crispEdges"` is set on the `<svg>` element.

**Act**

```javascript
const SVG_WRONG_FLAG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="10" fill="#f0f0f0"/><rect x="3" y="12" width="5" height="1" fill="#f0f0f0"/><rect x="6" y="2" width="6" height="1" fill="#f4827a"/><rect x="6" y="3" width="4" height="1" fill="#f4827a"/><rect x="6" y="4" width="2" height="1" fill="#f4827a"/><rect x="11" y="2" width="1" height="1" fill="#fffacd"/><line x1="1.5" y1="1.5" x2="14.5" y2="14.5" stroke="#cc1111" stroke-width="1.5" stroke-linecap="square"/><line x1="14.5" y1="1.5" x2="1.5" y2="14.5" stroke="#cc1111" stroke-width="1.5" stroke-linecap="square"/></svg>`;
```

**Validate**

Visually: same stick and pennant as flag, but with two clearly visible red diagonal crossing lines over the whole tile.

---

### Step 3.3 — Implement intact donut SVG constant in render.js

**Plan**

Lavender frosting on the top arc (rows 2–5), peach ring on the bottom arc and sides (rows 6–11), three sprinkle pixels of distinct colors on the frosting, transparent hole in the center.

**Act**

```javascript
const SVG_DONUT = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="6" y="2" width="4" height="1" fill="#c7b4f0"/><rect x="4" y="3" width="8" height="1" fill="#c7b4f0"/><rect x="3" y="4" width="3" height="1" fill="#c7b4f0"/><rect x="10" y="4" width="3" height="1" fill="#c7b4f0"/><rect x="3" y="5" width="2" height="1" fill="#c7b4f0"/><rect x="11" y="5" width="2" height="1" fill="#c7b4f0"/><rect x="7" y="2" width="1" height="1" fill="#b5ead7"/><rect x="10" y="3" width="1" height="1" fill="#fffacd"/><rect x="4" y="4" width="1" height="1" fill="#aec6cf"/><rect x="3" y="6" width="2" height="3" fill="#ffb7b2"/><rect x="11" y="6" width="2" height="3" fill="#ffb7b2"/><rect x="3" y="9" width="3" height="1" fill="#ffb7b2"/><rect x="10" y="9" width="3" height="1" fill="#ffb7b2"/><rect x="4" y="10" width="8" height="1" fill="#ffb7b2"/><rect x="6" y="11" width="4" height="1" fill="#ffb7b2"/></svg>`;
```

**Validate**

Visually: a round donut ring with lavender frosting on top, peach body on the bottom, three small colored sprinkle pixels on the frosting, and a transparent center hole showing the tile background through it.

---

### Step 3.4 — Add _triggeredIdx and _mascotState module state to render.js

**Plan**

Add two `let` declarations at module scope, before the SVG constants. Initialize to defaults. These must be accessible from both `render()` and the event handlers via closure.

**Act**

```javascript
let _triggeredIdx = -1;
let _mascotState  = 'neutral';
```

**Validate**

```javascript
// In DevTools console after page load:
// These variables are not exposed globally, but you can verify render() behavior
// by checking that a new game starts with the mascot in neutral state:
document.getElementById('mascot').className  // 'mascot--neutral'
```

---

### Step 3.5 — Update render() with SVG injection and change detection

**Plan**

Replace the existing single `el.textContent = …` line with a block that:
1. Computes `isTriggered` for the current tile
2. Skips update if `dataset.state` and triggered flag unchanged (change detection)
3. Sets `dataset.state`, `dataset.triggered`, and tile content (text or SVG) based on visual state
4. Updates mascot class from `_mascotState` (and updates `_mascotState` on win/loss transition)

**Act**

Replace the entire `boardState.forEach(…)` block and add mascot update. Full updated `render()`:

```javascript
function render() {
  const boardState = Game.getBoard();
  const phase      = Game.getGamePhase();
  const tileDivs   = document.getElementById('grid').querySelectorAll('.tile');
  const mascot     = document.getElementById('mascot');

  const alreadyWon  = document.body.classList.contains('state--win');
  const alreadyLost = document.body.classList.contains('state--loss');

  document.body.classList.toggle('state--win',  phase === 'won');
  document.body.classList.toggle('state--loss', phase === 'lost');

  document.getElementById('mine-counter').textContent = Game.getMineCount();

  if (phase === 'won'  && !alreadyWon)  _mascotState = 'win';
  if (phase === 'lost' && !alreadyLost) _mascotState = 'loss';
  mascot.className = 'mascot--' + _mascotState;

  boardState.forEach((tile, i) => {
    const el          = tileDivs[i];
    const vs          = _visualState(tile, phase);
    const isTriggered = (vs === 'mine' && i === _triggeredIdx);
    const prevTriggered = el.dataset.triggered === 'true';

    if (el.dataset.state === vs && isTriggered === prevTriggered) return;

    el.className          = 'tile tile--' + vs;
    el.dataset.state      = vs;
    el.dataset.count      = tile.adjacentCount;
    el.dataset.triggered  = isTriggered ? 'true' : '';

    if (vs === 'revealed' && tile.adjacentCount > 0) {
      el.textContent = tile.adjacentCount;
    } else if (vs === 'flagged') {
      el.innerHTML = SVG_FLAG;
    } else if (vs === 'wrong-flag') {
      el.innerHTML = SVG_WRONG_FLAG;
    } else if (vs === 'mine') {
      el.innerHTML = SVG_DONUT;
    } else {
      el.textContent = '';
    }
  });

  const announcer = document.getElementById('aria-announcer');
  if (phase === 'won'  && !alreadyWon)  announcer.textContent = 'You win! Board cleared.';
  if (phase === 'lost' && !alreadyLost) announcer.textContent = 'Game over! You hit a mine.';
}
```

**Validate**

```javascript
// After flagging a tile, the tile's innerHTML should contain the flag SVG:
Game.newGame(); render();
const tile = document.querySelector('[data-row="3"][data-col="3"]');
Game.toggleFlag(3, 3); render();
const flagged = document.querySelector('.tile--flagged');
console.assert(flagged.innerHTML.includes('<svg'), 'flagged tile has SVG');
console.assert(flagged.innerHTML.includes('f4827a'), 'SVG contains coral color');
console.assert(flagged.dataset.state === 'flagged', 'data-state is flagged');
```

---

### Step 3.6 — Update click handler to capture revealTile return value

**Plan**

The existing click handler discards the return value of `Game.revealTile()`. Change it to capture the return value and set `_triggeredIdx` when a loss event occurs.

**Act**

Replace the existing `grid.addEventListener('click', …)` handler:

```javascript
grid.addEventListener('click', e => {
  const tile = e.target.closest('.tile');
  if (!tile) return;
  const row = parseInt(tile.dataset.row, 10);
  const col = parseInt(tile.dataset.col, 10);
  const evt = Game.revealTile(row, col);
  if (evt.type === 'loss') _triggeredIdx = row * 10 + col;
  render();
});
```

**Validate**

```javascript
// Force a loss by clicking a known mine:
// 1. Start new game, reveal a safe tile to place mines
// 2. Use getBoard() to find a mine position
// 3. Set gamePhase to 'active' and click the mine tile
// Easier: just play the game and verify the triggered mine shows hot-pink background
// In DevTools after loss:
document.querySelector('.tile--mine[data-triggered="true"]')
// Must return exactly ONE element — the tile the player clicked
document.querySelectorAll('.tile--mine[data-triggered="true"]').length  // 1
document.querySelectorAll('.tile--mine').length  // 15 (all mines shown)
```

---

### Step 3.7 — Update mascot click handler to reset state on new game

**Plan**

The existing mascot click handler calls `Game.newGame()` and `render()`. Add `_triggeredIdx = -1` and `_mascotState = 'neutral'` resets before `render()`.

**Act**

Replace the existing `mascot.addEventListener('click', …)` handler:

```javascript
mascot.addEventListener('click', () => {
  _triggeredIdx = -1;
  _mascotState  = 'neutral';
  Game.newGame();
  document.getElementById('aria-announcer').textContent = '';
  render();
});
```

**Validate**

```javascript
// After a loss, click the mascot:
// 1. data-triggered should be gone from all tiles
document.querySelectorAll('[data-triggered="true"]').length  // 0
// 2. Mascot should be in neutral state
document.getElementById('mascot').className  // 'mascot--neutral'
// 3. All tiles should be hidden
document.querySelectorAll('.tile--hidden').length  // 100
```

---

### Step 3.8 — Add mousedown/mouseup listeners for mascot surprised state

**Plan**

Add a `mousedown` listener on `#grid` that sets the mascot class to `mascot--surprised` when the mousedown target is a `.tile` element. Add a `mouseup` listener on `document` that restores the mascot class from `_mascotState`.

The `document`-level mouseup handles the case where the player clicks the tile but releases the mouse outside the grid.

The `e.target.closest('.tile')` guard in the mousedown handler prevents the surprised state when clicking the mascot button itself (which is outside `#grid`).

**Act**

Add both listeners inside `DOMContentLoaded`, after the existing click/contextmenu handlers:

```javascript
grid.addEventListener('mousedown', e => {
  if (e.target.closest('.tile')) {
    mascot.className = 'mascot--surprised';
  }
});

document.addEventListener('mouseup', () => {
  mascot.className = 'mascot--' + _mascotState;
});
```

**Validate**

```javascript
// Test 1: mousedown on a tile should show surprised face
// In DevTools: dispatch a mousedown on a tile
const t = document.querySelector('.tile--hidden');
t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
document.getElementById('mascot').className  // 'mascot--surprised'

// Test 2: subsequent mouseup should restore to neutral
document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
document.getElementById('mascot').className  // 'mascot--neutral'

// Test 3: mousedown on mascot itself should NOT show surprised
const m = document.getElementById('mascot');
m.dispatchEvent(new MouseEvent('mousedown', { bubbles: false }));
// (event does not bubble to grid, but also: clicking mascot should not trigger surprised)
// The grid's mousedown listener checks e.target.closest('.tile') → null for mascot → no surprised
document.getElementById('mascot').className  // still 'mascot--neutral'
```

---

### Step 3.9 — Remove Phase 4 ::before rules from style.css

**Plan**

The `::before` CSS rules for `.tile--flagged` and `.tile--wrong-flag` (which rendered `★` and `✕`) are now superseded by the SVG sprites injected via `innerHTML`. Leaving them in would display both the CSS pseudo-element AND the SVG, doubling the indicators.

**Act**

Remove the two `::before` blocks entirely from `style.css`:

```css
/* REMOVE these two blocks: */
.tile--flagged::before {
  content: '★';
  color: var(--color-lavender);
  font-size: calc(var(--tile-size) * 0.45);
  line-height: 1;
}

.tile--wrong-flag::before {
  content: '✕';
  color: #8b0000;
  font-size: calc(var(--tile-size) * 0.4);
  font-family: system-ui, sans-serif;
}
```

**Validate**

```javascript
// After flagging a tile, the ::before pseudo-element content must not appear alongside the SVG.
// Verify in DevTools → Elements → Computed Styles on a .tile--flagged element:
// The ::before pseudo-element should NOT exist (no content property set)
// The only visual content should be the SVG inside the element.
```

---

### Step 3.10 — Add triggered-mine CSS rule to style.css

**Plan**

A `.tile--mine[data-triggered="true"]` CSS rule sets the hot-pink background and border for the mine tile the player clicked. All other `.tile--mine` tiles retain the existing `#f4827a` coral background.

The `data-triggered` attribute is set to `"true"` in `render()` (Step 3.5). When the value is empty string (`""`), the attribute selector does not match.

**Act**

Append to `style.css` after the `.tile--mine` and `.tile--wrong-flag` blocks:

```css
.tile--mine[data-triggered="true"] {
  background:   #ff3355;
  border-color: #cc1133;
}
```

**Validate**

```javascript
// After a loss:
const triggered = document.querySelector('.tile--mine[data-triggered="true"]');
const cs = getComputedStyle(triggered);
cs.backgroundColor  // 'rgb(255, 51, 85)' — vivid hot pink
```

---

### Step 3.11 — Add mascot face CSS rules to style.css

**Plan**

Add the four CSS rules that show/hide the mascot face groups based on the `#mascot` element class. All face groups default to `display: none`; only the active state's group is shown.

**Act**

Append to `style.css`:

```css
/* === Mascot face states (Phase 5) === */
.mascot-face { display: none; }
#mascot.mascot--neutral   .mascot-face--neutral   { display: block; }
#mascot.mascot--surprised .mascot-face--surprised { display: block; }
#mascot.mascot--win       .mascot-face--win       { display: block; }
#mascot.mascot--loss      .mascot-face--loss      { display: block; }
```

Also update `#mascot` rule in style.css to remove `font-size: 32px` (the emoji size property) since the button now contains SVG, not text:

```css
#mascot {
  background: none;
  border: none;
  cursor: pointer;
  line-height: 0;  /* prevent extra space below inline SVG */
}
```

**Validate**

```javascript
// At game start:
const g = document.querySelector('#mascot .mascot-face--neutral');
getComputedStyle(g).display  // 'block'
const gs = document.querySelector('#mascot .mascot-face--surprised');
getComputedStyle(gs).display  // 'none'

// After mousedown on tile:
document.querySelector('.tile--hidden').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
getComputedStyle(document.querySelector('#mascot .mascot-face--surprised')).display  // 'block'
getComputedStyle(document.querySelector('#mascot .mascot-face--neutral')).display    // 'none'
```

---

### Step 3.12 — Replace mascot emoji with SVG in index.html

**Plan**

Replace `🍩` inside the `#mascot` button with the full mascot SVG. The button gets `class="mascot--neutral"` as the initial state. The SVG contains the donut body (frosting, ring, sprinkles — identical to the donut tile sprite) plus four `<g>` face groups.

The SVG uses `viewBox="0 0 16 16"` and is sized `48×48px` via inline style, matching tile size.

**Act**

Replace the `<button id="mascot">` line in `index.html`:

```html
<button id="mascot" class="mascot--neutral" aria-label="New Game">
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
       style="width:48px;height:48px;display:block"
       shape-rendering="crispEdges">
    <!-- Donut body: frosting (lavender) top arc -->
    <rect x="6" y="2" width="4" height="1" fill="#c7b4f0"/>
    <rect x="4" y="3" width="8" height="1" fill="#c7b4f0"/>
    <rect x="3" y="4" width="3" height="1" fill="#c7b4f0"/>
    <rect x="10" y="4" width="3" height="1" fill="#c7b4f0"/>
    <rect x="3" y="5" width="2" height="1" fill="#c7b4f0"/>
    <rect x="11" y="5" width="2" height="1" fill="#c7b4f0"/>
    <!-- Sprinkles -->
    <rect x="7" y="2" width="1" height="1" fill="#b5ead7"/>
    <rect x="10" y="3" width="1" height="1" fill="#fffacd"/>
    <rect x="4" y="4" width="1" height="1" fill="#aec6cf"/>
    <!-- Donut body: peach ring (sides + bottom) -->
    <rect x="3" y="6" width="2" height="3" fill="#ffb7b2"/>
    <rect x="11" y="6" width="2" height="3" fill="#ffb7b2"/>
    <rect x="3" y="9" width="3" height="1" fill="#ffb7b2"/>
    <rect x="10" y="9" width="3" height="1" fill="#ffb7b2"/>
    <rect x="4" y="10" width="8" height="1" fill="#ffb7b2"/>
    <rect x="6" y="11" width="4" height="1" fill="#ffb7b2"/>
    <!-- Face: Neutral — two small eyes + flat mouth -->
    <g class="mascot-face mascot-face--neutral">
      <rect x="5" y="6" width="2" height="1" fill="#7a5070"/>
      <rect x="9" y="6" width="2" height="1" fill="#7a5070"/>
      <rect x="6" y="8" width="4" height="1" fill="#7a5070"/>
    </g>
    <!-- Face: Surprised — wide eyes + open O mouth -->
    <g class="mascot-face mascot-face--surprised">
      <rect x="5" y="5" width="2" height="2" fill="#7a5070"/>
      <rect x="9" y="5" width="2" height="2" fill="#7a5070"/>
      <rect x="6" y="7" width="4" height="2" fill="#7a5070"/>
      <rect x="7" y="8" width="2" height="1" fill="#f8f4fb"/>
    </g>
    <!-- Face: Win — star eyes + big smile -->
    <g class="mascot-face mascot-face--win">
      <rect x="5" y="6" width="1" height="1" fill="#7a5070"/>
      <rect x="4" y="5" width="3" height="1" fill="#7a5070"/>
      <rect x="5" y="4" width="1" height="1" fill="#7a5070"/>
      <rect x="9" y="6" width="1" height="1" fill="#7a5070"/>
      <rect x="8" y="5" width="3" height="1" fill="#7a5070"/>
      <rect x="9" y="4" width="1" height="1" fill="#7a5070"/>
      <rect x="5" y="8" width="1" height="1" fill="#7a5070"/>
      <rect x="10" y="8" width="1" height="1" fill="#7a5070"/>
      <rect x="6" y="9" width="4" height="1" fill="#7a5070"/>
    </g>
    <!-- Face: Loss — X eyes + frown -->
    <g class="mascot-face mascot-face--loss">
      <rect x="5" y="5" width="1" height="1" fill="#7a5070"/>
      <rect x="6" y="6" width="1" height="1" fill="#7a5070"/>
      <rect x="6" y="5" width="1" height="1" fill="#7a5070"/>
      <rect x="5" y="6" width="1" height="1" fill="#7a5070"/>
      <rect x="9" y="5" width="1" height="1" fill="#7a5070"/>
      <rect x="10" y="6" width="1" height="1" fill="#7a5070"/>
      <rect x="10" y="5" width="1" height="1" fill="#7a5070"/>
      <rect x="9" y="6" width="1" height="1" fill="#7a5070"/>
      <rect x="7" y="7" width="2" height="1" fill="#7a5070"/>
      <rect x="6" y="8" width="1" height="1" fill="#7a5070"/>
      <rect x="9" y="8" width="1" height="1" fill="#7a5070"/>
    </g>
  </svg>
</button>
```

**Validate**

```javascript
// Mascot SVG is present in the button:
const mascot = document.getElementById('mascot');
console.assert(mascot.querySelector('svg') !== null, 'mascot has SVG child');
console.assert(mascot.querySelectorAll('.mascot-face').length === 4, '4 face groups present');
console.assert(mascot.className === 'mascot--neutral', 'initial class is neutral');
```

---

### Step 3.13 — Verify sprites render sharply at 1× and 2× DPR

**Plan**

`image-rendering: pixelated` is already set on `.tile` in Phase 4. The mascot SVG uses `shape-rendering="crispEdges"` on the SVG element. Visually verify sharpness.

**Act**

1. Open `index.html` in Chrome at 1× DPR (standard display).
2. Open Chrome DevTools → Rendering → Device Pixel Ratio → set to 2.
3. Inspect sprites at both DPR values.

**Validate**

- Flag: stick, pennant, and star pixel are all crisp, no blurring.
- Donut: frosting/ring boundary is crisp. Sprinkles are individual crisp dots.
- Mascot: face features are crisp at both 1× and 2× DPR.
- Wrong-flag × lines: rendered sharply (may have minor sub-pixel variation at 1× for diagonal lines; acceptable).

---

### Step 3.14 — Verify mascot button click does NOT trigger surprised state

**Plan**

The `mousedown` guard checks `e.target.closest('.tile')`. A click on `#mascot` does not target a `.tile`, so `closest('.tile')` returns `null` and the handler returns early. The `document.mouseup` handler always fires and restores `_mascotState`, which is already `'neutral'`.

**Act**

Click the mascot button repeatedly (including during a game-in-progress, win state, and loss state). Verify the mascot face does NOT flash to surprised.

**Validate**

Manual test: repeatedly click the mascot button quickly. The mascot face should change between states as expected (neutral → shows donut face on click → new game) but never flash the wide-eyed surprised face.

```javascript
// Programmatic test:
const m = document.getElementById('mascot');
// Simulate mousedown directly on the mascot's SVG child
const svg = m.querySelector('svg');
svg.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
// The event bubbles up through #mascot (not through #grid), so grid's mousedown never fires
// Mascot should still show neutral:
document.getElementById('mascot').className  // 'mascot--neutral'
```

Note: The mascot button is **outside** `#grid` in the HTML. The grid's `mousedown` listener is scoped to `#grid`, so clicks on `#mascot` never reach it regardless of `e.target.closest('.tile')`.

---

## 4. Edge Case & Boundary Audit

### EC-01: innerHTML XSS
The SVG strings are hardcoded JS constants — no user data is ever embedded in them. Setting `el.innerHTML = SVG_FLAG` is safe. No sanitization needed.

### EC-02: Change detection — initial render
On page load, `el.dataset.state` is `undefined` for all tiles. The check `el.dataset.state === vs` evaluates to `'hidden' === undefined` = `false`, so ALL tiles are updated on the first `render()`. Correct.

### EC-03: Change detection — new game reset
After `newGame()`, all tiles return to `'hidden'` state. Their `el.dataset.state` values from the previous game may be `'revealed'`, `'flagged'`, `'mine'`, etc. The change detection correctly detects these as changed and re-renders them to `hidden` (clearing any SVG innerHTML with `el.textContent = ''`).

### EC-04: SVG inside flex tile
The tile is `display: flex; align-items: center; justify-content: center`. An SVG with `style="width:100%;height:100%"` inside a flex container fills the tile exactly. The SVG is a block-level flex item. `line-height: 0` on `#mascot` and `display: block` on the mascot SVG prevent extra space below.

### EC-05: Wrong-flag × over flag body
The wrong-flag SVG contains both the pennant pixels AND the × lines. The × is drawn on top of the pennant using the SVG painter's model (later elements paint over earlier ones). The × lines will partially obscure the pennant, which is the intended visual: "a cross drawn over the flag".

### EC-06: Triggered mine across new game
`_triggeredIdx` is reset to `-1` in the mascot click handler BEFORE `Game.newGame()`. This prevents any tile in the new game from inheriting the triggered styling from the previous game.

### EC-07: mouseup fired before mousedown (race condition)
If the browser somehow fires `mouseup` before `mousedown` (impossible in practice, but defensive), `mascot.className = 'mascot--' + _mascotState` is set to neutral. No visual glitch.

### EC-08: Win/loss followed immediately by new game
Scenario: player wins, clicks mascot immediately. Flow: `render()` sets `_mascotState = 'win'`, then `mascot.click` handler sets `_mascotState = 'neutral'`. The mascot correctly resets. ✓

### EC-09: Multiple flags then loss — wrong-flag detection
`_visualState()` returns `'wrong-flag'` for flagged tiles where `!tile.isMine && phase === 'lost'`. This is game.js's `wrongFlags` list (pre-computed at loss time) but expressed via the tile's current state in render.js. The render logic is: if `tile.state === 'flagged' && phase === 'lost' && !tile.isMine` → `wrong-flag`. `render.js` injects `SVG_WRONG_FLAG` for these tiles. ✓

### EC-10: SVG tiles and click events
The `e.target.closest('.tile')` pattern in the click handler works correctly when `e.target` is an SVG child element (a `<rect>` inside the flag SVG). `closest('.tile')` walks up the DOM and finds the parent tile `<div>`. ✓

### EC-11: dataset.triggered as empty string vs. absent
`el.dataset.triggered = ''` sets the attribute to empty string. `el.dataset.triggered = 'true'` sets it to `"true"`. The CSS selector `.tile--mine[data-triggered="true"]` only matches `"true"`, not empty string. The change-detection check `(el.dataset.triggered === 'true') === isTriggered` correctly handles both cases. ✓

### EC-12: Mascot SVG face groups at win/loss state persist on new game
When the mascot click handler fires: `_mascotState = 'neutral'` → `render()` → `mascot.className = 'mascot--neutral'`. CSS immediately shows the neutral face group and hides win/loss groups. No stale state. ✓

### EC-13: SVG in tile and tile text-shadow
Phase 4 added `text-shadow: 1px 1px 0 rgba(0,0,0,0.45)` on `.tile--revealed`. This `text-shadow` applies to text nodes only, not SVG children. Flagged and mine tiles (which contain SVG, not text) are not affected by `text-shadow`. ✓

### EC-14: Donut SVG in triggered tile
The triggered mine tile has `.tile--mine[data-triggered="true"]` CSS which changes the tile background to hot pink. The SVG donut (lavender frosting + peach ring) renders on top of this background. The donut hole (transparent) will show the hot-pink background through it — this enhances the "danger/explosion" visual. ✓

### EC-15: Phase 3 `render()` guaranteed no stale textContent after SVG injection
When a tile transitions from `flagged` (SVG) to `revealed` (numbered), `el.textContent = tile.adjacentCount` replaces all child nodes (including SVG). When a tile transitions from `mine` (SVG) to `hidden` (after new game reset), `el.textContent = ''` clears the SVG. Both are correct. ✓

---

## 5. Verification Protocol

### 5.1 Grep / Static Checks

```bash
# G1: game.js unchanged
git diff game.js | wc -c
# Expected: 0

# G2: SVG_FLAG constant present in render.js
grep "const SVG_FLAG" render.js
# Expected: 1 hit

# G3: SVG_WRONG_FLAG constant present
grep "const SVG_WRONG_FLAG" render.js
# Expected: 1 hit

# G4: SVG_DONUT constant present
grep "const SVG_DONUT" render.js
# Expected: 1 hit

# G5: _triggeredIdx module state present
grep "_triggeredIdx" render.js | wc -l
# Expected: ≥ 3 (declaration + set on loss + reset on new game)

# G6: _mascotState module state present
grep "_mascotState" render.js | wc -l
# Expected: ≥ 4 (declaration + win + loss + reset)

# G7: mousedown listener present
grep "mousedown" render.js
# Expected: 1 hit

# G8: document mouseup listener present
grep "document.addEventListener.*mouseup" render.js
# Expected: 1 hit

# G9: triggered mine CSS rule present
grep "data-triggered" style.css
# Expected: 1 hit

# G10: Phase 4 ::before rules REMOVED
grep "::before" style.css
# Expected: only the reset rule (*, *::before, *::after), NOT .tile--flagged::before

# G11: 4 mascot face CSS rules present
grep "mascot-face--" style.css | wc -l
# Expected: 4

# G12: mascot SVG in index.html
grep "mascot-face--neutral" index.html
# Expected: 1 hit
```

### 5.2 Console Assertion Blocks

**Block C1 — Flag sprite injection**
```javascript
const assert = (l, v) => console.log(v ? '✓ ' + l : '✗ FAIL: ' + l);

Game.newGame(); render();
const row = 0, col = 0;
Game.toggleFlag(row, col); render();

const f = document.querySelector('.tile--flagged');
assert('Flagged tile exists', f !== null);
assert('Flagged tile has SVG', f.querySelector('svg') !== null);
assert('Flagged tile SVG contains coral color', f.innerHTML.includes('f4827a'));
assert('Flagged tile SVG contains white stick', f.innerHTML.includes('f0f0f0'));
assert('Flagged tile textContent is empty', f.textContent.trim() === '');
assert('data-state is flagged', f.dataset.state === 'flagged');
```

**Block C2 — Donut sprite on loss**
```javascript
const assert = (l, v) => console.log(v ? '✓ ' + l : '✗ FAIL: ' + l);

// Force a loss: reveal a safe tile to activate mines, then need to click a mine.
// Cheat using getBoard() to find mine positions:
Game.newGame(); render();
// Activate mines by revealing a safe interior tile
const b0 = Game.getBoard();
// Click center until mines are placed (first click always safe)
Game.revealTile(5, 5); render();
const b1 = Game.getBoard();
// Find a mine position
let mineRow = -1, mineCol = -1;
for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
  if (b1[r * 10 + c].isMine && b1[r * 10 + c].state !== 'revealed') {
    mineRow = r; mineCol = c; break;
  }
  if (mineRow >= 0) break;
}

if (mineRow >= 0) {
  const evt = Game.revealTile(mineRow, mineCol); render();
  assert('Loss event returned', evt.type === 'loss');

  const triggered = document.querySelector('.tile--mine[data-triggered="true"]');
  assert('Exactly 1 triggered mine', document.querySelectorAll('[data-triggered="true"]').length === 1);
  assert('Triggered mine has SVG donut', triggered && triggered.querySelector('svg') !== null);
  assert('Triggered mine background is hot pink',
    getComputedStyle(triggered).backgroundColor === 'rgb(255, 51, 85)');

  const passiveMines = document.querySelectorAll('.tile--mine:not([data-triggered="true"])');
  assert('Passive mines have SVG donut', passiveMines.length > 0 && passiveMines[0].querySelector('svg') !== null);
  assert('Passive mines do NOT have hot-pink bg',
    getComputedStyle(passiveMines[0]).backgroundColor !== 'rgb(255, 51, 85)');
}
```

**Block C3 — Wrong-flag on loss**
```javascript
const assert = (l, v) => console.log(v ? '✓ ' + l : '✗ FAIL: ' + l);

Game.newGame(); render();
// Flag a known safe tile (5,5 is always safe after first click there)
Game.toggleFlag(0, 0); render(); // Flag before mines are placed
// Activate game and trigger loss
Game.revealTile(5, 5); render();
// Now find any mine and hit it
const b = Game.getBoard();
let mr = -1, mc = -1;
outer: for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
  if (b[r*10+c].isMine) { mr = r; mc = c; break outer; }
}
if (mr >= 0) {
  Game.revealTile(mr, mc); render();
  // Tile (0,0) was flagged but has no mine → should be wrong-flag
  const wf = document.querySelector('.tile--wrong-flag');
  assert('Wrong-flag tile exists', wf !== null);
  assert('Wrong-flag has SVG', wf.querySelector('svg') !== null);
  assert('Wrong-flag SVG contains red cross', wf.innerHTML.includes('cc1111'));
  assert('Wrong-flag SVG still contains pennant', wf.innerHTML.includes('f4827a'));
}
```

**Block C4 — Mascot state machine**
```javascript
const assert = (l, v) => console.log(v ? '✓ ' + l : '✗ FAIL: ' + l);

const mascot = document.getElementById('mascot');
Game.newGame(); render();

assert('Initial state is neutral', mascot.className === 'mascot--neutral');
assert('Neutral face visible', getComputedStyle(document.querySelector('.mascot-face--neutral')).display === 'block');
assert('Other faces hidden', getComputedStyle(document.querySelector('.mascot-face--win')).display === 'none');

// Simulate mousedown on grid tile
document.querySelector('.tile--hidden').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
assert('Surprised on mousedown', mascot.className === 'mascot--surprised');

// Simulate mouseup
document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
assert('Neutral restored on mouseup', mascot.className === 'mascot--neutral');
```

**Block C5 — Win mascot state**
```javascript
const assert = (l, v) => console.log(v ? '✓ ' + l : '✗ FAIL: ' + l);

// Reveal all safe tiles to win
Game.newGame(); render();
Game.revealTile(5, 5); render();
const b = Game.getBoard();
let won = false;
for (let r = 0; r < 10 && !won; r++) {
  for (let c = 0; c < 10 && !won; c++) {
    if (!b[r*10+c].isMine) {
      const e = Game.revealTile(r, c);
      if (e.type === 'win') { render(); won = true; }
      else render();
    }
  }
}

if (won) {
  const mascot = document.getElementById('mascot');
  assert('Win state: mascot has win class', mascot.className === 'mascot--win');
  assert('Win face visible', getComputedStyle(document.querySelector('.mascot-face--win')).display === 'block');

  // mouseup should NOT revert win state to neutral
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  assert('Win state persists after mouseup', mascot.className === 'mascot--win');

  // New game resets
  mascot.click();
  assert('New game resets to neutral', mascot.className === 'mascot--neutral');
}
```

**Block C6 — Change detection performance**
```javascript
const assert = (l, v) => console.log(v ? '✓ ' + l : '✗ FAIL: ' + l);

Game.newGame(); render();

// After first render, all tiles have data-state set
const tiles = document.querySelectorAll('.tile');
assert('All tiles have data-state after render', [...tiles].every(t => t.dataset.state));

// Reveal one tile; only that tile (and flood-fill neighbors) should have updated innerHTML
const firstTile = document.querySelector('[data-row="5"][data-col="5"]');
const beforeHTML = firstTile.innerHTML;
Game.revealTile(5, 5); render();
const afterHTML = firstTile.innerHTML;
// The tile was hidden before (textContent='') and is now revealed (number or empty)
// innerHTML should have changed from '' to either a number textNode or '' (for flood fill)
// Check that a HIDDEN tile that was NOT revealed is still in sync:
const hiddenTile = [...tiles].find(t => t.dataset.state === 'hidden' && t !== firstTile);
assert('Unchanged hidden tile has dataset.state = hidden', hiddenTile && hiddenTile.dataset.state === 'hidden');
```

### 5.3 Manual Checks

| ID  | Check                                                                                           | Pass condition                                                              |
|-----|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| M1  | Flag a tile: coral pink pennant visible, white stick, yellow star pixel at tip                  | Sprite renders crisply; no ★ text character present                        |
| M2  | Un-flag the tile: flag disappears, tile returns to hidden raised peach                          | No lingering SVG; tile looks normal                                         |
| M3  | Loss with a wrongly-placed flag: red × drawn over the pennant                                  | Both pennant AND × lines visible                                            |
| M4  | Loss: all mines show intact donut (lavender frosting + peach ring)                             | Every mine tile has a recognizable donut sprite                             |
| M5  | Loss: triggered mine tile has vivid hot-pink background                                        | Background clearly different from passive mine (#f4827a coral vs #ff3355)  |
| M6  | Loss: triggered mine shows same donut sprite as passive mines (no explosion in Phase 5)        | Donut identical; only background differs                                    |
| M7  | Mascot at game start: shows neutral face (two small eyes + flat mouth)                         | Face visible and recognizable                                               |
| M8  | mousedown on a tile: mascot shows surprised face (wide eyes + open mouth)                      | Surprised face shows while mouse held                                       |
| M9  | Release mouse: mascot reverts to neutral                                                        | Neutral face restored immediately on release                                |
| M10 | Click mascot button: mascot does NOT show surprised face                                       | No surprised flash during mascot click                                      |
| M11 | Win the game: mascot shows win face (star eyes + big smile)                                    | Win face visible; stays on win face                                         |
| M12 | mouseup after win: mascot stays on win face (does not revert to neutral)                       | Win face persists                                                            |
| M13 | Loss: mascot shows loss face (X eyes + frown)                                                  | Loss face visible; stays on loss face                                       |
| M14 | New game after win/loss: mascot returns to neutral face                                        | Neutral face shown on new board                                             |
| M15 | All sprites render crisply at 1× DPR in Chrome                                                | No blurring; individual pixels visible                                      |
| M16 | All sprites render crisply at 2× DPR (DevTools device emulation)                              | Sprites still sharp at HiDPI                                                |
| M17 | No console errors during play, win, loss, new game, and rapid clicking                         | Zero errors in DevTools Console                                             |
| M18 | Tile click targets work through SVG children (click on a flagged tile's SVG child)             | Clicking anywhere on a flagged tile fires the click handler correctly       |

---

## 6. Code Scaffolding

### 6.1 Complete `render.js` After Phase 5

```javascript
// === RENDER ===
// Pure state-to-DOM projection. Reads from window.Game; writes to the DOM.
// Called once after every game action. No game logic here.

// === MODULE STATE ===
let _triggeredIdx = -1;   // board index of triggered mine; -1 = none
let _mascotState  = 'neutral'; // 'neutral' | 'win' | 'loss'

// === SPRITE CONSTANTS ===
const SVG_FLAG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="10" fill="#f0f0f0"/><rect x="3" y="12" width="5" height="1" fill="#f0f0f0"/><rect x="6" y="2" width="6" height="1" fill="#f4827a"/><rect x="6" y="3" width="4" height="1" fill="#f4827a"/><rect x="6" y="4" width="2" height="1" fill="#f4827a"/><rect x="11" y="2" width="1" height="1" fill="#fffacd"/></svg>`;

const SVG_WRONG_FLAG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="10" fill="#f0f0f0"/><rect x="3" y="12" width="5" height="1" fill="#f0f0f0"/><rect x="6" y="2" width="6" height="1" fill="#f4827a"/><rect x="6" y="3" width="4" height="1" fill="#f4827a"/><rect x="6" y="4" width="2" height="1" fill="#f4827a"/><rect x="11" y="2" width="1" height="1" fill="#fffacd"/><line x1="1.5" y1="1.5" x2="14.5" y2="14.5" stroke="#cc1111" stroke-width="1.5" stroke-linecap="square"/><line x1="14.5" y1="1.5" x2="1.5" y2="14.5" stroke="#cc1111" stroke-width="1.5" stroke-linecap="square"/></svg>`;

const SVG_DONUT = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="6" y="2" width="4" height="1" fill="#c7b4f0"/><rect x="4" y="3" width="8" height="1" fill="#c7b4f0"/><rect x="3" y="4" width="3" height="1" fill="#c7b4f0"/><rect x="10" y="4" width="3" height="1" fill="#c7b4f0"/><rect x="3" y="5" width="2" height="1" fill="#c7b4f0"/><rect x="11" y="5" width="2" height="1" fill="#c7b4f0"/><rect x="7" y="2" width="1" height="1" fill="#b5ead7"/><rect x="10" y="3" width="1" height="1" fill="#fffacd"/><rect x="4" y="4" width="1" height="1" fill="#aec6cf"/><rect x="3" y="6" width="2" height="3" fill="#ffb7b2"/><rect x="11" y="6" width="2" height="3" fill="#ffb7b2"/><rect x="3" y="9" width="3" height="1" fill="#ffb7b2"/><rect x="10" y="9" width="3" height="1" fill="#ffb7b2"/><rect x="4" y="10" width="8" height="1" fill="#ffb7b2"/><rect x="6" y="11" width="4" height="1" fill="#ffb7b2"/></svg>`;

// === VISUAL STATE MAPPING (unchanged from Phase 3) ===
function _visualState(tile, phase) {
  if (tile.state === 'revealed') return tile.isMine ? 'mine' : 'revealed';
  if (tile.state === 'flagged')  return (phase === 'lost' && !tile.isMine) ? 'wrong-flag' : 'flagged';
  return (phase === 'lost' && tile.isMine) ? 'mine' : 'hidden';
}

// === RENDER ===
function render() {
  const boardState = Game.getBoard();
  const phase      = Game.getGamePhase();
  const tileDivs   = document.getElementById('grid').querySelectorAll('.tile');
  const mascot     = document.getElementById('mascot');

  const alreadyWon  = document.body.classList.contains('state--win');
  const alreadyLost = document.body.classList.contains('state--loss');

  document.body.classList.toggle('state--win',  phase === 'won');
  document.body.classList.toggle('state--loss', phase === 'lost');

  document.getElementById('mine-counter').textContent = Game.getMineCount();

  if (phase === 'won'  && !alreadyWon)  _mascotState = 'win';
  if (phase === 'lost' && !alreadyLost) _mascotState = 'loss';
  mascot.className = 'mascot--' + _mascotState;

  boardState.forEach((tile, i) => {
    const el          = tileDivs[i];
    const vs          = _visualState(tile, phase);
    const isTriggered = (vs === 'mine' && i === _triggeredIdx);
    const prevTriggered = el.dataset.triggered === 'true';

    if (el.dataset.state === vs && isTriggered === prevTriggered) return;

    el.className         = 'tile tile--' + vs;
    el.dataset.state     = vs;
    el.dataset.count     = tile.adjacentCount;
    el.dataset.triggered = isTriggered ? 'true' : '';

    if (vs === 'revealed' && tile.adjacentCount > 0) {
      el.textContent = tile.adjacentCount;
    } else if (vs === 'flagged') {
      el.innerHTML = SVG_FLAG;
    } else if (vs === 'wrong-flag') {
      el.innerHTML = SVG_WRONG_FLAG;
    } else if (vs === 'mine') {
      el.innerHTML = SVG_DONUT;
    } else {
      el.textContent = '';
    }
  });

  const announcer = document.getElementById('aria-announcer');
  if (phase === 'won'  && !alreadyWon)  announcer.textContent = 'You win! Board cleared.';
  if (phase === 'lost' && !alreadyLost) announcer.textContent = 'Game over! You hit a mine.';
}

// === EVENT WIRING ===

document.addEventListener('DOMContentLoaded', () => {
  const grid   = document.getElementById('grid');
  const mascot = document.getElementById('mascot');

  grid.addEventListener('click', e => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    const row = parseInt(tile.dataset.row, 10);
    const col = parseInt(tile.dataset.col, 10);
    const evt = Game.revealTile(row, col);
    if (evt.type === 'loss') _triggeredIdx = row * 10 + col;
    render();
  });

  grid.addEventListener('contextmenu', e => {
    e.preventDefault();
    const tile = e.target.closest('.tile');
    if (!tile) return;
    Game.toggleFlag(parseInt(tile.dataset.row, 10), parseInt(tile.dataset.col, 10));
    render();
  });

  grid.addEventListener('mousedown', e => {
    if (e.target.closest('.tile')) {
      mascot.className = 'mascot--surprised';
    }
  });

  document.addEventListener('mouseup', () => {
    mascot.className = 'mascot--' + _mascotState;
  });

  mascot.addEventListener('click', () => {
    _triggeredIdx = -1;
    _mascotState  = 'neutral';
    Game.newGame();
    document.getElementById('aria-announcer').textContent = '';
    render();
  });

  render();
});
```

### 6.2 CSS Additions / Removals for style.css

**Remove** both `::before` blocks (lines 113–118 and 134–139 in current style.css).

**Update** `#mascot` rule:
```css
#mascot {
  background: none;
  border: none;
  cursor: pointer;
  line-height: 0;
}
```

**Add** after tile state classes:
```css
/* === Triggered mine (Phase 5) === */
.tile--mine[data-triggered="true"] {
  background:   #ff3355;
  border-color: #cc1133;
}

/* === Mascot face states (Phase 5) === */
.mascot-face { display: none; }
#mascot.mascot--neutral   .mascot-face--neutral   { display: block; }
#mascot.mascot--surprised .mascot-face--surprised { display: block; }
#mascot.mascot--win       .mascot-face--win       { display: block; }
#mascot.mascot--loss      .mascot-face--loss      { display: block; }
```

### 6.3 index.html `#mascot` Button (Complete Replacement)

The entire `<button id="mascot">🍩</button>` line is replaced with the mascot SVG button from Step 3.12. See §3.12 for the complete markup.

---

## 7. Exit Criteria

Move to `DONE.md` only when **all** of the following are satisfied:

- [ ] All 12 grep checks (G1–G12) pass.
- [ ] All 6 console assertion blocks (C1–C6) pass with zero `✗ FAIL` lines.
- [ ] All 18 manual checks (M1–M18) pass.
- [ ] `game.js` unchanged: `git diff game.js | wc -c` = 0.
- [ ] Phase 4 `::before` rules are fully removed from `style.css`.
- [ ] No console errors in Chrome or Firefox during play, win, loss, rapid click, and new game.
- [ ] All 4 mascot states are visually distinguishable from each other.
- [ ] Mascot surprised state does NOT flash when clicking the mascot button itself.
- [ ] Triggered mine is visually distinct from passive mines (hot-pink vs. coral background).
- [ ] SVG sprites render crisply at 1× and 2× DPR.
- [ ] `TODO.md` updated with Phase 6 entries before `DONE.md` write.
