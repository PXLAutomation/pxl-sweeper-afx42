# IMPLEMENTATION_PLAN.md — Pastel Donut‑Sweeper

---

## Overview

This plan covers the full implementation of **Pastel Donut‑Sweeper**, a single-page, no-backend Minesweeper clone with a whimsical pastel donut theme. The game is a 10×10 grid with 15 mines, pixel-art visuals, and casual UX (no timer, no accounts, no settings).

Source of truth: `requirements.md`.

Delivery target: static file(s) openable directly in a browser, with no build system required. No deployment infrastructure is needed.

---

## Assumptions

1. **No build tooling is required.** The deliverable is one or a small set of plain files (`index.html`, `style.css`, `game.js`). A simple dev server (e.g., `npx serve` or VS Code Live Server) may be used locally but is not a build step.
2. **Pixel art sprites are drawn as inline SVG or CSS-drawn shapes**, not external image files, unless the implementer decides to generate them as data URIs or embedded `<canvas>` — the plan treats them as CSS/SVG to avoid an asset pipeline.
3. **No test framework is pre-installed.** Manual browser checks and optionally a small inline test harness (no dependencies) serve as the test gate.
4. **One developer**, working in self-review mode. Review cadence: one phase per review cycle; phases sized for completion in a single focused session.
5. **`TODO.md` and `DONE.md` are maintained by hand** in the repo root alongside this plan.
6. **"Pixel font"** is assumed to be a small CSS `@font-face` embedding of a free bitmap font (e.g., Press Start 2P from Google Fonts via a single `<link>`, < 20 KB) or a CSS-drawn digit approach. Decision is documented under Open Questions.
7. **Optional keyboard support** (§6.3 of requirements) is deferred to Phase 8 and will not block any earlier phase.
8. **Long-press haptic** (`navigator.vibrate`) is an enhancement wired in Phase 6 alongside the rest of mobile input hardening; it does not add a phase of its own.

---

## Delivery Strategy

**Strategy: thin vertical slices, bottom-up within each slice.**

Each phase delivers a working, browser-openable increment of the game. Logic is built before visuals; visuals are built before animations; animations are built before polish. This is justified because:

- The project has no backend, no build pipeline, and no team coordination overhead — vertical slices minimize the risk of large, hard-to-review diffs.
- The hardest correctness risks (game logic, win/loss state, flood fill) are isolated early where they are easiest to test manually.
- Visual and animation work is isolated late, where scope creep is most likely, making it easier to cut if time is short.
- A thin slice approach means the game is fully playable (ugly but correct) after Phase 3, which gives an early confidence checkpoint.

---

## Phase List

| ID      | Title                                              |
|---------|----------------------------------------------------|
| Phase 1 | Project scaffold and static HTML structure         |
| Phase 2 | Core game logic (headless, verified in console)    |
| Phase 3 | Functional board rendering and basic interaction   |
| Phase 4 | Visual theme — tiles, numbers, and layout polish   |
| Phase 5 | Pixel-art sprites — flags, donuts, mascot          |
| Phase 6 | Input hardening — mobile touch and right-click     |
| Phase 7 | Micro-animations and feedback effects              |
| Phase 8 | Win/loss state — end-game presentation             |
| Phase 9 | Accessibility, aria-live, and optional keyboard    |
| Phase 10| Final stabilization, cross-browser smoke tests, done |

---

## Detailed Phases

---

### Phase 1 — Project scaffold and static HTML structure

#### Goal
Establish the file structure, HTML skeleton, and a working local dev environment. No game logic. No real visuals. The page must open in a browser and show the correct DOM structure.

#### Scope
- Create `index.html` with the top bar (mine counter placeholder, mascot button placeholder) and the 10×10 grid container.
- Create `style.css` linked from `index.html`.
- Create `game.js` linked from `index.html` (deferred, no logic yet).
- Apply a base reset and page background color from the pastel palette.
- Confirm that the grid container renders as a 10-column CSS Grid with placeholder tile divs.
- No game state. No interaction. No sprites.

#### Expected files to change
- `index.html` — created; full HTML skeleton
- `style.css` — created; CSS reset, CSS custom properties for the palette, base grid layout
- `game.js` — created; empty module stub with a `// TODO` comment
- `TODO.md` — created or updated with Phase 1 entries
- `DONE.md` — created (empty)

#### Dependencies
- None. This is the root phase.

#### Risks
- **Low.** Pure structural work. Only risk is a mis-specified grid that requires rework in Phase 3; mitigated by verifying the 10-column layout before exit.

#### Tests and checks to run
- Open `index.html` directly in Chrome and Firefox.
- Verify the browser console shows no errors.
- Verify the page has a top bar and a 10×10 grid of placeholder cells visible.
- Verify `image-rendering: pixelated` is applied to the grid container (inspect computed styles).

#### Review check before moving work to `DONE.md`
- [ ] HTML is semantically correct (top bar is a `<header>` or `<div role="banner">`, grid is a `<main>` or labeled section).
- [ ] CSS custom properties for all palette colors (`--color-mint`, `--color-peach`, etc.) are defined in `:root` and match `requirements.md §4.1`.
- [ ] No game logic has crept into `game.js`.
- [ ] No visual styling beyond background color and grid placeholder has been added (defer to Phase 4).
- [ ] `TODO.md` is updated with Phase 2 entries before marking Phase 1 done.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 1 — Scaffold

- [ ] Create index.html with top bar and 10×10 grid container
- [ ] Create style.css with CSS reset and palette custom properties
- [ ] Create game.js as empty module stub
- [ ] Confirm grid renders 100 placeholder tile divs in Chrome and Firefox
- [ ] Confirm no console errors on page load
- [ ] Confirm image-rendering: pixelated on grid container
- [ ] Update TODO.md with Phase 2 entries
```

#### Exit criteria for moving items to `DONE.md`
- `index.html` exists, opens without errors in Chrome and Firefox.
- Grid shows 100 tile elements in DevTools DOM inspection.
- `style.css` has all five palette custom properties defined.
- `game.js` exists (may be empty).
- No console errors.

---

### Phase 2 — Core game logic (headless, verified in console)

#### Goal
Implement all game logic in `game.js` with zero DOM dependency. The game model must be fully correct and testable by calling functions directly from the browser console.

#### Scope
- Board data model: 10×10 array of tile objects with `{ state: 'hidden'|'revealed'|'flagged', isMine: bool, adjacentCount: number }`.
- Mine placement: post-first-click, excluding clicked tile and its neighbors.
- Adjacency count calculation.
- Flood-fill reveal (iterative BFS).
- Win condition check.
- Loss condition check.
- `newGame()` function that resets state.
- `revealTile(row, col)` function that handles all reveal logic and returns a game event (`{ type: 'win' | 'loss' | 'revealed' | 'noop', ... }`).
- `toggleFlag(row, col)` function.
- `getMineCount()` → `total - flagged`.
- No DOM manipulation. No rendering. No event listeners.
- All functions exported to `window` (e.g., `window.Game = { ... }`) for console testing.

#### Expected files to change
- `game.js` — all game logic implemented

#### Dependencies
- Phase 1 complete (`game.js` file exists).

#### Risks
- **Medium.** Flood fill and post-first-click mine placement are the two highest-risk logic areas.
  - Flood-fill infinite loop risk: mitigated by iterative BFS with a `visited` set.
  - Mine placement edge case: if the board has fewer than 100 − 9 = 91 available non-excluded tiles (impossible with 15 mines on a 100-tile board), placement could loop. Not a real risk here; document assumption.
  - Win detection mid-flood-fill: must be evaluated after the BFS queue empties, not inside the loop.

#### Tests and checks to run
- Open `index.html` in Chrome DevTools console and run:
  - `Game.newGame()` — verify state resets.
  - `Game.revealTile(0, 0)` (first click) — verify no mine is revealed; verify mines are placed; verify flood fill runs if tile is empty.
  - `Game.toggleFlag(1, 1)` — verify flag state toggled, mine counter decrements.
  - Force a win by calling `revealTile` on all non-mine tiles — verify `{ type: 'win' }` returned.
  - Force a loss by revealing a mine tile directly (after mines are placed) — verify `{ type: 'loss' }`.
  - Verify flood fill does not exceed 100 tiles in reveal count.
  - Verify `getMineCount()` returns 15 before any flags, 14 after one flag, -1 after 16 flags.
- Manual: verify adjacency counts are correct for a known corner tile (max 3 neighbors = max count 3 if all mines).

#### Review check before moving work to `DONE.md`
- [ ] No DOM references in `game.js`.
- [ ] All five public API functions are accessible on `window.Game` (or a named module export).
- [ ] Flood fill is iterative (no recursion).
- [ ] First-click exclusion zone is correctly computed (up to 9 tiles: the clicked tile and its valid neighbors).
- [ ] Win condition evaluates after flood fill completes, not during.
- [ ] `revealTile` on a flagged tile returns `{ type: 'noop' }`.
- [ ] `toggleFlag` on a revealed tile returns without changing state.
- [ ] No rendering or animation code has entered `game.js`.
- [ ] `TODO.md` updated with Phase 3 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
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
- [ ] Update TODO.md with Phase 3 entries
```

#### Exit criteria for moving items to `DONE.md`
- All console verification steps above pass without error.
- `game.js` contains zero `document.` or `element.` references.
- Flood fill proof: revealing the first tile of a fully empty board (hypothetically) reveals all 100 tiles — can be validated by inspecting `board` state after a forced all-empty reveal.
- Win check: after console-forcing all safe tiles to revealed, `revealTile` returns `{ type: 'win' }`.
- Loss check: after mines are placed, `revealTile` on a mine returns `{ type: 'loss' }`.

---

### Phase 3 — Functional board rendering and basic interaction

#### Goal
Connect the game logic to the DOM. The game must be fully playable (no visuals beyond colored divs) with correct win/loss detection, flagging, and the New Game button working.

#### Scope
- `render.js` (new file) or renderer section in `game.js`: a `render()` function that reads game state and updates the DOM.
- Render tile states: hidden = one CSS class, revealed = another, flagged = another. Display adjacency numbers as text content.
- Mine counter in the top bar updates after every action.
- Mascot button (`#mascot`) triggers `newGame()` + re-render.
- Left-click on a tile calls `revealTile()`; right-click calls `toggleFlag()` with `event.preventDefault()`.
- Win and loss states: apply a CSS class to `<body>` or the grid container to indicate game state. No animations yet.
- No pixel art. No styled numbers. No mascot face states. No touch input. No animation.

#### Expected files to change
- `game.js` — add event wiring or export hooks
- `render.js` — new file for all DOM mutation code (or a clearly labeled section in `game.js`)
- `index.html` — add `id` attributes needed by the renderer (`#grid`, `#mine-counter`, `#mascot`)
- `style.css` — add minimal class-based styles for `tile--hidden`, `tile--revealed`, `tile--flagged`, `state--win`, `state--loss`

#### Dependencies
- Phase 2 complete and all exit criteria met.
- `window.Game` API stable.

#### Risks
- **Low to medium.** Main risk is coupling render logic too tightly to game state, making later refactors (animations, theming) expensive. Mitigate by keeping `render()` as a pure state-to-DOM projection, called once after every game action.
- Right-click context menu suppression: must verify it works on the grid without suppressing right-click on the mascot button or outside the grid.

#### Tests and checks to run
- Open `index.html` in Chrome and Firefox.
- Manual play-through: left-click reveals tiles, numbers appear, flood fill opens empty regions.
- Manual: right-click places and removes flags; mine counter updates correctly.
- Manual: left-click a flagged tile does nothing (tile stays flagged).
- Manual: reach a win state by revealing all safe tiles — verify body class `state--win` is applied.
- Manual: reveal a mine — verify body class `state--loss` is applied.
- Manual: click mascot button — verify board resets and all tiles return to hidden.
- Verify no console errors in Chrome and Firefox.
- Verify right-click context menu does NOT appear over the grid.
- Verify right-click context menu DOES appear if right-clicking outside the grid (sanity check).

#### Review check before moving work to `DONE.md`
- [ ] `render()` reads only from the game state object; it does not contain logic.
- [ ] Right-click `preventDefault` is scoped to the grid only (not page-wide).
- [ ] Mine counter reads from `Game.getMineCount()` after every action.
- [ ] New Game button resets both game state and DOM in one call.
- [ ] No animation code has been added.
- [ ] No pixel-art, mascot state changes, or touch input has been added.
- [ ] No console errors on any tested browser.
- [ ] `TODO.md` updated with Phase 4 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 3 — Rendering and Interaction

- [ ] Create render.js (or renderer section) with render() as pure state-to-DOM projection
- [ ] Add ids to index.html: #grid, #mine-counter, #mascot
- [ ] Render tile state as CSS classes: tile--hidden, tile--revealed, tile--flagged
- [ ] Display adjacency number as text in revealed numbered tiles
- [ ] Update mine counter display after every action
- [ ] Wire left-click → revealTile(), re-render
- [ ] Wire right-click → toggleFlag(), preventDefault, re-render
- [ ] Wire mascot button → newGame(), render()
- [ ] Apply state--win / state--loss class to grid or body on game end
- [ ] Block all grid input after win or loss (not the mascot button)
- [ ] Manual play-through: win and loss both reachable
- [ ] Manual: right-click context menu suppressed on grid, not elsewhere
- [ ] Manual: flagged tile blocks reveal
- [ ] Verify no console errors in Chrome and Firefox
- [ ] Update TODO.md with Phase 4 entries
```

#### Exit criteria for moving items to `DONE.md`
- Full manual play-through results in a correct win.
- Full manual play-through results in a correct loss (mine revealed).
- Mascot New Game button resets correctly at all states (idle, win, loss).
- Mine counter shows correct value at all stages including negative value after over-flagging.
- No console errors.

---

### Phase 4 — Visual theme — tiles, numbers, and layout polish

#### Goal
Apply the full pastel pixel-art visual theme to tiles and numbers. The game must look correct and on-brand after this phase, short of sprites (those come in Phase 5).

#### Scope
- CSS for all tile states matching `requirements.md §4.2`:
  - Hidden: raised effect via box-shadow/border simulation; base color peach/lavender.
  - Revealed: flat; slightly darker.
  - Flagged: same as hidden but with a colored indicator (placeholder text `★` is acceptable until Phase 5).
- Number colors per `requirements.md §4.3` — all 8 colors applied via CSS data attributes or classes (e.g., `data-count="1"` → color rule).
- Embed or link a pixel font for numbers (Press Start 2P via Google Fonts CDN or a self-hosted TTF < 20 KB).
- Top bar layout: mine counter left-aligned, mascot centered, correct padding and background.
- Page background and UI chrome colors from the palette.
- Tile size: 48×48 CSS px on desktop; responsive scaling via CSS `clamp()` or viewport-based sizing for mobile, minimum 44×44 CSS px.
- Empty revealed tile (count = 0): no number displayed.
- No sprites. No mascot face. No animations.
- Apply `image-rendering: pixelated` globally to game elements.

#### Expected files to change
- `style.css` — majority of this phase's work; tile styles, number color rules, layout, font
- `index.html` — add `data-count` or equivalent attribute emission in the renderer
- `render.js` — emit `data-count` attribute on revealed tiles; emit `data-state` on all tiles

#### Dependencies
- Phase 3 complete. Grid and interaction are stable.

#### Risks
- **Medium.** Pixel font loading may cause a flash of unstyled text (FOUT) on first load; mitigate with `font-display: block` and a `<link rel="preload">`.
- Tile size responsive scaling: using `clamp()` provides a clean solution but requires verification at narrow viewports (360 px, 320 px) and tall viewports to confirm no-scroll on desktop.
- Contrast ratio for numbers on revealed tiles: must be checked for all 8 colors. Golden yellow (`#e8c43a`) on a light revealed tile is the most likely failure point.

#### Tests and checks to run
- Open in Chrome and Firefox at 1280 px width: confirm no horizontal scroll, all tiles 48×48.
- Open in Chrome DevTools Device Mode at 375 px (iPhone SE): confirm no scroll, tiles ≥ 44 px.
- Open at 360 px: confirm no horizontal overflow.
- Manually verify all 8 number colors appear per the requirements table.
- Check contrast: use Chrome DevTools accessibility panel or a contrast checker for each number color against the revealed tile background. All must be ≥ 3:1.
- Verify `image-rendering: pixelated` is applied (inspect element).
- Verify empty tiles (count = 0) show no number.
- Verify pixel font renders on numbers (no fallback system serif visible).

#### Review check before moving work to `DONE.md`
- [ ] All 8 number colors match the hex values in `requirements.md §4.3` (within a small tolerance).
- [ ] Contrast ratio ≥ 3:1 for every number color against the revealed tile background. Document results.
- [ ] Tile size is 48×48 on desktop and scales correctly on mobile (≥ 44 px).
- [ ] No scroll at 1280 px viewport.
- [ ] No horizontal overflow at 360 px viewport.
- [ ] Pixel font is loading (verify in Network tab, not a system font fallback).
- [ ] Hidden tile raised effect is visually distinct from revealed flat tile.
- [ ] No animation or sprite code has been introduced.
- [ ] `TODO.md` updated with Phase 5 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 4 — Visual Theme

- [ ] Apply hidden tile style: pastel raised square, box-shadow simulation, base color
- [ ] Apply revealed tile style: flat, slightly darker
- [ ] Apply 8 number color rules via data-count attribute CSS selectors
- [ ] Embed pixel font (Press Start 2P or equivalent); verify loading in Network tab
- [ ] Apply font to mine counter and tile numbers
- [ ] Top bar layout: counter left, mascot centered, correct padding and palette background
- [ ] Tile size: 48×48 CSS px desktop, clamp() for mobile ≥ 44 px
- [ ] Empty revealed tile (count 0) shows no number
- [ ] Apply image-rendering: pixelated to grid
- [ ] Verify layout at 1280 px: no scroll
- [ ] Verify layout at 375 px: no scroll, tiles ≥ 44 px
- [ ] Verify layout at 360 px: no horizontal overflow
- [ ] Contrast check: document pass/fail for all 8 number colors (≥ 3:1)
- [ ] Update TODO.md with Phase 5 entries
```

#### Exit criteria for moving items to `DONE.md`
- All 8 number colors are applied and visually distinguishable.
- Contrast ratio documented and ≥ 3:1 for every number.
- Tile layout verified at all three viewport widths above.
- Pixel font displaying correctly (network request visible in DevTools).
- No console errors.

---

### Phase 5 — Pixel-art sprites — flags, donuts, and mascot

#### Goal
Replace placeholder indicators with pixel-art CSS/SVG sprites: the flag pennant, the intact donut, the triggered donut (burst), and the four mascot face states.

#### Scope
- **Flag sprite**: coral pink pennant with white stick and star pixel tip — implemented as an inline SVG `<svg>` embedded by the renderer, or as a CSS `::before`/`::after` pixel shape.
- **Incorrect flag indicator** (shown on loss over wrong flags): a red `×` drawn over the pennant.
- **Intact donut sprite**: round donut shape, pastel frosting, 3–4 sprinkle pixels — CSS shapes or inline SVG.
- **Triggered donut**: same as intact, but drawn on a hot-pink tile background, to distinguish from passive mines. No animation yet (animation comes in Phase 7).
- **Mascot**: pixel-art donut with a face. Four states: `neutral`, `surprised`, `win`, `loss`. Each state is a different SVG or CSS sprite variant. States are applied by adding a class to `#mascot`.
- **Mascot state wiring** (visual only, no animation yet):
  - `mousedown` on any board tile → `surprised`.
  - `mouseup`/`mouseleave` on board → revert to `neutral` if game in progress.
  - Win → `win` state.
  - Loss → `loss` state.
  - New game → `neutral`.
- No animations in this phase.

#### Expected files to change
- `style.css` — sprite CSS rules, mascot state classes
- `render.js` — emit sprite markup; update mascot state class; add `mousedown`/`mouseup` listeners on the grid
- `index.html` — possibly add an `<svg>` defs block for reusable sprite definitions

#### Dependencies
- Phase 4 complete. Tile layout and sizing are stable and will not change.

#### Risks
- **Medium.** Sprite design is subjective and may require iteration. Main technical risk is sprite rendering sharpness at 3× scale — mitigated by designing strictly on the 16×16 grid and relying on `image-rendering: pixelated`.
- Mascot state transitions: must not fire the `surprised` state when the player clicks the mascot button itself (requirement §3.3). Requires event target checking.
- SVG inline vs. CSS-drawn: if inline SVG is used, the renderer must produce valid SVG as strings, which can be fiddly. CSS-drawn is safer but less expressive.

#### Tests and checks to run
- Manual: flag a tile — verify coral pink pennant with star tip appears.
- Manual: reach loss state with an incorrectly placed flag — verify red `×` overlay on that flag.
- Manual: reach loss state — verify intact donuts appear on non-triggered mines.
- Manual: triggered mine tile shows on a hot-pink/red background; visually distinct from passive mines.
- Manual: mascot shows neutral face at game start.
- Manual: `mousedown` on any tile changes mascot to surprised; release reverts to neutral.
- Manual: mascot shows win face on win; loss face on loss; neither state reverting until New Game.
- Manual: clicking the mascot button itself does NOT show surprised face.
- Verify sprites render sharply (not blurry) in Chrome and Firefox at 1×, 2× screen DPR.

#### Review check before moving work to `DONE.md`
- [ ] All four mascot states are visually distinguishable.
- [ ] Mascot surprised state does not fire on mascot button click.
- [ ] Incorrect flag indicator renders on loss for wrongly placed flags only.
- [ ] Triggered mine tile is visually distinct from passive mines (background color difference).
- [ ] No animation code has been introduced.
- [ ] Sprite code does not break layout or cause overflow.
- [ ] `TODO.md` updated with Phase 6 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 5 — Sprites

- [ ] Implement flag sprite: coral pink pennant, white stick, star tip
- [ ] Implement incorrect flag indicator: red × over flag, shown on loss for wrong flags only
- [ ] Implement intact donut sprite (for passive mine reveal on loss)
- [ ] Implement triggered donut: same donut, hot-pink/red tile background
- [ ] Implement mascot neutral state sprite
- [ ] Implement mascot surprised state sprite
- [ ] Implement mascot win state sprite (sparkly eyes, no animation yet)
- [ ] Implement mascot loss state sprite (crying, no animation yet)
- [ ] Wire mascot state class changes: mousedown on tile → surprised
- [ ] Wire mascot revert on mouseup/mouseleave if game in progress
- [ ] Wire mascot win/loss state from game event
- [ ] Verify mascot button click does NOT trigger surprised state
- [ ] Verify all sprites render sharply at 1× and 2× DPR
- [ ] Update TODO.md with Phase 6 entries
```

#### Exit criteria for moving items to `DONE.md`
- All four mascot states display correctly and are triggered by the correct events.
- Flag sprite, donut sprite, triggered donut all render without console errors.
- Incorrect flag × indicator appears only on wrongly flagged tiles, only on loss.
- No layout overflow caused by sprites.
- No console errors.

---

### Phase 6 — Input hardening — mobile touch and right-click

#### Goal
Ensure all input works correctly on touch devices. Long-press flags a tile. Tapping reveals. Context menu is completely suppressed on the grid. Tile touch targets meet the 44 px minimum.

#### Scope
- Long-press detection: `touchstart` starts a 400 ms timer; `touchend` before 400 ms = tap (reveal); at 400 ms = flag toggle + cancel the touch-as-reveal.
- `touch-action: none` on all grid tiles (prevents scroll/zoom on tile interaction).
- `touchmove` during a long-press cancels the flag action (user is scrolling, not flagging).
- Haptic feedback: call `navigator.vibrate(10)` on flag toggle if available — wrapped in a try/catch.
- Verify `event.preventDefault()` on `contextmenu` is scoped to `#grid` only.
- Verify tapping a flagged tile has no effect (reveal is blocked).
- Long-pressing a flagged tile removes the flag.
- Touch target size: confirm tiles are ≥ 44 px at minimum mobile viewport through CSS inspection.
- Mascot button tap triggers new game without delay (no long-press timer on the mascot).

#### Expected files to change
- `render.js` (or `input.js` if split out) — touch event handlers
- `style.css` — `touch-action: none` on `.tile`

#### Dependencies
- Phase 5 complete. Sprites and mascot state must be stable before testing touch input because touch testing requires a real device or DevTools Device Mode.

#### Risks
- **Medium.** Long-press on mobile has known pitfalls:
  - iOS Safari fires `touchcancel` during scroll, which must abort the long-press timer.
  - The 400 ms timer must be cleared on `touchmove` with a displacement threshold (e.g., > 10 px) — otherwise scrolling past a tile incorrectly flags it.
  - iOS Safari may show a text-selection/context menu after long-press — mitigate with `user-select: none` and `-webkit-touch-callout: none` on tiles.
- Haptic vibration is unavailable on iOS entirely (`navigator.vibrate` is not supported); this is acceptable per requirements.

#### Tests and checks to run
- Manual (Chrome DevTools Device Mode, 375 px): tap a tile — verify reveal.
- Manual (Device Mode): long-press a tile ≥ 400 ms — verify flag placed.
- Manual (Device Mode): long-press and move finger > 10 px before 400 ms — verify no flag placed.
- Manual (Device Mode): tap a flagged tile — verify no reveal.
- Manual (Device Mode): long-press a flagged tile — verify flag removed.
- Manual (Device Mode): scroll the page during a long-press — verify no flag placed.
- Manual (real Android device if available): verify haptic fires on flag.
- Manual (desktop): right-click on a tile — verify no context menu.
- Manual (desktop): right-click outside the grid — verify context menu appears normally.
- Verify touch targets ≥ 44 px via DevTools computed styles at 375 px viewport.

#### Review check before moving work to `DONE.md`
- [ ] Long-press timer is cleared on `touchmove` with a displacement threshold.
- [ ] `touchcancel` aborts the long-press timer.
- [ ] `user-select: none` and `-webkit-touch-callout: none` applied to tiles.
- [ ] Haptic is wrapped in a feature check and try/catch.
- [ ] Touch target minimum 44 px verified via DevTools at 375 px.
- [ ] No desktop interaction regressions (left-click, right-click, mascot button).
- [ ] `TODO.md` updated with Phase 7 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 6 — Mobile Input

- [ ] Implement long-press detection: 400 ms timer on touchstart
- [ ] Clear timer on touchend (< 400 ms = tap = reveal)
- [ ] Clear timer on touchmove if displacement > 10 px
- [ ] Clear timer on touchcancel
- [ ] Wire long-press → toggleFlag()
- [ ] Wire tap → revealTile() (only if game in progress and tile is hidden)
- [ ] Apply touch-action: none to .tile
- [ ] Apply user-select: none and -webkit-touch-callout: none to .tile
- [ ] Add navigator.vibrate(10) on flag toggle with feature check and try/catch
- [ ] Suppress contextmenu on #grid only (event.preventDefault)
- [ ] Verify context menu suppression scoped to grid
- [ ] Manual Device Mode: tap reveals tile
- [ ] Manual Device Mode: long-press flags tile
- [ ] Manual Device Mode: long-press + move cancels flag
- [ ] Manual Device Mode: scroll past tile does not flag
- [ ] Verify touch targets ≥ 44 px at 375 px viewport
- [ ] Update TODO.md with Phase 7 entries
```

#### Exit criteria for moving items to `DONE.md`
- All Device Mode manual tests above pass.
- No context menu on grid (desktop and mobile).
- Touch targets ≥ 44 px confirmed in DevTools at 375 px.
- No desktop regression: left-click, right-click, mascot button all work as before.
- No console errors.

---

### Phase 7 — Micro-animations and feedback effects

#### Goal
Add all micro-animations specified in `requirements.md §5`. Every animation must use `transform` and `opacity` only, be ≤ 200 ms (except the 1 000 ms win overlay), and must not cause layout reflow.

#### Scope
**Tile animations (§5.1)**:
- Hover: `translateY(-1px)` on `.tile--hidden:hover` via CSS transition (100 ms).
- Reveal: fade-in + slight scale: `.tile--revealed` — CSS enter animation (`opacity 0→1`, `scale 0.95→1`, 100 ms).
- Flag placed: bounce down 2 px and back (CSS `@keyframes`, 120 ms).
- Flag removed: reverse bounce (CSS `@keyframes`, 120 ms).

**Mine explosion (§5.2)**:
- 3-frame CSS `@keyframes` animation on the triggered tile: 180 ms total, then `animation-fill-mode: forwards` to freeze on final frame.
- After 180 ms, passive mines are revealed (via a `setTimeout(180)` in the renderer, then re-render).

**Mascot animations (§5.3)**:
- Hover wiggle: 2 px left-right translate, one cycle, ~150 ms CSS transition.
- Click squish: `scale(0.9)` on `mousedown`, revert on `mouseup`.
- Win: `mascot--win` class triggers a sparkly-eyes CSS animation; a sparkle overlay `<div>` covers the board with `pointer-events: none` containing `✦` glyphs animated for 1 000 ms then fading.
- Loss: `mascot--loss` class triggers crying-sprinkles loop CSS; all `.mine--passive` tiles get a single 200 ms bounce `@keyframes`.

**Global animation constraint**: `prefers-reduced-motion` media query — all animations must be disabled or reduced when this is set.

#### Expected files to change
- `style.css` — all `@keyframes` and transition rules
- `render.js` — `setTimeout` for post-explosion passive mine reveal; add/remove animation classes; insert/remove sparkle overlay div

#### Dependencies
- Phase 6 complete. All input must be stable before adding animations, since animations interact with event timing (especially the 180 ms explosion delay).

#### Risks
- **Medium.** The mine explosion's 180 ms `setTimeout` introduces an async gap during which the game is in a transitional state. Risk: a re-render triggered by an unrelated event during that 180 ms could double-apply animations. Mitigation: lock all grid input immediately on loss (already done in Phase 3/§7.5) so no re-render is possible during the delay.
- Win overlay `pointer-events: none` must be verified to actually not block the mascot button click — test explicitly.
- `prefers-reduced-motion` is easy to forget; make it a checklist gate.

#### Tests and checks to run
- Manual: hover over hidden tiles — verify 1 px lift (desktop only).
- Manual: reveal a tile — verify fade-in scale animation visible.
- Manual: place and remove a flag — verify bounce in both directions.
- Manual: trigger a mine — verify 3-frame explosion animation, then passive mines appear after ~180 ms.
- Manual: reach win state — verify sparkle overlay animates for ~1 s then fades; mascot shows win face.
- Manual: reach loss state — verify mascot loss animation and passive mine bounce.
- Manual: click mascot button during win sparkle overlay — verify New Game starts (overlay does not block click).
- Manual: enable `prefers-reduced-motion` in DevTools (Rendering panel) — verify all animations disabled or reduced.
- Performance: open DevTools Performance tab, record a 5-second play session; verify no layout/paint reflows during animation events — only `composite` and `paint` entries acceptable.

#### Review check before moving work to `DONE.md`
- [ ] All animations use `transform` and `opacity` only (no `width`, `height`, `top`, `left` animations).
- [ ] Explosion `setTimeout` fires only once per loss; no double-application.
- [ ] Sparkle overlay has `pointer-events: none`.
- [ ] `prefers-reduced-motion` disables animations.
- [ ] No animation class persists after `newGame()` is called — renderer must strip all animation classes on reset.
- [ ] No layout reflow in DevTools Performance recording.
- [ ] `TODO.md` updated with Phase 8 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 7 — Micro-Animations

- [ ] Tile hover: translateY(-1px) on tile--hidden:hover, 100 ms CSS transition
- [ ] Tile reveal: opacity + scale fade-in, 100 ms CSS enter animation
- [ ] Flag placed: bounce keyframe, 120 ms
- [ ] Flag removed: reverse bounce keyframe, 120 ms
- [ ] Mine explosion: 3-frame keyframe on triggered tile, 180 ms, fill-mode forwards
- [ ] Passive mine reveal: setTimeout(180) after explosion, then re-render passive mines
- [ ] Mascot hover wiggle: 2 px translate, 150 ms
- [ ] Mascot click squish: scale(0.9) on mousedown, revert on mouseup
- [ ] Mascot win: sparkly-eyes CSS loop on mascot
- [ ] Win board sparkle overlay: pointer-events none div, ✦ glyphs, 1000 ms fade
- [ ] Mascot loss: crying-sprinkles CSS loop on mascot
- [ ] Passive mine bounce on loss: single 200 ms bounce keyframe on all mine--passive tiles
- [ ] prefers-reduced-motion: disable/minimize all animations in media query
- [ ] Verify newGame() strips all animation classes from all tiles and mascot
- [ ] Manual: verify explosion → passive reveal timing (~180 ms delay visible)
- [ ] Manual: click mascot during win overlay — New Game starts correctly
- [ ] DevTools Performance: verify no layout reflow during animations
- [ ] Update TODO.md with Phase 8 entries
```

#### Exit criteria for moving items to `DONE.md`
- All manual animation checks above pass.
- DevTools Performance recording shows no layout or forced-reflow events.
- `prefers-reduced-motion` check passes: all animations suppressed.
- New Game after win or loss resets all animation states cleanly.
- No console errors.

---

### Phase 8 — Win/loss state — end-game presentation full audit

#### Goal
Confirm that all win and loss behaviors match `requirements.md §2.6`, §2.7, §8.5, and §8.6 end-to-end, including all edge cases. This is a dedicated correctness audit phase, not a feature phase.

#### Scope
- Verify and fix (if needed):
  - Triggered mine: hot-pink background tile + frozen burst sprite + input locked.
  - Passive mine revelation: all appear simultaneously after the explosion.
  - Incorrect flag indicator (`×`): shown only on safe tiles that were flagged, not on mine tiles that were flagged.
  - Correctly flagged mines: shown as intact donuts with no `×`.
  - Mine counter accuracy: does not change after game end (no further flag interaction).
  - Mascot: correct face state, does not revert.
  - New Game from win state: full clean reset (no stale animation classes, no leftover sprites, mine counter back to 15).
  - New Game from loss state: same full clean reset.
  - Win state: all mine tiles retain whatever flag state was on them; non-mine tiles are all revealed; correctly detected.
  - Flood-fill win edge case: if last safe tile is opened via flood fill, win triggers correctly.
- Fix any bugs found. **No new features.**

#### Expected files to change
- `game.js` — bug fixes only
- `render.js` — bug fixes only
- `style.css` — minor fixes if visual bugs found

#### Dependencies
- Phase 7 complete. All animations must be in place so that end-game visual correctness can be fully assessed.

#### Risks
- **Low.** This is an audit phase. The main risk is discovering a logic bug that requires significant rework in `game.js`. If such a bug is found, it becomes a blocker that must be resolved before moving on — do not defer logic bugs to Phase 10.

#### Tests and checks to run
- Manual: play to win with a mix of correctly and incorrectly placed flags — verify win triggers, no `×` shown.
- Manual: play to loss with a mix of correctly flagged mines and incorrectly flagged safe tiles — verify `×` on safe tiles only.
- Manual: trigger loss, then click New Game — verify clean reset (mine counter = 15, all tiles hidden, correct mascot face).
- Manual: trigger win, then click New Game — verify same clean reset.
- Manual: force flood-fill win by revealing second-to-last safe tile adjacent to a 0-tile that triggers fill completing the win.
- Manual: place 16 flags (more than mine count) — verify mine counter shows `-1`; verify win still triggers correctly when all safe tiles are revealed.
- Manual: win mid-flood-fill (arrange board mentally or via console to construct the scenario).

#### Review check before moving work to `DONE.md`
- [ ] All end-game scenarios in `requirements.md §8.5` and §8.6 verified by hand.
- [ ] No incorrect `×` flag on a mine tile.
- [ ] New Game resets all state: game board, mine counter, mascot, animation classes.
- [ ] Over-flagging does not break win or mine counter.
- [ ] No console errors in any end-game scenario.
- [ ] `TODO.md` updated with Phase 9 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 8 — End-Game Audit

- [ ] Audit: triggered mine has hot-pink background and frozen burst
- [ ] Audit: passive mines appear simultaneously after explosion delay
- [ ] Audit: × shown only on incorrectly flagged safe tiles (not on correctly flagged mines)
- [ ] Audit: mine counter frozen after game end
- [ ] Audit: mascot face does not revert after win or loss until New Game
- [ ] Audit: New Game from win → full clean reset (mine counter 15, all hidden, neutral mascot)
- [ ] Audit: New Game from loss → full clean reset
- [ ] Audit: flood-fill win triggers correctly when last safe tile opened via fill
- [ ] Audit: over-flagging (16+ flags) → mine counter negative, win still works
- [ ] Fix any bugs found (tracked as sub-items under this entry)
- [ ] Update TODO.md with Phase 9 entries
```

#### Exit criteria for moving items to `DONE.md`
- All audit items above pass with no known outstanding bugs.
- No console errors in any tested scenario.

---

### Phase 9 — Accessibility, aria-live, and optional keyboard support

#### Goal
Add the minimal accessibility layer required by `requirements.md §10.5` and, if trivial, wire optional keyboard shortcuts.

#### Scope
- Add an `aria-live="polite"` region for game state announcements (e.g., "You win!", "Mine hit — game over", "New game started").
- Add `aria-label="New Game"` to the mascot button.
- Announce mine counter changes via `aria-live` (or via `aria-label` on the counter element).
- Keyboard focus visibility on grid tiles: `:focus-visible` outline in the pastel theme.
- **Optional keyboard support** (§6.3): only if it can be done in < 30 minutes of work:
  - `keydown` listener on `document`: `R` → `newGame()`, `F` → `toggleFlag` on focused tile.
  - Tiles must be focusable (`tabindex="0"`) to support `F`.
  - If this adds complexity (e.g., requires a focus tracking system), defer and mark as excluded.

#### Expected files to change
- `index.html` — add `aria-live` region, `aria-label` on mascot, `tabindex` on tiles (if keyboard supported)
- `render.js` — update `aria-live` text on game events; update tile `aria-label` attributes (e.g., `"Row 3, Column 5 — flagged"`)
- `style.css` — `:focus-visible` outline style

#### Dependencies
- Phase 8 complete and audited. Accessibility changes must not inadvertently re-introduce state management bugs.

#### Risks
- **Low.** Aria-live is a small addition. The main risk is `aria-live` announcing too aggressively during flood fill (100 tiles revealed rapidly). Mitigate by only announcing the game-level outcome (`win`, `loss`, `new game`), not individual tile reveals.

#### Tests and checks to run
- Manual: use macOS VoiceOver or Windows Narrator (or NVDA) — verify "You win!" and "Game over" are announced.
- Manual: click New Game — verify "New game started" or equivalent is announced.
- Manual: inspect mascot button — verify `aria-label="New Game"` in DOM.
- Manual: tab through page — verify focus outline is visible on focusable elements.
- If keyboard implemented: press `R` — verify new game starts. Press `F` on a focused tile — verify flag toggled.

#### Review check before moving work to `DONE.md`
- [ ] `aria-live` region exists and announces win, loss, and new game events.
- [ ] Mascot button has `aria-label="New Game"`.
- [ ] `aria-live` does not announce individual tile reveals (no flood-fill spam).
- [ ] Focus outline visible and on-theme.
- [ ] If keyboard support was NOT implemented, add an explicit note to `DONE.md` that it was evaluated and deferred.
- [ ] No regression in game logic or rendering.
- [ ] `TODO.md` updated with Phase 10 entries.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 9 — Accessibility

- [ ] Add aria-live="polite" region to index.html
- [ ] Announce "You win!" on win, "Game over" on loss, "New game" on reset
- [ ] Add aria-label="New Game" to mascot button
- [ ] Add :focus-visible outline to .tile in style.css
- [ ] Verify aria-live does NOT spam on flood fill (only game-level events announced)
- [ ] Manual: screen reader test — win and loss announcements heard
- [ ] Manual: New Game announcement heard
- [ ] Evaluate optional keyboard support (R + F keys); implement if < 30 min effort
- [ ] If keyboard NOT implemented: document decision in DONE.md
- [ ] Update TODO.md with Phase 10 entries
```

#### Exit criteria for moving items to `DONE.md`
- `aria-live` region exists in DOM and announces win/loss/new-game (verified manually with screen reader or Accessibility > Live Regions in DevTools).
- `aria-label="New Game"` present on mascot button (inspected in DOM).
- Focus outline visible on tiles.
- No console errors.

---

### Phase 10 — Final stabilization, cross-browser smoke tests, definition of done

#### Goal
Confirm the complete game works correctly end-to-end across all target browsers and devices, with no known bugs, no console errors, no layout issues, and all requirements from `requirements.md` met.

#### Scope
- Cross-browser smoke test matrix: Chrome, Firefox, Safari, Edge — all at current stable versions.
- Mobile smoke tests: Chrome on Android (Device Mode minimum; real device preferred), Safari on iOS (Device Mode minimum).
- Verify total page weight < 100 KB uncompressed (using DevTools Network tab, disable cache).
- Final read-through of `requirements.md`: confirm every requirement is met or explicitly excluded.
- Fix any remaining bugs. No new features.
- Update `GEMINI.md` if any project-level context has changed.
- Move all completed `TODO.md` entries to `DONE.md`.
- Mark the plan's definition of done as satisfied.

#### Expected files to change
- `game.js`, `render.js`, `style.css`, `index.html` — bug fixes only
- `TODO.md` — cleared / moved to `DONE.md`
- `DONE.md` — all completed entries present
- `GEMINI.md` — updated if needed

#### Dependencies
- All phases 1–9 complete and their exit criteria met.

#### Risks
- **Low to medium.** Safari on iOS has the highest regression risk for touch input and CSS animations. If a Safari-specific bug is found:
  - Touch: typically fixed with `-webkit-` prefixes or `touchcancel` handling.
  - Animations: typically fixed with explicit `will-change: transform` declarations.
- Page weight: the pixel font is the most likely overage source. If font > target, self-host a subset or replace with a CSS-drawn digit approach.

#### Tests and checks to run
- Open `index.html` directly (no server) in Chrome, Firefox, Edge on desktop — full play-through to win and loss.
- Open in Safari on macOS — same play-through.
- Open in Chrome DevTools Device Mode (375 px, 360 px) — full play-through including long-press, tap, flag.
- Open on real mobile device if available.
- DevTools Network tab (disable cache): verify total transferred < 100 KB.
- DevTools Console: verify zero errors and zero warnings across all browsers.
- `requirements.md` checklist: review each requirement section and confirm or document.
- `prefers-reduced-motion`: enable in OS/DevTools and confirm all animations suppressed.
- Accessibility: screen reader announcement of win/loss.

#### Review check before moving work to `DONE.md`
- [ ] All target browsers show no console errors.
- [ ] Full play-through (win + loss) passes in all target browsers.
- [ ] Mobile touch input verified in Device Mode and/or real device.
- [ ] Total page weight < 100 KB.
- [ ] Every non-trivial requirement in `requirements.md` is accounted for in `DONE.md`.
- [ ] `TODO.md` is empty or contains only explicitly deferred items with a note.
- [ ] `DONE.md` accurately reflects project completion.

#### Exact `TODO.md` entries to refresh from this phase

```
## Phase 10 — Stabilization

- [ ] Smoke test: Chrome desktop — win play-through
- [ ] Smoke test: Chrome desktop — loss play-through
- [ ] Smoke test: Firefox desktop — win and loss
- [ ] Smoke test: Safari desktop — win and loss
- [ ] Smoke test: Edge desktop — win and loss
- [ ] Smoke test: Chrome DevTools Device Mode 375 px — win and loss
- [ ] Smoke test: Chrome DevTools Device Mode 360 px — layout no-overflow check
- [ ] Smoke test: iOS Safari Device Mode — win and loss (or real device)
- [ ] Verify total page weight < 100 KB (DevTools Network, disable cache)
- [ ] Verify zero console errors in all tested browsers
- [ ] prefers-reduced-motion: verify all animations suppressed
- [ ] Screen reader: verify win/loss announcements
- [ ] requirements.md checklist: confirm all non-excluded requirements are met
- [ ] Move all completed items from TODO.md to DONE.md
- [ ] Update GEMINI.md with any changed project context
- [ ] Mark overall project as complete in DONE.md
```

#### Exit criteria for moving items to `DONE.md`
- All smoke tests above pass.
- Zero console errors in Chrome, Firefox, Safari, Edge.
- Page weight < 100 KB verified.
- `requirements.md` checklist completed with no unresolved items.
- `TODO.md` is empty or contains only explicitly noted deferred items.

---

## Dependency Notes

```
Phase 1 (scaffold)
  └── Phase 2 (game logic)
        └── Phase 3 (rendering + interaction)
              └── Phase 4 (visual theme)
                    └── Phase 5 (sprites + mascot)
                          └── Phase 6 (mobile input)
                                └── Phase 7 (animations)
                                      └── Phase 8 (end-game audit)
                                            └── Phase 9 (accessibility)
                                                  └── Phase 10 (stabilization)
```

The chain is strictly linear. No two phases are safely parallelizable because each phase's output is required by the next:
- Animation work (Phase 7) depends on stable sprites (Phase 5) because animation class names reference sprite states.
- Mobile input hardening (Phase 6) depends on stable layout and sprites (Phase 5) so that touch targets can be verified against final tile sizes.
- The end-game audit (Phase 8) depends on animations (Phase 7) being in place so that every visual aspect of win/loss can be assessed in its final form.

---

## Review Policy

- **Review cadence**: one phase per review cycle. A review cycle is a single sitting with a deliberate check against the phase's exit criteria.
- **Maximum phase size**: no phase should take more than one focused work session (approximately 2–4 hours). If a phase, once started, appears larger than this threshold, it must be split and the plan updated before continuing.
- **Oversized phases**: if a phase cannot be reviewed as a single coherent change (i.e., the diff is too large to reason about), it must be split. This is not optional.
- **Mixed-concern diffs**: a PR or change set that spans multiple phases' scope is not allowed to proceed as a single review unit. Split it.
- **Bug fixes**: bugs discovered during a phase are fixed in that phase before its exit criteria are marked complete. If a bug spans phases (e.g., a logic bug discovered in Phase 7), it is fixed in `game.js`/`render.js` as a sub-item of that phase, not carried forward.
- **Scope creep gate**: any work not explicitly described in the phase scope must be written to `TODO.md` for a future phase — it does not enter the current phase.

---

## Definition of Done for the Plan

The project is complete when all of the following are true:

1. `index.html` opens directly in Chrome, Firefox, Safari, and Edge with zero console errors.
2. A complete game play-through (win and loss) is achievable in all four browsers.
3. All requirements in `requirements.md` are either implemented or explicitly listed as excluded, with a note in `DONE.md`.
4. Total uncompressed page weight is < 100 KB.
5. All micro-animations run at 60 fps (verified via DevTools) and are disabled under `prefers-reduced-motion`.
6. Mobile touch input (tap to reveal, long-press to flag) works correctly in Chrome DevTools Device Mode at 375 px.
7. All game logic edge cases from `requirements.md §8` pass manual verification.
8. `aria-live` announcements for win, loss, and new-game events function correctly.
9. `TODO.md` is empty (or contains only explicitly deferred out-of-scope items with justification).
10. `DONE.md` lists every completed `TODO.md` entry from all ten phases.

---

## Open Questions

### Blocking

None currently identified. All decisions required to begin Phase 1 are resolved.

### Non-blocking (must be decided before the relevant phase begins)

| Question | Affects | Decision needed by |
|---|---|---|
| **Pixel font choice**: Use Press Start 2P via Google Fonts CDN, or self-host a subset, or render digits as CSS shapes? Google Fonts CDN is the simplest but adds an external network dependency and may push page weight over 100 KB if the full font is loaded. | Phase 4 | Before Phase 4 starts |
| **Sprite implementation approach**: Inline SVG strings generated by the renderer, CSS `clip-path`/`box-shadow` pixel art, or embedded data-URI PNGs? SVG is most expressive; CSS shapes are most portable; data-URI PNGs require an asset generation step. | Phase 5 | Before Phase 5 starts |
| **Single file vs. 2–3 file bundle**: `requirements.md §10.1` allows either. A single `index.html` with embedded CSS/JS is simplest to open without a server. Separate files are easier to maintain. No impact on behavior either way. | Phase 1 | Before Phase 1 starts (low stakes) |
| **Tile color choice for hidden tiles**: Requirements say "soft peach or lavender" — one color must be chosen and applied consistently. | Phase 4 | Before Phase 4 starts |
