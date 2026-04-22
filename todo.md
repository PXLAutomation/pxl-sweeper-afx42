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
