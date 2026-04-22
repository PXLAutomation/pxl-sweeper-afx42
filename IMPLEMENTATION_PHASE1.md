# IMPLEMENTATION_PHASE1.md — Project Scaffold & Static HTML Structure

> **Immutable execution blueprint for Phase 1.**
> Do not deviate from this document during implementation. All scope changes must be recorded in
> `IMPLEMENTATION_PLAN.md` and a new blueprint issued before work resumes.

---

## 0. Context Snapshot

| Item | Value |
|---|---|
| Phase | 1 of 10 |
| Goal | File structure, HTML skeleton, base CSS, empty JS stub — openable in a browser with correct DOM shape |
| Source of truth | `requirements.md` §3, §4.1, §10.1, §10.2 |
| Depends on | Nothing — root phase |
| Blocks | Phase 2 (game logic needs `game.js` to exist and `index.html` to load it) |
| Deliverable | `index.html` + `style.css` + `game.js` openable directly (no server required) |

---

## 1. Architectural Design

### 1.1 File architecture decision

`requirements.md §10.1` explicitly permits "a minimal 2–3 file bundle". Three separate files
(`index.html`, `style.css`, `game.js`) is the chosen approach because:

- Separation of concerns makes later phases (CSS-heavy Phase 4; logic-heavy Phase 2) isolated diffs.
- Easier to review per-phase without monolithic single-file diffs.
- All three files open correctly when served from the file system (`file://`) — no CORS issues
  because there is no `fetch()` or ES module import at this stage.

### 1.2 CSS architecture — custom properties

All palette colors are defined once in `:root` and never hardcoded elsewhere. This is the
**single source of truth** for the palette for all ten phases.

```
:root {
  --color-mint:        #b5ead7;
  --color-peach:       #ffb7b2;
  --color-lavender:    #c7b4f0;
  --color-baby-blue:   #aec6cf;
  --color-soft-yellow: #fffacd;

  /* Derived UI chrome — light desaturated variants */
  --color-bg:          #f8f4fb;   /* page background */
  --color-topbar-bg:   #ede8f5;   /* top bar surface */

  /* Tile sizing — single variable, used everywhere */
  --tile-size: 48px;
}
```

> **Decision recorded here (open question from plan):** hidden tile base color = **peach
> (`#ffb7b2`)** — the warmest and most "bakery" colour. This is locked in Phase 1 as a CSS
> custom property so Phase 4 can apply it without reopening the palette discussion.

### 1.3 DOM structure (authoritative shape)

```
<body>
  ├── <div id="status-bar" role="banner">          ← top bar
  │     ├── <div id="mine-counter" aria-label="Mines remaining">15</div>
  │     ├── <button id="mascot" aria-label="New Game">🍩</button>
  │     └── <div class="status-bar__spacer"></div>  ← symmetry pad (right)
  │
  └── <main>
        └── <div id="grid" role="grid" aria-label="Minesweeper board">
              <!-- 100 × <div class="tile" role="gridcell"> -->
            </div>
  </main>

  <div id="aria-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>
</body>
```

Key id/role contracts that later phases depend on (must not be renamed):

| Selector | Consumer |
|---|---|
| `#grid` | Phase 3 render loop, Phase 6 touch events |
| `#mine-counter` | Phase 3 counter update |
| `#mascot` | Phase 3 new-game wiring, Phase 5 state classes |
| `#aria-announcer` | Phase 9 accessibility |
| `.tile` | Phase 3–7 render, event delegation |

### 1.4 Grid structure

The 10×10 grid is built via **JavaScript** in `game.js` at `DOMContentLoaded`, not hardcoded in
HTML. Reasons:

- Keeps `index.html` concise and prevents stale tile count if constants ever change.
- Phase 2 will need `game.js` running before first render anyway; the scaffold call is a
  no-op placeholder that will be replaced in Phase 3.
- HTML contains only the `<div id="grid">` container; JS appends 100 tile divs.

### 1.5 JavaScript module stub (Phase 1 only)

`game.js` in Phase 1 contains:

1. A `GRID_ROWS = 10`, `GRID_COLS = 10`, `MINE_COUNT = 15` constant block.
2. A `buildGrid()` function that creates 100 `.tile` divs and appends them to `#grid`.
3. A `DOMContentLoaded` listener that calls `buildGrid()`.
4. A `window.Game = {}` stub for the console API (populated in Phase 2).

No game logic. No event listeners beyond `DOMContentLoaded`.

---

## 2. File-Level Strategy

### `index.html` — responsibility: structural skeleton only

- `<!DOCTYPE html>` + `lang="en"`, `charset="UTF-8"`, `viewport` meta.
- `<link rel="stylesheet" href="style.css">` in `<head>`.
- `<script defer src="game.js"></script>` before `</body>` (or with `defer` in `<head>`).
- Top bar `#status-bar`, mine counter, mascot placeholder `<button>`, right spacer.
- `<main>` wrapping `<div id="grid">`.
- `#aria-announcer` div (hidden, `aria-live`).
- **Must not contain**: inline styles, inline scripts, hardcoded tile divs, game logic.

### `style.css` — responsibility: reset + palette + grid container shape

- CSS reset (box-sizing, margin/padding zero).
- `:root` with all five palette variables + two derived chrome variables + `--tile-size`.
- `body`: background `var(--color-bg)`, font stack (system-sans fallback for Phase 1).
- `#status-bar`: flexbox row, `align-items: center`, background `var(--color-topbar-bg)`.
- `#grid`: `display: grid`, `grid-template-columns: repeat(10, var(--tile-size))`, no gaps yet.
- `.tile`: `width: var(--tile-size)`, `height: var(--tile-size)`, `background: #ddd` (placeholder
  colour — Phase 4 will replace this).
- `image-rendering: pixelated` on `#grid` and `.tile`.
- `.sr-only`: standard screen-reader-only visually hidden class (for `#aria-announcer`).
- **Must not contain**: number colours, raised/flat tile effects, animations, font-face — those
  belong to Phase 4.

### `game.js` — responsibility: DOM bootstrap only

- Constants: `GRID_ROWS`, `GRID_COLS`, `MINE_COUNT`.
- `buildGrid()`: creates 100 divs with class `tile`, appends to `#grid`.
- `DOMContentLoaded` handler calling `buildGrid()`.
- `window.Game = {}` stub.
- **Must not contain**: mine placement, flood fill, event listeners (beyond `DOMContentLoaded`),
  render logic, imports.

---

## 3. Atomic Execution Steps

Each step follows a **Plan → Act → Validate** cycle.

---

### Step 1.1 — Create `index.html`

**Plan**: Write the full HTML skeleton per §1.3 above. Use semantic elements. Wire CSS and JS.

**Act**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PXL Sweeper</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="status-bar" role="banner">
    <div id="mine-counter" aria-label="Mines remaining">15</div>
    <button id="mascot" aria-label="New Game">🍩</button>
    <div class="status-bar__spacer"></div>
  </div>

  <main>
    <div id="grid" role="grid" aria-label="Minesweeper board"></div>
  </main>

  <div id="aria-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>

  <script defer src="game.js"></script>
</body>
</html>
```

**Validate**:
- Open in browser → no console errors.
- DevTools Elements: verify `#status-bar`, `#mine-counter`, `#mascot`, `#grid`,
  `#aria-announcer` all present.
- `#grid` is empty (tiles not yet created until JS runs).

---

### Step 1.2 — Create `style.css`

**Plan**: Reset, palette custom properties, grid container layout, placeholder tile colour,
`image-rendering`, `.sr-only`.

**Act**:
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-mint:        #b5ead7;
  --color-peach:       #ffb7b2;
  --color-lavender:    #c7b4f0;
  --color-baby-blue:   #aec6cf;
  --color-soft-yellow: #fffacd;

  --color-bg:          #f8f4fb;
  --color-topbar-bg:   #ede8f5;

  --tile-size: 48px;
}

body {
  background: var(--color-bg);
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

#status-bar {
  display: flex;
  align-items: center;
  width: calc(var(--tile-size) * 10);
  background: var(--color-topbar-bg);
  padding: 8px;
}

#mine-counter {
  flex: 1;
}

#mascot {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 32px;
  line-height: 1;
}

.status-bar__spacer {
  flex: 1;
}

#grid {
  display: grid;
  grid-template-columns: repeat(10, var(--tile-size));
  image-rendering: pixelated;
}

.tile {
  width: var(--tile-size);
  height: var(--tile-size);
  background: #ddd;
  border: 1px solid #bbb;
  image-rendering: pixelated;
}

/* Screen-reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Validate**:
- Reload browser.
- `#grid` is visible (not zero-size) once tiles are appended.
- Top bar shows the emoji and counter aligned.
- DevTools → Computed Styles on `#grid`: `image-rendering: pixelated`.

---

### Step 1.3 — Create `game.js`

**Plan**: Constants, `buildGrid()`, `DOMContentLoaded` wiring, `window.Game` stub.

**Act**:
```js
const GRID_ROWS = 10;
const GRID_COLS = 10;
const MINE_COUNT = 15;

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
  buildGrid();
});

// Public API — populated in Phase 2
window.Game = {};
```

**Validate**:
- Reload browser; DevTools Elements: `#grid` has exactly 100 child `.tile` divs.
- Console: `document.querySelectorAll('.tile').length` → `100`.
- No console errors.

---

### Step 1.4 — Verify data attributes on tiles

**Plan**: Confirm each tile carries `data-row` and `data-col` for Phase 3's event delegation.

**Validate**:
- DevTools Elements: inspect any tile — it has `data-row="N"` and `data-col="M"`.
- Console: `document.querySelector('.tile').dataset` → `{row: "0", col: "0"}`.

---

### Step 1.5 — Cross-browser smoke check

**Plan**: Open `index.html` directly (`file://`) in Chrome and Firefox.

**Validate**:
- Chrome: zero console errors. Grid of 100 grey squares visible. Emoji mascot visible.
- Firefox: same.
- DevTools → Rendering → check `image-rendering: pixelated` on `.tile` (Chrome only;
  Firefox equivalence verified via visual sharpness of grid lines).

---

### Step 1.6 — Update `todo.md` and `done.md`

**Plan**: Write Phase 1 entries to `todo.md`; leave `done.md` update for after verification.

**Act**: Populate `todo.md` with Phase 1 checklist items (see §6 Scaffolding below) and
Phase 2 entries as a forward reference.

---

## 4. Edge Case & Boundary Audit

| # | Failure mode | Condition | Mitigation |
|---|---|---|---|
| E1 | Grid renders 0 tiles | `DOMContentLoaded` fires before `#grid` exists | `defer` attribute on `<script>` guarantees DOM is ready; `buildGrid` queries `#grid` after DOM load |
| E2 | `#grid` renders with incorrect column count | Typo in `grid-template-columns` | `repeat(10, var(--tile-size))` — verify with DevTools grid overlay |
| E3 | `--tile-size` variable not resolving | `:root` declaration missing | Verify in DevTools Computed → `--tile-size` shows `48px` on `:root` |
| E4 | `image-rendering: pixelated` silently unsupported | Firefox uses `-moz-crisp-edges` for older versions | Modern Firefox (current-2) supports `pixelated`; include `-moz-crisp-edges` as a fallback declaration before `pixelated` |
| E5 | `sr-only` element causes page scroll | Absolute positioning leaks scroll area | The standard `.sr-only` pattern with `clip` and `overflow:hidden` eliminates this; verify no vertical scrollbar appears |
| E6 | `aria-live` region fires immediately on page load | The div is empty; no announcement should be made | Empty content on load = no announcement; confirmed browser behaviour |
| E7 | `window.Game = {}` conflicts with existing global | Another script defines `Game` | No other scripts in Phase 1 — safe; noted for Phase 2 |
| E8 | Top bar width misaligns with grid at edge viewports | `width: calc(var(--tile-size) * 10)` is fixed | This is intentional for Phase 1; responsive scaling is Phase 4's job |
| E9 | `defer` on script causes race with other scripts | No other scripts in Phase 1 | Single-script page; no race possible |
| E10 | HTML validator errors on `role="grid"` without `aria-rowcount` | Grid is dynamic; ARIA grid requires rowcount in strict validators | Accept warning for Phase 1; full ARIA wiring is Phase 9 |

---

## 5. Verification Protocol

### 5.1 Manual UX Checks (must all pass before moving to `done.md`)

| ID | Check | Expected result |
|---|---|---|
| V1 | Open `index.html` in Chrome (file://) | Page loads, no console errors |
| V2 | Open `index.html` in Firefox (file://) | Page loads, no console errors |
| V3 | DOM inspection: tile count | `document.querySelectorAll('.tile').length === 100` |
| V4 | DOM inspection: data attributes | First tile has `data-row="0"` and `data-col="0"` |
| V5 | Computed styles: `--tile-size` | Resolves to `48px` on `:root` |
| V6 | Computed styles: `image-rendering` | `pixelated` on `#grid` and `.tile` |
| V7 | Palette variables | All five `--color-*` variables visible in `:root` computed styles |
| V8 | Top bar layout | Mine counter on left, emoji centered, right spacer visible |
| V9 | Page scroll | No scrollbars on a 1280×800 desktop viewport |
| V10 | `window.Game` | `typeof window.Game === 'object'` in console |
| V11 | `aria-label` on mascot button | DevTools → Accessibility tab shows `aria-label: "New Game"` |
| V12 | `#aria-announcer` | Present in DOM, not visible on screen |
| V13 | No inline styles | DevTools → no `style=""` attributes on any element |
| V14 | No game logic in `game.js` | `game.js` contains only constants, `buildGrid`, event listener, and `window.Game = {}` |

### 5.2 Automated / Console Assertions

Run in Chrome DevTools console after loading `index.html`:

```js
// V3 — tile count
console.assert(document.querySelectorAll('.tile').length === 100, 'FAIL V3: tile count');

// V4 — data attributes
const t = document.querySelector('.tile');
console.assert(t.dataset.row === '0' && t.dataset.col === '0', 'FAIL V4: data attrs');

// V10 — window.Game exists
console.assert(typeof window.Game === 'object', 'FAIL V10: window.Game');

// V11 — mascot aria-label
console.assert(
  document.getElementById('mascot').getAttribute('aria-label') === 'New Game',
  'FAIL V11: mascot aria-label'
);

// V12 — aria-announcer present and live
const ann = document.getElementById('aria-announcer');
console.assert(ann !== null, 'FAIL V12a: aria-announcer missing');
console.assert(ann.getAttribute('aria-live') === 'polite', 'FAIL V12b: aria-live missing');

console.log('Phase 1 assertions complete');
```

All assertions must pass with no `FAIL` output before Phase 1 can be moved to `done.md`.

---

## 6. Code Scaffolding

### 6.1 Final `todo.md` content for Phase 1 (write this verbatim)

```markdown
## Phase 1 — Scaffold

- [ ] Create index.html with top bar and 10×10 grid container
- [ ] Create style.css with CSS reset and palette custom properties
- [ ] Create game.js as empty module stub with buildGrid()
- [ ] Confirm grid renders 100 placeholder tile divs (console assertion)
- [ ] Confirm no console errors on page load in Chrome and Firefox
- [ ] Confirm image-rendering: pixelated on grid container (computed styles)
- [ ] Confirm window.Game exists as empty object
- [ ] Confirm mascot button has aria-label="New Game"
- [ ] Run all Phase 1 console assertions — zero FAIL messages
- [ ] Update todo.md with Phase 2 entries before marking Phase 1 done
```

### 6.2 Phase 2 forward-reference entries (append to `todo.md` after Phase 1 complete)

```markdown
## Phase 2 — Core Logic

- [ ] Define board data model (100-element array, tile objects)
- [ ] Implement newGame() — resets board, no mines placed yet
- [ ] Implement post-first-click mine placement excluding clicked tile + neighbors
- [ ] Implement adjacency count calculation for all tiles
- [ ] Implement iterative BFS flood fill
- [ ] Implement revealTile(row, col) returning game event object
- [ ] Implement toggleFlag(row, col) — no-op on revealed tile
- [ ] Implement getMineCount() → total - flagged
- [ ] Implement win check after flood fill completes
- [ ] Expose all functions on window.Game
- [ ] Console-verify: first click never hits a mine
- [ ] Console-verify: flood fill terminates without infinite loop
- [ ] Console-verify: win detection triggers on correct final reveal
- [ ] Console-verify: loss detection triggers on mine reveal
- [ ] Console-verify: getMineCount returns correct values under flag manipulation
- [ ] Update todo.md with Phase 3 entries
```

### 6.3 `done.md` entry template (fill in after all V-checks pass)

```markdown
## Phase 1 — Project scaffold and static HTML structure ✅

**Completed**: [date]

### Deliverables
- `index.html` — full HTML skeleton with #status-bar, #mine-counter, #mascot, #grid, #aria-announcer
- `style.css` — CSS reset, :root palette variables, grid container layout, .sr-only utility
- `game.js` — constants (GRID_ROWS, GRID_COLS, MINE_COUNT), buildGrid(), window.Game stub

### Verification
- All 14 manual checks (V1–V14) passed in Chrome and Firefox
- All 5 console assertions pass with zero FAIL output
- 100 tile divs confirmed in DOM
- image-rendering: pixelated confirmed on #grid and .tile
- No console errors on file:// load in Chrome and Firefox

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
```

---

## 7. Implementation Notes & Traps

### 7.1 `defer` vs `type="module"`

Use `defer` (not `type="module"`) on the `<script>` tag. `type="module"` enables ES module
syntax but also enforces strict CORS rules that break `file://` loading in some browsers
(Chrome, in particular, blocks module imports from `file://` without a server).
Since the plan mandates no build system and direct-browser-open, `defer` is the correct choice.

### 7.2 `image-rendering: pixelated` cross-browser

Apply both vendor-prefixed and standard values in `style.css`:

```css
image-rendering: -moz-crisp-edges;   /* Firefox ≤ 92 */
image-rendering: pixelated;           /* Chrome, Safari, Firefox 93+ */
```

This costs two lines and costs nothing in risk. Phase 4's sprite work requires this to be
correct and consistent.

### 7.3 Grid gap vs. no gap

Phase 1 uses no `gap` on the grid. A 1 px border on `.tile` provides visual separation.
Phase 4 will revisit this — the raised-tile shadow effect may supersede the border.
Using `border` now keeps Phase 1 visually non-empty without over-engineering.

### 7.4 `width` of `#status-bar`

Set to `calc(var(--tile-size) * 10)` to match the grid width exactly. This will need to
become responsive in Phase 4 alongside the tile `clamp()` fix, but that is out of scope here.
Both elements use `--tile-size`, so when Phase 4 changes `--tile-size` to a `clamp()` expression,
the top bar automatically follows.

### 7.5 `role="grid"` without row elements

The ARIA grid role technically expects `role="row"` children. For Phase 1 this is a valid
approximation. Phase 9 will fully audit ARIA; accept the structural shortcut here.

---

## 8. Exit Gate Summary

All of the following must be true before Phase 1 items are moved to `done.md`:

1. `index.html` opens without errors in Chrome and Firefox via `file://`.
2. 100 `.tile` divs are present in `#grid` (console assertion V3 passes).
3. All five palette custom properties are defined in `:root`.
4. `image-rendering: pixelated` confirmed on `#grid` via DevTools Computed Styles.
5. `window.Game` is an object (not `undefined`) in the console.
6. `#mascot` has `aria-label="New Game"` in the DOM.
7. `#aria-announcer` has `aria-live="polite"` in the DOM.
8. `game.js` contains zero DOM event listeners other than `DOMContentLoaded`.
9. All Phase 1 console assertions run with zero `FAIL` output.
10. `todo.md` updated with Phase 2 entries.
