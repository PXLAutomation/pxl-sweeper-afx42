# Pastel Donut‑Sweeper — One‑Page Web Game

A whimsical, pastel, pixel‑art Minesweeper clone implemented as a single‑screen web app.
The game preserves classic Minesweeper mechanics while presenting them through a cozy, candy‑colored donut‑bakery theme.

---

## 1. Overview

### 1.1 Game Summary
Pastel Donut‑Sweeper is a small, casual, single‑page Minesweeper clone.
Players reveal tiles on a 10×10 grid, avoid exploding donut mines, and clear all safe tiles to win.

### 1.2 Core Concept & Theme
- Whimsical pastel bakery aesthetic
- Pixel‑art visuals (all art drawn on a 16×16 pixel base, rendered at 3× scale = 48×48 CSS px per tile)
- Mines are cute exploding donuts
- Numbers, tiles, flags, and UI elements follow a candy pastel palette
- Nostalgic Minesweeper feel with a soft, cozy twist

### 1.3 High‑Level Constraints
- One‑page web app (HTML/CSS/JS)
- No backend, no accounts, no persistence beyond optional localStorage
- No menus, no difficulty selection
- Casual: no timer, no best times, no achievements
- Must run smoothly on all modern desktop and mobile browsers

---

## 2. Core Gameplay Rules

### 2.1 Board
- Fixed 10×10 grid
- Fixed mine count: **15 mines**
- Mines placed randomly on every new game

### 2.2 First‑Click Safety
- The first tile the player reveals is **always safe** (never a mine)
- Implementation: place mines *after* the first click, excluding the clicked tile and its 8 neighbors from mine placement
- This guarantees the first click always opens a non-trivial area and avoids regeneration loops

### 2.3 Tile States
Each tile has exactly one of three states at any time:

| State    | Description                          |
|----------|--------------------------------------|
| Hidden   | Default; content not visible         |
| Revealed | Content visible; no longer clickable |
| Flagged  | Marked by player; blocks reveal      |

### 2.4 Revealing Tiles
- **Flagged tiles cannot be revealed** by left-click / tap until the flag is removed first
- Revealing a mine triggers the loss sequence (see §2.7)
- Revealing a numbered tile (1–8) displays its count of adjacent mines
- Revealing an empty tile (0 adjacent mines) triggers a flood‑fill reveal of all connected empty tiles and their numbered border tiles
- Clicking an already-revealed tile does nothing
- Win condition is checked after every reveal, including after flood‑fill chains

### 2.5 Flagging
- Right-click (desktop) or long-press (mobile, ≥400 ms) toggles the flag on a hidden tile
- Toggling a flagged tile removes the flag, returning it to Hidden
- Revealed tiles cannot be flagged
- Flags do not need to be correctly placed to win
- Total flags placed is not capped (players may place more flags than there are mines)

### 2.6 Win Condition
- **All non-mine tiles are revealed**
- Flag placement is irrelevant to win detection
- Win is checked immediately after each reveal; if the condition is met mid-flood-fill, the game ends upon completion of that fill

### 2.7 Loss Condition
- Revealing a mine immediately ends the game
- The triggered mine plays its explosion animation
- After the explosion animation completes, all unrevealed mines are displayed as intact donuts
- The triggered mine remains visually distinct from passively revealed mines (see §4.4)
- Incorrectly flagged safe tiles display a crossed-out flag indicator
- All input on the grid is disabled; only the mascot New Game button remains active

### 2.8 Excluded Mechanics
- No chord-clicking (clicking a number to auto-reveal neighbors)
- No hint system
- No guaranteed-solvable board generation (positions requiring a guess are acceptable)

---

## 3. UI Layout

### 3.1 Static Layout
The page contains exactly two regions, stacked vertically and centered:

**Top Bar** (single row):
- Mine counter (left-aligned)
- Donut mascot button (centered)
- *(right side intentionally empty or used for symmetry padding)*

**Game Grid**:
- 10×10 tile matrix

### 3.2 Layout Constraints
- Desktop: entire layout visible without scrolling at viewport widths ≥ 360 px
- Mobile: tile size scales down to maintain no-scroll layout; minimum tile touch target is **44×44 CSS px**
- If the viewport is too small to fit even at minimum tile size, vertical scrolling is permitted as a fallback

### 3.3 Donut Mascot Button
- Pixel‑art donut with a face; renders at a fixed size (e.g., 48×48 CSS px)
- Acts as the **New Game** button at all times (during play, on win, on loss)
- Clicking it immediately resets the board and starts a new game

**Mascot face states:**

| State     | Trigger                                              |
|-----------|------------------------------------------------------|
| Neutral   | Default; game in progress                            |
| Surprised | `mousedown` or `touchstart` on any **board tile**    |
| Win       | Win condition reached; stays until New Game clicked  |
| Loss      | Loss condition reached; stays until New Game clicked |

- Surprised state reverts to Neutral on `mouseup` / `touchend` if the game has not ended
- Surprised state is not shown when clicking the mascot button itself

---

## 4. Visual Style & Theme

### 4.1 General Aesthetic
- Pixel‑art at 16×16 base resolution, rendered at 3× (48×48 CSS px per tile); no anti-aliasing (`image-rendering: pixelated`)
- Candy pastel palette: mint `#b5ead7`, peach `#ffb7b2`, lavender `#c7b4f0`, baby blue `#aec6cf`, soft yellow `#fffacd`
- Soft pixel shading; no harsh 1 px black outlines — use dark-tinted versions of each tile's own color for borders
- UI chrome (top bar background, page background) uses a light desaturated variant of the palette

### 4.2 Tiles
**Hidden tiles:**
- Slightly raised pastel square (simulated with a 1–2 px light top/left highlight and dark bottom/right shadow in tile color)
- Frosted base color: soft peach or lavender (single consistent color across all hidden tiles)

**Revealed tiles:**
- Flat (no raised effect)
- Slightly darker or more saturated variant of the hidden color to clearly distinguish from hidden tiles at a glance

### 4.3 Numbers
Numbers use a pixel font (e.g., a 5×7 bitmap font or equivalent). Colors:

| Number | Color         | Hex suggestion |
|--------|---------------|----------------|
| 1      | Baby blue     | `#6ec6e6`      |
| 2      | Mint green    | `#5ecb9e`      |
| 3      | Coral pink    | `#f4827a`      |
| 4      | Lavender      | `#9b84d4`      |
| 5      | Golden yellow | `#e8c43a`      |
| 6      | Teal          | `#3db8b8`      |
| 7      | Rose          | `#e8699a`      |
| 8      | Soft gray     | `#aaaaaa`      |

Numbers must remain legible against the revealed tile background; ensure a minimum contrast ratio of 3:1.

### 4.4 Mines (Exploding Donuts)

**Intact donut** (shown on loss for all non-triggered mines):
- Cute round donut shape with pastel frosting and 3–4 sprinkle pixels

**Triggered donut** (the mine the player clicked):
- Shown with a vivid red or hot-pink background tile to distinguish it from passive mines
- Displays the 3-frame sprinkle burst animation (see §5.2), then freezes on the final burst frame

**Passive mines revealed on loss:**
- Displayed as intact donuts on their revealed tile (no explosion animation)
- No red background

### 4.5 Flags
- Tiny pastel pennant with a star pixel at the tip
- Color: coral pink pennant on a short white pixel-stick
- **Incorrect flag indicator** (safe tile flagged, shown on loss): draw an "×" in red over the pennant

---

## 5. Micro‑Animations & Feedback

All animations must be:
- **Duration: 80–200 ms** (exception: win board overlay = 1 000 ms)
- CSS-only or minimal JS; no canvas-based particle systems
- Must not cause layout reflow or shifts (`transform` and `opacity` only)

### 5.1 Tile Animations

| Event           | Animation                                       |
|-----------------|-------------------------------------------------|
| Hover (desktop) | 1 px upward translate                           |
| Reveal          | Pastel glow fade-in (opacity + slight scale)    |
| Flag placed     | Small bounce (translate down 2 px then back)    |
| Flag removed    | Reverse bounce                                  |

### 5.2 Mine Explosion Animation
- 3-frame CSS animation on the triggered tile only: frame 1 = intact donut, frame 2 = half-burst (sprinkles spread 4 px), frame 3 = full burst (sprinkles spread 8 px), then freeze
- Total duration: 180 ms
- After the animation: transition to passive mine reveal of all other mines (no stagger needed; simultaneous is fine)

### 5.3 Mascot Animations

| Event     | Animation                                                      |
|-----------|----------------------------------------------------------------|
| Hover     | Gentle 2 px left-right wiggle (one cycle, ~150 ms)             |
| Click/tap | Squish: scale(0.9) on press, back on release                   |
| Win state | Sparkly eyes + 1 000 ms sparkle CSS overlay on the full board  |
| Loss state| Crying sprinkles (loop, CSS) + all intact mines bounce once    |

- Win sparkle overlay: semi-transparent layer of ✦ or ★ glyphs using CSS animation; must not block New Game click
- Loss mine bounce: simultaneous 1 px down-up translate on all revealed-mine tiles, 200 ms, once

---

## 6. Input & Controls

### 6.1 Desktop
| Action      | Input                       |
|-------------|-----------------------------|
| Reveal tile | Left-click on hidden tile   |
| Toggle flag | Right-click on hidden tile  |
| New game    | Click mascot button         |

- Right-click on the grid must call `event.preventDefault()` to suppress the browser context menu
- Right-clicking a flagged tile removes the flag
- Right-clicking a revealed tile does nothing

### 6.2 Mobile
| Action      | Input                                 |
|-------------|---------------------------------------|
| Reveal tile | Tap (< 400 ms) on hidden tile         |
| Toggle flag | Long-press (≥ 400 ms) on hidden tile  |
| New game    | Tap mascot button                     |

- Long-press must trigger haptic feedback if the device supports `navigator.vibrate` (10 ms pulse); treat as optional enhancement
- Long-pressing a flagged tile removes the flag
- Tapping a flagged tile does nothing (reveal is blocked)
- Default touch behaviors (scroll, zoom) must not fire when interacting with the grid; use `touch-action: none` on grid tiles

### 6.3 Optional Keyboard Support
*(Implement only if trivial; do not block release on this)*
- `R` → start new game
- `F` → toggle flag on the currently focused/hovered tile

---

## 7. Game Logic

### 7.1 Mine Placement
- Mines are placed **after** the first click
- The clicked tile and its up-to-8 neighbors are excluded from mine placement
- This guarantees at minimum a 1-tile safe opening; in practice usually opens a flood-fill area

### 7.2 Adjacency
- 8-way adjacency: N, NE, E, SE, S, SW, W, NW
- Corner tiles have 3 neighbors; edge tiles have 5; interior tiles have 8

### 7.3 Flood Fill
- Triggered when a tile with 0 adjacent mines is revealed
- Uses iterative BFS or DFS (not recursive, to avoid stack overflow on 100-tile board)
- Reveals all connected 0-tiles and all their numbered border tiles
- Stops at numbered tiles (does not expand through them)
- Win condition is evaluated once after the entire fill completes

### 7.4 Mine Counter Display
- Value: `total mines − flags placed` (may display negative values; not clamped)
- Displayed as an integer; no leading zeros needed
- Updates immediately when a flag is placed or removed

### 7.5 Input Lock
- All grid tile interactions are disabled immediately when win or loss is triggered
- The mascot New Game button remains active at all times

---

## 8. Edge Cases & Expected Behavior

### 8.1 First Click Safety
- It is **impossible** for the first click to reveal a mine
- Mines are placed post-click and explicitly exclude the clicked tile and its neighbors

### 8.2 Flood Fill Win
- If the final non-mine tile is revealed as part of a flood-fill chain, win is detected at the end of the fill
- The win animation plays correctly in this case

### 8.3 Page Refresh
- Current game progress is lost (no auto-save)
- A new game is generated and displayed immediately on load

### 8.4 Too Many Flags
- Players may place more flags than there are mines; the mine counter will show a negative number
- No cap is enforced

### 8.5 Loss State — Mine Differentiation
- The tile the player clicked (triggered mine): red/hot-pink background, frozen burst sprite
- All other mines: revealed as intact donut sprites, no background color change
- Incorrectly flagged safe tiles: crossed-out flag rendered over the flag sprite

### 8.6 Win State
- All non-mine tiles are revealed; flags may still be on mine tiles or safe tiles — this does not affect win
- Mascot switches to win (sparkly eyes) state
- Board sparkle overlay plays for 1 000 ms, then fades out
- Grid is locked; New Game button is the only active control

### 8.7 Solvability
- No requirement for boards to be solvable without guessing
- Guess-required positions are acceptable and expected for a casual game

### 8.8 Flagging a Revealed Tile
- Attempting to flag a revealed tile (via right-click or long-press) does nothing

---

## 9. Non‑Goals / Out of Scope
The following are explicitly excluded to protect simplicity:

- Multiple difficulties or board sizes
- Timers or best-time tracking
- Achievements, progression, or scoring
- Alternate skins or themes
- Settings menu or sound system
- Backend, accounts, or cloud saves
- Multiplayer
- Canvas-based particle systems
- Chord-clicking or solver/hint tools
- Guaranteed-solvable board generation

---

## 10. Technical Constraints

### 10.1 Architecture
- Single HTML file with embedded or co-located CSS and JS (or a minimal 2–3 file bundle)
- No backend; no server-side logic
- No build system required; plain files must work when opened directly in a browser

### 10.2 Performance
- Smooth 60 fps animations on mid-range mobile hardware
- No layout reflow during animations (`transform` and `opacity` only)
- No heavy libraries; total page weight target < 100 KB uncompressed

### 10.3 Browser Compatibility
- Target: last 2 versions of Chrome, Firefox, Safari, and Edge
- No IE or legacy browser support required

### 10.4 Libraries & Frameworks
- Vanilla JS strongly preferred
- Small utility libraries (e.g., a pixel-font renderer) allowed if < 20 KB and have no transitive dependencies

### 10.5 Accessibility (Minimal)
- Mine counter and game state (win/loss) must be announced via `aria-live` region
- Mascot button must have an accessible label (`aria-label="New Game"`)
- Keyboard focus must be visible on grid tiles when keyboard support is implemented
