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
