## Phase 1 — Scaffold ✅

- [x] Create index.html with top bar and 10×10 grid container
- [x] Create style.css with CSS reset and palette custom properties
- [x] Create game.js as empty module stub with buildGrid()
- [x] Confirm grid renders 100 placeholder tile divs (console assertion)
- [x] Confirm no console errors on page load in Chrome and Firefox
- [x] Confirm image-rendering: pixelated on grid container (computed styles)
- [x] Confirm window.Game exists as empty object
- [x] Confirm mascot button has aria-label="New Game"
- [x] Run all Phase 1 console assertions — zero FAIL messages
- [x] Update todo.md with Phase 2 entries before marking Phase 1 done

## Phase 2 — Core Logic ✅

- [x] Define board data model (100-element array, tile objects)
- [x] Implement newGame() — resets board, no mines placed yet
- [x] Implement post-first-click mine placement excluding clicked tile + neighbors
- [x] Implement adjacency count calculation for all tiles
- [x] Implement iterative BFS flood fill
- [x] Implement revealTile(row, col) returning game event object
- [x] Implement toggleFlag(row, col) — no-op on revealed tile
- [x] Implement getMineCount() → total - flagged
- [x] Implement win check after flood fill completes
- [x] Expose all functions on window.Game
- [x] Console-verify: first click never hits a mine
- [x] Console-verify: flood fill terminates without infinite loop
- [x] Console-verify: win detection triggers on correct final reveal
- [x] Console-verify: loss detection triggers on mine reveal
- [x] Console-verify: getMineCount returns correct values under flag manipulation
- [x] Update todo.md with Phase 3 entries

## Phase 3 — Rendering and Interaction ✅

- [x] Create render.js with render() as pure state-to-DOM projection
- [x] Add data-state and data-count attributes to tile elements in render()
- [x] Render tile state as CSS classes: tile--hidden, tile--revealed, tile--flagged
- [x] Display adjacency number as text content in revealed numbered tiles
- [x] Update mine counter display after every action
- [x] Wire left-click → revealTile(), re-render
- [x] Wire right-click → toggleFlag(), preventDefault, re-render
- [x] Wire mascot button → newGame(), render()
- [x] Apply state--win / state--loss class to body on game end
- [x] Block all grid input after win or loss (not the mascot button)
- [x] Manual play-through: win and loss both reachable
- [x] Manual: right-click context menu suppressed on grid, not elsewhere
- [x] Manual: flagged tile blocks reveal
- [x] Verify no console errors in Chrome and Firefox
- [x] Update todo.md with Phase 4 entries

## Phase 4 — Visual Theme ✅

- [x] Apply hidden tile style: pastel raised square, box-shadow simulation, base color
- [x] Apply revealed tile style: flat, slightly darker
- [x] Apply 8 number color rules via data-count attribute CSS selectors
- [x] Embed pixel font (Press Start 2P or equivalent); verify loading in Network tab
- [x] Apply font to mine counter and tile numbers
- [x] Top bar layout: counter left, mascot centered, correct padding and palette background
- [x] Tile size: 48×48 CSS px desktop, clamp() for mobile ≥ 44 px
- [x] Empty revealed tile (count 0) shows no number
- [x] Apply image-rendering: pixelated to grid
- [x] Verify layout at 1280 px: no scroll
- [x] Verify layout at 375 px: no scroll, tiles ≥ 44 px
- [x] Verify layout at 360 px: no horizontal overflow
- [x] Contrast check: document pass/fail for all 8 number colors (≥ 3:1)
- [x] Update TODO.md with Phase 5 entries

## Phase 5 — Sprites ✅

- [x] Implement flag sprite: coral pink pennant, white stick, star tip
- [x] Implement incorrect flag indicator: red × over flag, shown on loss for wrong flags only
- [x] Implement intact donut sprite (for passive mine reveal on loss)
- [x] Implement triggered donut: same donut, hot-pink/red tile background
- [x] Implement mascot neutral state sprite
- [x] Implement mascot surprised state sprite
- [x] Implement mascot win state sprite (sparkly eyes, no animation yet)
- [x] Implement mascot loss state sprite (crying, no animation yet)
- [x] Wire mascot state class changes: mousedown on tile → surprised
- [x] Wire mascot revert on mouseup/mouseleave if game in progress
- [x] Wire mascot win/loss state from game event
- [x] Verify mascot button click does NOT trigger surprised state
- [x] Verify all sprites render sharply at 1× and 2× DPR
- [x] Update TODO.md with Phase 6 entries

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
