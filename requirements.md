You are a meticulous senior product + game designer and software architect.

Your task: REVIEW and IMPROVE the following REQUIREMENTS.md for a small one-page web game.

Context:
- The game is a simple, static-screen Minesweeper clone.
- Theme: whimsical “Pastel Donut-Sweeper” — exploding donut mines, pastel pixel graphics.
- One difficulty only (10x10 board), casual vibe (no timers, no meta systems beyond what’s explicitly specified).
- Implementation target: small, clean web app (HTML/CSS/JS or similar), no backend.

I will now give you the current REQUIREMENTS.md. Treat it as the single source of truth to critique and refine.

--- BEGIN REQUIREMENTS.MD ---

Pastel Donut‑Sweeper — One‑Page Web Game
A whimsical, pastel, pixel‑art Minesweeper clone implemented as a single‑screen web app.
The game preserves classic Minesweeper mechanics while presenting them through a cozy, candy‑colored donut‑bakery theme.

1. Overview
1.1 Game Summary
Pastel Donut‑Sweeper is a small, casual, single‑page Minesweeper clone.
Players reveal tiles on a 10×10 grid, avoid exploding donut mines, and clear all safe tiles to win.

1.2 Core Concept & Theme
Whimsical pastel bakery aesthetic

Pixel‑art visuals

Mines are cute exploding donuts

Numbers, tiles, flags, and UI elements follow a candy pastel palette

Nostalgic Minesweeper feel with a soft, cozy twist

1.3 High‑Level Constraints
One‑page web app (HTML/CSS/JS)

No backend, no accounts, no persistence beyond optional localStorage

No menus, no difficulty selection

Casual: no timer, no best times, no achievements

Must run smoothly on desktop and mobile browsers

2. Core Gameplay Rules
2.1 Board
Fixed 10×10 grid

Fixed mine count: 12–15 mines (exact number chosen at implementation time)

Mines placed randomly at game start

2.2 First‑Click Behavior
First click must always be safe

If the first clicked tile contains a mine, regenerate the board until it does not

2.3 Tile States
Each tile can be:

Hidden (default)

Revealed

Flagged

2.4 Revealing Tiles
Revealing a mine triggers loss

Revealing a numbered tile shows a number (1–8) based on adjacent mines

Revealing an empty tile (0 adjacent mines) triggers a flood fill reveal of connected empty tiles and their borders

2.5 Flagging
Flags mark suspected mines

Flags do not prevent revealing via direct click (classic behavior)

Flags do not need to be correct to win

2.6 Win Condition
All non‑mine tiles are revealed

Flags are irrelevant to win detection

2.7 Loss Condition
Revealing a mine triggers the donut explosion animation

All mines become visible

2.8 Excluded Mechanics
No chord‑clicking (clicking a number to reveal neighbors)

No hint system

No advanced logic helpers

3. UI Layout
3.1 Static Layout
The screen contains:

Top Bar

Mine counter (remaining mines = total mines − flags)

Donut mascot button (acts as “New Game”)

Game Grid

10×10 tile matrix centered on the page

3.2 Layout Constraints
Desktop: no scrolling

Mobile: scrolling allowed only if necessary

Everything fits within a single visible page

3.3 Donut Mascot Button
Pixel‑art donut with a face

Acts as the New Game button

States:

Neutral (default)

Surprised (on mousedown)

Crying sprinkles (loss)

Sparkly eyes (win)

4. Visual Style & Theme
4.1 General Aesthetic
Pixel‑art

Candy pastel palette (mint, peach, lavender, baby blue, soft yellow)

Soft shading, gentle highlights

No harsh edges or high‑contrast outlines

4.2 Tiles
Hidden tiles:

Slightly raised pastel squares

Frosted appearance with a small pixel highlight

Revealed tiles:

Flat pastel tiles

Subtle shading to differentiate from hidden tiles

4.3 Numbers
Pastel reinterpretations of classic Minesweeper colors:

1 → baby blue

2 → mint green

3 → coral pink

4 → lavender

5 → golden yellow

6 → teal

7 → rose

8 → soft gray

4.4 Mines (Exploding Donuts)
Cute donut with frosting and sprinkles

When triggered, donut “pops” into a sprinkle burst

Donut remains visible after explosion

4.5 Flags
Tiny pastel pennants with a star symbol

5. Micro‑Animations & Feedback
Animations must be short (80–200ms), subtle, and performance‑light.

5.1 Tile Animations
Hover (desktop): 1‑pixel lift

Reveal: quick pastel glow fade‑in

Flag placement: small bounce

5.2 Mine Explosion
3‑frame sprinkle burst

Cute, not chaotic

5.3 Mascot Animations
Hover wiggle

Click squish

Win: sparkly eyes + 1‑second sparkle overlay on board

Loss: crying sprinkles + all mines do a tiny synchronized bounce

6. Input & Controls
6.1 Desktop
Left‑click: reveal tile

Right‑click: toggle flag

Click mascot: new game

6.2 Mobile
Tap: reveal tile

Long‑press: toggle flag

Tap mascot: new game

6.3 Optional Keyboard Support
(Only if trivial to implement)

R → restart

F → toggle flag on hovered tile

7. Game Logic Details
7.1 Adjacency
Classic Minesweeper 8‑way adjacency  
(N, NE, E, SE, S, SW, W, NW)

7.2 Flood Fill
Standard Minesweeper flood fill for empty tiles

Reveals all connected 0‑tiles and their numbered borders

7.3 Mine Counter
Displays remaining mines = total mines − flags

Updates immediately when flags are toggled

7.4 Quality‑of‑Life Rules
First click safe

No tile can be revealed twice

Game ends immediately on win or loss

8. Non‑Goals / Out of Scope
To protect simplicity, the following are explicitly excluded:

Multiple difficulties

Custom board sizes

Timers or best times

Achievements or progression

Skins or alternate themes

Settings menu (except optional sound toggle)

Backend, accounts, cloud saves

Multiplayer

Complex particle systems

Solver tools or hint systems

9. Edge Cases & Expected Behavior
9.1 First Click on a Mine
Regenerate board until first tile is safe

9.2 Page Refresh
Current game is lost

New game is generated automatically

9.3 Win State
All non‑mine tiles revealed

Mascot switches to win state

Optional sparkle overlay

9.4 Loss State
Mine explosion animation

All mines revealed

Mascot switches to loss state

9.5 No Soft‑Locks
Game must always remain playable

No ambiguous states allowed

10. Technical Constraints
10.1 Architecture
Single HTML file + CSS + JS (or small bundle)

No backend

No build system required (optional)

10.2 Performance
Smooth on desktop and mobile

Animations must not cause layout shifts

Avoid heavy libraries

10.3 Libraries / Frameworks
Vanilla JS preferred

Lightweight libraries allowed if they do not bloat the project

--- END REQUIREMENTS.MD ---

Your goals:

1. Clarity and structure
   - Identify any ambiguous, vague, or conflicting statements.
   - Ensure every requirement is written in a way that a developer can implement without guessing.
   - Propose a clearer structure if needed (e.g., sections like: Overview, Core Gameplay, UI Layout, Visual Style, Animations, Input & Controls, Edge Cases, Non-Goals).

2. Completeness of gameplay rules
   - Verify that all core Minesweeper mechanics are either:
     - Explicitly included, or
     - Explicitly excluded (if intentionally simplified).
   - Check that the following are clearly specified:
     - Board size and mine count behavior.
     - First-click behavior (e.g., guaranteed safe?).
     - Win condition and loss condition.
     - How numbers are derived and displayed.
     - Flagging rules and any chord-like interactions (if present or intentionally omitted).

3. UX and interaction details
   - Ensure input behavior is fully described for:
     - Desktop (mouse, possibly keyboard).
     - Touch devices (tap, long-press, etc.), if in scope.
   - Check that hover, click, and press states are described where they matter.
   - Confirm how the “New Game” interaction works (e.g., donut mascot button behavior).

4. Visual and thematic consistency
   - Check that the fantasy/whimsical pastel donut theme is:
     - Consistent across tiles, mines, flags, mascot, and UI chrome.
     - Described concretely enough that an artist or front-end dev can implement it without constant questions.
   - Ensure color usage (pastel palette, number colors) is specified enough to preserve readability and accessibility.

5. Micro-animations and feedback
   - Verify that all mentioned micro-animations (tile reveal, flag bounce, donut explosion, mascot wiggle, win/lose effects) are:
     - Clearly described.
     - Bounded in scope (short, subtle, not performance-heavy).
   - Suggest improvements where animations could better support feedback (e.g., differentiating win vs loss, or emphasizing mistakes) without adding complexity.

6. Simplicity and scope control
   - Identify anything that risks scope creep or contradicts the “small, one-page, casual” constraint.
   - Flag any features that feel like overkill for this project (e.g., complex settings, multiple modes, heavy achievement systems).
   - Propose explicit NON-GOALS to protect simplicity (e.g., “No multiplayer”, “No custom boards”, “No account system”, “No skins beyond the core pastel donut theme”).

7. Testability and edge cases
   - Highlight missing edge cases (e.g., all mines except one tile, first click on a mine, no safe moves, etc.).
   - Suggest small additions that make the requirements more testable:
     - Clear statements like “It must be impossible for the first click to hit a mine.”
     - Behavior when the user refreshes the page mid-game.
   - Ensure win/loss states and transitions are unambiguous.

8. Output format
   - First, provide a high-level critique: what’s strong, what’s weak, what’s missing.
   - Then, provide a REVISED version of REQUIREMENTS.md that:
     - Keeps the original intent and constraints.
     - Improves clarity, structure, and completeness.
     - Uses clean headings and bullet points.
   - Do NOT invent large new features; only propose small, coherent additions that align with the existing vision.

Be very concrete and specific. Avoid generic advice. Every suggestion should be actionable for someone implementing this exact game.
