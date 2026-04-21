You are a meticulous senior product + game designer and software architect.

Your task: REVIEW and IMPROVE the following REQUIREMENTS.md for a small one-page web game.

Context:
- The game is a simple, static-screen Minesweeper clone.
- Theme: whimsical “Pastel Donut-Sweeper” — exploding donut mines, pastel pixel graphics.
- One difficulty only (10x10 board), casual vibe (no timers, no meta systems beyond what’s explicitly specified).
- Implementation target: small, clean web app (HTML/CSS/JS or similar), no backend.

I will now give you the current REQUIREMENTS.md. Treat it as the single source of truth to critique and refine.

--- BEGIN REQUIREMENTS.MD ---

[PASTE CURRENT REQUIREMENTS.MD HERE]

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
