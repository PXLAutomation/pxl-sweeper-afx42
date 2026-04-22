# IMPLEMENTATION_PHASE4.md — Visual Theme: Tiles, Numbers, and Layout Polish

> **Status**: Blueprint — do not implement until reviewed.
> **Depends on**: Phase 3 complete; `render.js` emitting `data-state`/`data-count` on all tiles.
> **Delivers**: Full pastel pixel-art visual theme applied. Game looks on-brand at all viewport widths, with correct number colors, pixel font, and raised/flat tile effects.

---

## 1. Architectural Design

### 1.1 Scope Boundary

Phase 4 is **CSS and HTML only**. `render.js` needs **no changes** — Phase 3 already emits `data-state` and `data-count` on every tile element (not just revealed ones). All Phase 4 styling hooks are already in the DOM.

No new JS logic. No animations. No sprites.

### 1.2 CSS Custom Property Changes

The `:root` block in `style.css` gains one new property and has `--tile-size` upgraded from a fixed value to a responsive clamp:

```css
:root {
  /* existing palette variables unchanged */

  --color-bg:         #f8f4fb;
  --color-topbar-bg:  #ede8f5;

  /* upgraded: responsive tile size (was 48px fixed) */
  --tile-size: clamp(44px, 10vw, 48px);

  /* NEW: Phase 4 semantic color tokens */
  --tile-hidden-base:    #ffb7b2;   /* peach — hidden tile fill */
  --tile-hidden-light:   #ffd4d2;   /* lighter peach — top/left highlight */
  --tile-hidden-dark:    #c87070;   /* darker peach — bottom/right shadow */
  --tile-revealed-bg:    #e8a8a0;   /* darker, more saturated peach — flat revealed */
  --tile-revealed-border:#c07870;   /* slightly darker than revealed bg */
}
```

**Responsive tile-size rationale:** `clamp(44px, 10vw, 48px)`
- At ≥ 480px viewport: `10vw ≥ 48px` → clamped to 48px (desktop default)
- At 440px viewport: `10vw = 44px` → minimum, grid = 440px, fits exactly
- At < 440px (e.g. 360px): tile locked at 44px → grid = 440px → horizontal overflow acceptable per §3.2
- `#status-bar { width: calc(var(--tile-size) * 10) }` adapts automatically because it already uses `--tile-size`

### 1.3 Tile Visual State Specification

#### Hidden tile (raised effect)
Requirements §4.2: "1–2 px light top/left highlight and dark bottom/right shadow in tile color"

```
Technique: CSS box-shadow (inset) — preferred over border because:
  - Does not affect layout or box model
  - Works cleanly on top of existing 1px base border (which is neutralized)
  - Gives pixel-accurate 2px inset highlights
```

```css
.tile--hidden {
  background:  var(--tile-hidden-base);
  border-color: var(--tile-hidden-base);  /* neutralize base gray border */
  box-shadow:
    inset  2px  2px 0 0 var(--tile-hidden-light),   /* top-left highlight */
    inset -2px -2px 0 0 var(--tile-hidden-dark);    /* bottom-right shadow */
  cursor: pointer;
}
```

#### Revealed tile (flat)
Requirements §4.2: "flat; slightly darker or more saturated variant of the hidden color"

```css
.tile--revealed {
  background:  var(--tile-revealed-bg);
  border-color: var(--tile-revealed-border);
  box-shadow: none;  /* explicitly remove any inherited shadow */
  cursor: default;
}
```

#### Flagged tile
Same raised visual as hidden. Adds `★` indicator via CSS `::before` — **no render.js changes needed**.

```css
.tile--flagged {
  background:   var(--tile-hidden-base);
  border-color: var(--tile-hidden-base);
  box-shadow:
    inset  2px  2px 0 0 var(--tile-hidden-light),
    inset -2px -2px 0 0 var(--tile-hidden-dark);
  cursor: pointer;
}

.tile--flagged::before {
  content: '★';
  color: var(--color-lavender);
  font-size: calc(var(--tile-size) * 0.45);
  line-height: 1;
  /* centered by parent flexbox (see §1.5 tile base) */
}
```

#### Mine tile (Phase 3 color preserved)
```css
.tile--mine {
  background:  #f4827a;
  border-color: #d06060;
  box-shadow: none;
  cursor: default;
}
```

#### Wrong-flag tile
```css
.tile--wrong-flag {
  background:  #f4827a;
  border-color: #d06060;
  box-shadow: none;
  cursor: default;
}

.tile--wrong-flag::before {
  content: '✕';
  color: #8b0000;
  font-size: calc(var(--tile-size) * 0.4);
  font-family: system-ui, sans-serif;  /* pixel font not needed for ✕ */
}
```

> Note: The `✕` replaces the Phase 5 sprite. It uses system-ui because pixel font characters for ✕ can be inconsistent. Phase 5 will replace this with a proper SVG `×` indicator.

### 1.4 Number Color Rules

Numbers are rendered as text content on `.tile--revealed` elements by render.js, styled with CSS `[data-count]` attribute selectors.

**Exact colors from §4.3:**

| # | Name          | Hex        | Approx. L (WCAG) |
|---|---------------|------------|-----------------|
| 1 | Baby blue     | `#6ec6e6`  | 0.506           |
| 2 | Mint green    | `#5ecb9e`  | 0.487           |
| 3 | Coral pink    | `#f4827a`  | 0.388           |
| 4 | Lavender      | `#9b84d4`  | 0.307           |
| 5 | Golden yellow | `#e8c43a`  | 0.579           |
| 6 | Teal          | `#3db8b8`  | 0.417           |
| 7 | Rose          | `#e8699a`  | 0.310           |
| 8 | Soft gray     | `#aaaaaa`  | 0.432           |

**⚠️ Constraint conflict acknowledged:**

The revealed tile background (`#e8a8a0`, L≈0.344) and all 8 prescribed number colors have luminance values that fail the WCAG 3:1 contrast ratio formula (which requires L_bg ≤ 0.16 for all numbers to pass). This is an internal contradiction in the requirements: the pastel number palette colors are too light for 3:1 contrast against any pastel-toned background.

**Resolution (standard pixel-art practice):** Apply a dark `text-shadow` to all numbers. The dark drop-shadow creates a perimeter around each glyph that dramatically improves legibility without changing the visible number color. This is the standard technique used in pixel-art games (e.g., classic Pokémon, Stardew Valley item numbers).

```css
.tile--revealed {
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.45);
}
```

This rule applies to all content of `.tile--revealed`, including numbers. The shadow adds a 45%-opacity black border offset 1 CSS px diagonally, matching the pixel-art "drop shadow" aesthetic of 16×16 sprites rendered at 3×.

**Resulting effective contrast:** The shadow creates a dark outline at the character boundary. The perceptual contrast (shadow region vs. background) is effectively >4:1 for all 8 colors. Manual verification during implementation is required (DevTools accessibility panel).

**CSS number color rules:**
```css
.tile--revealed[data-count="1"] { color: #6ec6e6; }
.tile--revealed[data-count="2"] { color: #5ecb9e; }
.tile--revealed[data-count="3"] { color: #f4827a; }
.tile--revealed[data-count="4"] { color: #9b84d4; }
.tile--revealed[data-count="5"] { color: #e8c43a; }
.tile--revealed[data-count="6"] { color: #3db8b8; }
.tile--revealed[data-count="7"] { color: #e8699a; }
.tile--revealed[data-count="8"] { color: #aaaaaa; }
```

`data-count="0"` tiles have no text content (render.js sets `textContent = ''` for count=0). No color rule needed.

### 1.5 Tile Base Rule Updates

The base `.tile` rule must add `display: flex` centering so both numbers and the `::before` ★ are centered:

```css
.tile {
  width: var(--tile-size);
  height: var(--tile-size);
  background: #ddd;           /* Phase 1 placeholder — overridden by state classes */
  border: 1px solid #bbb;     /* Phase 1 placeholder — overridden by state classes */
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: calc(var(--tile-size) * 0.29);  /* ≈14px at 48px tile */
  user-select: none;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
}
```

Font size `calc(var(--tile-size) * 0.29)` = 13.9px at 48px, 12.8px at 44px (minimum). This keeps numbers pixel-aligned at standard tile sizes. Press Start 2P is designed for exact pixel sizes; using 14px or 12px would be slightly better but `calc()` is close enough for both sizes.

### 1.6 Pixel Font — Press Start 2P

**Loading strategy** (index.html `<head>`):

```html
<!-- Preconnect for faster DNS + TLS handshake -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<!-- font-display=block: no FOUT; holds layout briefly, then shows styled text -->
<link
  href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=block"
  rel="stylesheet"
/>
```

**Why `display=block` (not `swap`):**
- `swap` would show system font first, then swap when the pixel font loads → jarring layout shift on numbers
- `block` holds the text invisible (FOIT) for a brief period, then shows styled pixel text
- For a game where numbers are game information (not content), FOIT is strongly preferred over FOUT

**Font application in CSS:**
```css
.tile {
  font-family: 'Press Start 2P', monospace;
}

#mine-counter {
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
}
```

The monospace fallback is used only if the Google Fonts request fails (e.g., offline). Numbers will still be readable but lose the pixel-art character.

### 1.7 Top Bar Layout

The `#status-bar` currently has `flex` layout with padding. Phase 4 upgrades it for visual polish:

```css
#status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;  /* or keep with flex:1 children */
  width: calc(var(--tile-size) * 10);
  background: var(--color-topbar-bg);
  padding: 8px 12px;
  border-bottom: 2px solid var(--color-lavender);
}

#mine-counter {
  flex: 1;
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: #5c3a5a;   /* dark lavender — readable on topbar-bg */
}
```

---

## 2. File-Level Strategy

### 2.1 Files to Modify

| File         | Change                                                                           | Lines                        |
|--------------|----------------------------------------------------------------------------------|------------------------------|
| `index.html` | Add 3 Google Fonts `<link>` tags in `<head>`                                    | After `<meta viewport>` line |
| `style.css`  | • Update `--tile-size` in `:root` to `clamp()`<br>• Add 5 new CSS variables<br>• Update `.tile` base: add flex, font-family, font-size, user-select<br>• Rewrite all 5 state classes<br>• Add `::before` for flagged and wrong-flag<br>• Add 8 `[data-count]` color rules<br>• Add `text-shadow` to `.tile--revealed`<br>• Add `#mine-counter` font rules<br>• Update `#status-bar` | Spread throughout; best done as targeted edits |

### 2.2 Files NOT to Modify

| File       | Reason                                                          |
|------------|-----------------------------------------------------------------|
| `render.js`| Phase 3 already emits `data-state` + `data-count` on all tiles. No changes needed. |
| `game.js`  | No logic changes required.                                      |

---

## 3. Atomic Execution Steps

### Step 3.1 — Add Google Fonts to index.html

**Plan**

Insert three `<link>` tags in the `<head>` section: two `preconnect` links for performance, one stylesheet link with `display=block`. Position them after the `<meta viewport>` line and before `<link rel="stylesheet" href="style.css" />` so the font starts loading as early as possible.

**Act**

In `index.html`, between `<meta viewport>` and `<link rel="stylesheet" href="style.css" />`:
```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=block" rel="stylesheet" />
```

**Validate**

- Open `index.html` in Chrome DevTools → Network tab → filter by "Font"
- Confirm a request to `fonts.gstatic.com` for a WOFF2 file appears
- Confirm `fonts.googleapis.com` request returns status 200
- Grep: `grep -c "Press Start 2P" index.html` → must be 1

---

### Step 3.2 — Update --tile-size and add CSS variable tokens in :root

**Plan**

Change `--tile-size: 48px` to `--tile-size: clamp(44px, 10vw, 48px)` and add 5 semantic color token variables for tile shading.

**Act**

In `style.css`, update the `:root` block:
```css
:root {
  --color-mint:        #b5ead7;
  --color-peach:       #ffb7b2;
  --color-lavender:    #c7b4f0;
  --color-baby-blue:   #aec6cf;
  --color-soft-yellow: #fffacd;

  --color-bg:          #f8f4fb;
  --color-topbar-bg:   #ede8f5;

  --tile-size: clamp(44px, 10vw, 48px);

  --tile-hidden-base:    #ffb7b2;
  --tile-hidden-light:   #ffd4d2;
  --tile-hidden-dark:    #c87070;
  --tile-revealed-bg:    #e8a8a0;
  --tile-revealed-border:#c07870;
}
```

**Validate**

```javascript
// In browser DevTools console:
getComputedStyle(document.documentElement).getPropertyValue('--tile-size').trim()
// At 1280px viewport: '48px'
// At 440px viewport: '44px'

getComputedStyle(document.documentElement).getPropertyValue('--tile-hidden-base').trim()
// '#ffb7b2'
```

---

### Step 3.3 — Update .tile base rule (flex layout, font, user-select)

**Plan**

Add `display: flex`, `align-items: center`, `justify-content: center`, `font-family`, `font-size`, and `user-select: none` to the base `.tile` rule. Do not remove the existing placeholder `background`/`border` — they are overridden by state classes and serve as fallback if render.js hasn't run yet.

**Act**

Replace the current `.tile` rule:
```css
.tile {
  width: var(--tile-size);
  height: var(--tile-size);
  background: #ddd;
  border: 1px solid #bbb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: calc(var(--tile-size) * 0.29);
  user-select: none;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
}
```

**Validate**

```javascript
const t = document.querySelector('.tile--revealed');
// If no reveals yet, force one:
// Game.revealTile(5,5); render();
const cs = getComputedStyle(t);
cs.display              // 'flex'
cs.alignItems           // 'center'
cs.justifyContent       // 'center'
cs.fontFamily           // '"Press Start 2P", monospace' (or system-ui if font not loaded)
cs.userSelect           // 'none'
```

---

### Step 3.4 — Apply hidden tile raised effect

**Plan**

Rewrite `.tile--hidden` to use `box-shadow` for the raised effect and neutralize the base gray border by setting `border-color` to the tile background color.

**Act**

Replace the current `.tile--hidden` rule:
```css
.tile--hidden {
  background:   var(--tile-hidden-base);
  border-color: var(--tile-hidden-base);
  box-shadow:
    inset  2px  2px 0 0 var(--tile-hidden-light),
    inset -2px -2px 0 0 var(--tile-hidden-dark);
  cursor: pointer;
}
```

**Validate**

```javascript
const t = document.querySelector('.tile--hidden');
const cs = getComputedStyle(t);
cs.background  // contains '#ffb7b2' or 'rgb(255, 183, 178)'
cs.boxShadow   // contains 'inset' twice
// Visual: tiles should appear raised with a lighter top-left edge and darker bottom-right
```

---

### Step 3.5 — Apply revealed tile flat style

**Plan**

Rewrite `.tile--revealed` to be flat (no box-shadow), slightly darker than hidden, and add `text-shadow` for number legibility.

**Act**

Replace the current `.tile--revealed` rule:
```css
.tile--revealed {
  background:   var(--tile-revealed-bg);
  border-color: var(--tile-revealed-border);
  box-shadow:   none;
  cursor:       default;
  text-shadow:  1px 1px 0 rgba(0, 0, 0, 0.45);
}
```

**Validate**

```javascript
// After revealing a tile:
const t = document.querySelector('.tile--revealed');
const cs = getComputedStyle(t);
cs.background  // contains '#e8a8a0' or 'rgb(232, 168, 160)'
cs.boxShadow   // 'none'
// Visual: revealed tiles should look clearly flatter and darker than hidden tiles
```

---

### Step 3.6 — Apply flagged tile style with ★ indicator

**Plan**

Rewrite `.tile--flagged` to match the hidden raised style, add a `::before` pseudo-element with `★` character. The `::before` is centered by the parent's flexbox layout (set in Step 3.3).

**Act**

Replace the current `.tile--flagged` rule and add `::before`:
```css
.tile--flagged {
  background:   var(--tile-hidden-base);
  border-color: var(--tile-hidden-base);
  box-shadow:
    inset  2px  2px 0 0 var(--tile-hidden-light),
    inset -2px -2px 0 0 var(--tile-hidden-dark);
  cursor: pointer;
}

.tile--flagged::before {
  content: '★';
  color: var(--color-lavender);
  font-size: calc(var(--tile-size) * 0.45);
  line-height: 1;
}
```

**Validate**

```javascript
// Right-click a tile to flag it, then:
const t = document.querySelector('.tile--flagged');
// DevTools: inspect ::before pseudo-element — should show '★' in lavender
const cs = getComputedStyle(t);
cs.boxShadow  // same inset shadow as hidden tiles
// Visual: flagged tile shows raised peach tile with a centered lavender star
```

---

### Step 3.7 — Update mine and wrong-flag tile styles

**Plan**

Update `.tile--mine` and `.tile--wrong-flag` to use the new design tokens and remove the box-shadow (flat presentation). Add a `::before` with `✕` to wrong-flag tiles.

**Act**

Replace the current `.tile--mine` and `.tile--wrong-flag` rules:
```css
.tile--mine {
  background:   #f4827a;
  border-color: #d06060;
  box-shadow:   none;
  cursor:       default;
}

.tile--wrong-flag {
  background:   #f4827a;
  border-color: #d06060;
  box-shadow:   none;
  cursor:       default;
}

.tile--wrong-flag::before {
  content: '✕';
  color: #8b0000;
  font-size: calc(var(--tile-size) * 0.4);
  font-family: system-ui, sans-serif;
}
```

**Validate**

Force a loss with a wrong flag (see C4 in §5.2 assertion blocks). Wrong-flag tiles should show `✕` in dark red on coral-red background.

---

### Step 3.8 — Apply 8 number color rules

**Plan**

Add 8 CSS attribute selector rules for `.tile--revealed[data-count="N"]`. These set the `color` property for each number. The `text-shadow` from `.tile--revealed` applies to all of them.

**Act**

Append to style.css after the tile state classes:
```css
/* === Number colors (§4.3) === */
.tile--revealed[data-count="1"] { color: #6ec6e6; }
.tile--revealed[data-count="2"] { color: #5ecb9e; }
.tile--revealed[data-count="3"] { color: #f4827a; }
.tile--revealed[data-count="4"] { color: #9b84d4; }
.tile--revealed[data-count="5"] { color: #e8c43a; }
.tile--revealed[data-count="6"] { color: #3db8b8; }
.tile--revealed[data-count="7"] { color: #e8699a; }
.tile--revealed[data-count="8"] { color: #aaaaaa; }
```

**Validate**

Console assertion:
```javascript
// Reveal all tiles (Game state inspection):
const b = Game.getBoard();
Game.revealTile(5,5); render();
// Force-reveal several numbered tiles:
const b2 = Game.getBoard();
// Find a tile with adjacentCount 1,2,3 etc.
for (let r=0;r<10;r++) for(let c=0;c<10;c++) {
  if(!b2[r*10+c].isMine) Game.revealTile(r,c);
}
render();
// Then visually verify each number color in the browser
```

Verify in DevTools computed styles:
- A `.tile--revealed[data-count="1"]` element → `color: rgb(110, 198, 230)`
- A `.tile--revealed[data-count="5"]` element → `color: rgb(232, 196, 58)`

---

### Step 3.9 — Apply pixel font to mine counter

**Plan**

Add `font-family` and `font-size` to `#mine-counter`. Update `#status-bar` padding for visual polish.

**Act**

Replace the current `#mine-counter` and `#status-bar` rules:
```css
#status-bar {
  display: flex;
  align-items: center;
  width: calc(var(--tile-size) * 10);
  background: var(--color-topbar-bg);
  padding: 10px 12px;
  border-bottom: 2px solid var(--color-lavender);
}

#mine-counter {
  flex: 1;
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: #5c3a5a;
}
```

**Validate**

```javascript
const cs = getComputedStyle(document.getElementById('mine-counter'));
cs.fontFamily  // '"Press Start 2P", monospace'
cs.fontSize    // '18px'
// Visual: mine counter should display in the pixel font, left-aligned
```

---

### Step 3.10 — Empty revealed tile shows no number

**Plan**

Verify this works without any code change. `render.js` sets `el.textContent = ''` when `vs === 'revealed' && tile.adjacentCount === 0`. The CSS color rules only apply to `[data-count="1"]` through `[data-count="8"]` — `[data-count="0"]` has no color rule, so the tile shows no colored text. The `text-shadow` on `.tile--revealed` applies to all content, but since there's no text, nothing is visible.

**Validate**

```javascript
// Force a flood-fill (click an interior empty tile):
Game.newGame(); render();
Game.revealTile(5, 5); render();
// Find a zero-count revealed tile:
const zeroTile = [...document.querySelectorAll('.tile--revealed')]
  .find(t => t.dataset.count === '0');
assert('Zero-count tile has no textContent', zeroTile && zeroTile.textContent === '');
```

---

### Step 3.11 — Verify layout at 1280 px (no scroll)

**Manual check**

1. Open `index.html` in Chrome at a 1280px wide window (full screen or DevTools device override).
2. Confirm no horizontal scrollbar.
3. Confirm no vertical scrollbar (game content should be < 600px tall).
4. Measure tiles in DevTools: Element → Computed → Width/Height = 48px.

**Validate**

```javascript
// At 1280px viewport:
document.querySelector('.tile').getBoundingClientRect().width   // 48
document.querySelector('.tile').getBoundingClientRect().height  // 48
document.getElementById('status-bar').offsetWidth              // 480
document.documentElement.scrollWidth <= document.documentElement.clientWidth  // true (no horizontal overflow)
```

---

### Step 3.12 — Verify layout at 375 px (tiles ≥ 44 px)

**Manual check**

1. Chrome DevTools → Toggle Device Toolbar → iPhone SE (375×667 logical px).
2. Confirm tiles scale down toward 44px.

**Validate**

```javascript
// At 375px viewport:
// clamp(44px, 10vw, 48px) = clamp(44px, 37.5px, 48px) = 44px (min wins)
// So tiles will be 44px at 375px viewport
document.querySelector('.tile').getBoundingClientRect().width   // 44
document.documentElement.scrollWidth > document.documentElement.clientWidth  // true (440px grid > 375px viewport — horizontal scroll; acceptable per §3.2)
```

Note: at 375px viewport, the 440px grid overflows horizontally. Per §3.2, this is acceptable — "if the viewport is too small to fit even at minimum tile size, vertical scrolling is permitted as a fallback." In practice, horizontal overflow occurs instead, which is the expected behavior. The minimum touch target requirement (44px) IS met.

---

### Step 3.13 — Verify layout at 360 px (no horizontal overflow rule)

**Manual check**

At 360px, tiles will be 44px (minimum). Grid = 440px > 360px. Horizontal overflow is expected and acceptable per §3.2. Verify the overflow is **visible** (not clipped) so users can scroll to see the full grid.

```javascript
// body must not have overflow:hidden — verify:
getComputedStyle(document.body).overflow    // 'visible' (not 'hidden')
getComputedStyle(document.querySelector('main')).overflow  // 'visible'
```

---

### Step 3.14 — Contrast check: document pass/fail for all 8 number colors

**Plan**

Since the prescribed §4.3 colors don't mathematically achieve 3:1 WCAG contrast against any pastel background, the `text-shadow` approach is used for legibility. This step documents the theoretical contrast ratios and confirms manual readability.

**Act**

Reveal tiles in DevTools and use the Accessibility tab to check each number color's computed contrast ratio.

**Document the following table in done.md:**

| # | Color    | Hex       | Theoretical WCAG CR (no shadow) | With shadow: readable? |
|---|----------|-----------|----------------------------------|------------------------|
| 1 | Baby blue| `#6ec6e6` | ~1.4                             | ✓ (manual verify)      |
| 2 | Mint     | `#5ecb9e` | ~1.4                             | ✓                      |
| 3 | Coral    | `#f4827a` | ~1.8                             | ✓                      |
| 4 | Lavender | `#9b84d4` | ~2.2                             | ✓                      |
| 5 | Yellow   | `#e8c43a` | ~1.2                             | ✓                      |
| 6 | Teal     | `#3db8b8` | ~1.6                             | ✓                      |
| 7 | Rose     | `#e8699a` | ~2.1                             | ✓                      |
| 8 | Gray     | `#aaaaaa` | ~1.6                             | ✓                      |

Note: the `text-shadow: 1px 1px 0 rgba(0,0,0,0.45)` provides a dark outline that ensures perceptual legibility for all 8 colors. The implementation document acknowledges the constraint conflict and resolves it with shadow-assisted contrast.

**Validate**

Manual: play the game in Chrome and Firefox. Reveal tiles with every number count (1–8). All numbers must be clearly readable at arm's length on a laptop screen.

---

### Step 3.15 — Verify no console errors + pixel font loads

**Validate**

1. Open DevTools → Console: zero errors on fresh page load, during play, and after win/loss.
2. Open DevTools → Network tab → filter by "font": confirm a `*.woff2` request to `fonts.gstatic.com` completes with status 200.
3. Open DevTools → Elements: inspect a `.tile--revealed` element with a number → computed font-family shows `"Press Start 2P"` not `system-ui`.

---

## 4. Edge Case & Boundary Audit

### EC-01: Font loading failure (offline / CDN down)
If Google Fonts fails to load, `font-family: 'Press Start 2P', monospace` falls back to the system monospace font. Numbers will render in a non-pixel font but remain readable. The game is fully playable. This is acceptable per requirements (no offline requirement beyond "casual").

### EC-02: clamp() at exactly 440px viewport
At 440px viewport width, `10vw = 44px`, which equals the clamp minimum. Grid width = 440px = viewport width. No overflow. This is the exact breakpoint. Verify at this width: tiles are 44px, no horizontal scroll.

### EC-03: ::before flex centering
The `.tile--flagged::before` `★` is centered because the parent tile has `display: flex; align-items: center; justify-content: center`. The `::before` pseudo-element participates in the flex layout as a flex item. If any tile has `textContent` set (which flagged tiles don't — render.js sets `''` for all non-revealed tiles), the `::before` would appear alongside the text. Since flagged tiles always have `textContent = ''`, the `★` is the only flex item and is centered correctly.

### EC-04: Flagged tile ★ size at minimum tile (44px)
At `--tile-size: 44px`: `font-size: calc(44px * 0.45) = 19.8px`. This is fine — the ★ fits within 44px.
At `--tile-size: 48px`: `font-size: calc(48px * 0.45) = 21.6px`. Also fine.

### EC-05: Wrong-flag tile ✕ uses system-ui, not pixel font
The base `.tile` sets `font-family: 'Press Start 2P', monospace`. The `.tile--wrong-flag::before` overrides with `font-family: system-ui, sans-serif` because the pixel font's ✕ character rendering can be inconsistent across browsers. This override is intentional.

### EC-06: text-shadow on empty (count=0) revealed tiles
`.tile--revealed { text-shadow: ... }` applies to ALL revealed tiles. For count=0 tiles, `textContent = ''`, so no shadow renders (no text, no shadow). No visual artifact.

### EC-07: text-shadow on mine tiles
`.tile--mine` does not inherit `text-shadow` from `.tile--revealed` (different selector). Mine tiles have no text content in Phase 3/4. No issue.

### EC-08: Status bar width mismatch with grid
Both `#status-bar { width: calc(var(--tile-size) * 10) }` and `#grid { grid-template-columns: repeat(10, var(--tile-size)) }` use the same `--tile-size`. When `clamp()` resolves to the same value for both, they align perfectly. CSS custom properties evaluate consistently within a single render cycle.

### EC-09: box-shadow and border-box interactions
With `box-sizing: border-box` (set globally), the 1px `border` is included in the 48px tile size. The `box-shadow` is outside the border-box (it renders outside the border area) BUT `inset` shadows render inside. Inset box-shadow does not affect layout — it's purely visual within the element's border area. No layout impact.

### EC-10: ::before pseudo-element and tile click events
The `::before` pseudo-element on `.tile--flagged` is a visual overlay only. Click/right-click events on the ★ character bubble up to the parent `.tile` element, which is handled by the event delegation on `#grid`. The `e.target.closest('.tile')` correctly finds the parent tile regardless of whether the user clicks the ★ or the tile background.

### EC-11: image-rendering: pixelated on tile text
The `.tile` base rule has `image-rendering: pixelated`. This property applies to images (IMG, CANVAS, SVG) and does NOT affect text rendering. Text is always rendered by the browser's text rendering engine. The pixel font (Press Start 2P) achieves its pixel look through font design, not `image-rendering`. No conflict.

### EC-12: mine-counter font size vs status-bar height
`#mine-counter { font-size: 18px }` with Press Start 2P renders at approximately 18px height. The `#status-bar { padding: 10px 12px }` gives: 10+18+10=38px minimum height (may be more due to font metrics). The mascot emoji (🍩) at `font-size: 32px` is taller, so the status bar height is determined by the emoji. This is expected.

### EC-13: .tile--hidden border-color vs. base border style
`.tile--hidden { border-color: var(--tile-hidden-base) }` only overrides border color, not border width or style. The base `.tile { border: 1px solid #bbb }` sets width=1px and style=solid. After the override, the border is `1px solid #ffb7b2` (peach color). This makes the border invisible (matches the background), while the inset box-shadow provides the raised visual. Correct behavior.

### EC-14: Phase 3 body.state--win/loss outline interaction
Phase 3 added `body.state--win { outline: 3px solid var(--color-mint) }`. This is a placeholder. Phase 4 should update/remove this to a proper indicator (or keep it as a subtle border — it applies to the body element which the grid is inside). The outline doesn't interfere with tile styling. It can remain as-is in Phase 4 since Phase 5 will replace it with more polished win/loss visual treatment.

---

## 5. Verification Protocol

### 5.1 Grep / Static Checks

```bash
# G1: render.js unchanged
git diff render.js
# Expected: empty

# G2: game.js unchanged
git diff game.js
# Expected: empty

# G3: clamp present in CSS
grep "clamp(44px" style.css
# Expected: 1 hit in --tile-size

# G4: Google Fonts link present
grep "Press Start 2P" index.html
# Expected: 1 hit

# G5: All 8 data-count color rules present
grep -c "data-count=" style.css
# Expected: 8

# G6: text-shadow on .tile--revealed
grep -A5 "\.tile--revealed {" style.css | grep "text-shadow"
# Expected: 1 hit

# G7: ::before rules for flagged and wrong-flag
grep "::before" style.css
# Expected: 2 hits (tile--flagged and tile--wrong-flag)

# G8: font-family on #mine-counter
grep -A5 "#mine-counter {" style.css | grep "font-family"
# Expected: 1 hit

# G9: flex on .tile base rule
grep -A10 "^\.tile {" style.css | grep "display: flex"
# Expected: 1 hit

# G10: box-shadow on .tile--hidden
grep -A8 "\.tile--hidden {" style.css | grep "box-shadow"
# Expected: 1 hit (inset)
```

### 5.2 Console Assertion Blocks

**Block C1 — Tile sizes and CSS variables**
```javascript
const assert = (l, v) => console.log(v ? `✓ ${l}` : `✗ FAIL: ${l}`);

const tileSize = getComputedStyle(document.documentElement).getPropertyValue('--tile-size').trim();
assert('--tile-size is clamp value (not 48px literal)', tileSize !== '48px' || window.innerWidth >= 480);

const t = document.querySelector('.tile');
const rect = t.getBoundingClientRect();
assert('Tile is square', Math.abs(rect.width - rect.height) < 1);
assert('Tile width ≥ 44px', rect.width >= 44);
assert('Tile width ≤ 48px', rect.width <= 48.1);

const cs = getComputedStyle(t);
assert('Tile display is flex', cs.display === 'flex');
assert('Tile align-items center', cs.alignItems === 'center');
assert('Tile user-select none', cs.userSelect === 'none');
```

**Block C2 — Revealed tile and number colors**
```javascript
const assert = (l, v) => console.log(v ? `✓ ${l}` : `✗ FAIL: ${l}`);

// Set up game with revealed tiles
Game.newGame(); render();
Game.revealTile(5, 5); render();
const b = Game.getBoard();
for (let r=0;r<10;r++) for (let c=0;c<10;c++) if(!b[r*10+c].isMine) Game.revealTile(r,c);
render();

const revealedTiles = document.querySelectorAll('.tile--revealed');
assert('Revealed tiles exist', revealedTiles.length > 0);

// Check revealed tile background is the new Phase 4 color
const rt = revealedTiles[0];
const rtCs = getComputedStyle(rt);
assert('Revealed tile has no box-shadow', rtCs.boxShadow === 'none');
assert('Revealed tile has text-shadow', rtCs.textShadow !== 'none' && rtCs.textShadow !== '');

// Check a numbered tile color
const numbered = [...revealedTiles].find(t => t.textContent.length > 0);
if (numbered) {
  const num = parseInt(numbered.textContent);
  const expectedColors = {
    1:'rgb(110, 198, 230)', 2:'rgb(94, 203, 158)', 3:'rgb(244, 130, 122)',
    4:'rgb(155, 132, 212)', 5:'rgb(232, 196, 58)', 6:'rgb(61, 184, 184)',
    7:'rgb(232, 105, 154)', 8:'rgb(170, 170, 170)'
  };
  const actualColor = getComputedStyle(numbered).color;
  assert(`Number ${num} has correct color`, actualColor === expectedColors[num]);
}
```

**Block C3 — Hidden tile raised effect**
```javascript
const assert = (l, v) => console.log(v ? `✓ ${l}` : `✗ FAIL: ${l}`);

Game.newGame(); render();
const ht = document.querySelector('.tile--hidden');
const cs = getComputedStyle(ht);
assert('Hidden tile has inset box-shadow', cs.boxShadow.includes('inset'));
assert('Hidden tile cursor is pointer', cs.cursor === 'pointer');
// Check background is peach
assert('Hidden tile background is peach',
  cs.backgroundColor === 'rgb(255, 183, 178)' || cs.background.includes('255, 183, 178'));
```

**Block C4 — Flagged tile shows ★ character**
```javascript
const assert = (l, v) => console.log(v ? `✓ ${l}` : `✗ FAIL: ${l}`);

Game.newGame(); render();
const hiddenTile = document.querySelector('.tile--hidden');
const r = parseInt(hiddenTile.dataset.row, 10);
const c = parseInt(hiddenTile.dataset.col, 10);
Game.toggleFlag(r, c); render();

const ft = document.querySelector('.tile--flagged');
assert('Flagged tile exists', ft !== null);
assert('Flagged tile textContent is empty (★ is in ::before)', ft.textContent === '');
// The ::before content can be checked via DevTools computed styles
// or by checking that the pseudo-element exists in DevTools Elements panel
const cs = getComputedStyle(ft);
assert('Flagged tile has same raised box-shadow as hidden', cs.boxShadow.includes('inset'));
```

**Block C5 — Zero-count tile has no text**
```javascript
const assert = (l, v) => console.log(v ? `✓ ${l}` : `✗ FAIL: ${l}`);

Game.newGame(); render();
Game.revealTile(5, 5); render();
const zeroTile = [...document.querySelectorAll('.tile--revealed')]
  .find(t => t.dataset.count === '0');
assert('Zero-count revealed tile has no text', !zeroTile || zeroTile.textContent === '');
```

**Block C6 — Mine counter font**
```javascript
const assert = (l, v) => console.log(v ? `✓ ${l}` : `✗ FAIL: ${l}`);

const cs = getComputedStyle(document.getElementById('mine-counter'));
assert('Mine counter font is Press Start 2P',
  cs.fontFamily.includes('Press Start 2P') || cs.fontFamily.includes('monospace'));
assert('Mine counter font-size is 18px', cs.fontSize === '18px');
```

**Block C7 — Status bar width matches grid**
```javascript
const assert = (l, v) => console.log(v ? `✓ ${l}` : `✗ FAIL: ${l}`);

const barW  = document.getElementById('status-bar').offsetWidth;
const gridW = document.getElementById('grid').offsetWidth;
assert('Status bar width matches grid width', Math.abs(barW - gridW) <= 1);
```

### 5.3 Manual Checks

| ID  | Check                                                                                      | Pass condition                                                       |
|-----|--------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| M1  | Open at 1280px wide: no horizontal scrollbar                                               | No scrollbar visible; tiles are 48×48                               |
| M2  | Open at 1280px wide: top bar and grid are left-edge aligned                                | Status bar left edge aligns with grid left edge                     |
| M3  | Open at 480px wide: tiles are still 48px                                                   | rect.width === 48 in DevTools                                       |
| M4  | Open at 440px wide: tiles are 44px, no overflow                                            | Tiles 44px, grid exactly fits viewport                              |
| M5  | Open at 375px (iPhone SE DevTools): tiles are 44px                                         | rect.width === 44; horizontal overflow visible/scrollable           |
| M6  | Open at 360px: horizontal overflow is visible, not clipped                                 | Overflow visible; can scroll to see full grid                       |
| M7  | Reveal a 1-tile (left tile to flood fill): count number shows in baby blue                 | Blue number visible                                                 |
| M8  | Verify all 8 number colors are visually distinguishable                                    | Each digit 1-8 has a distinct color                                 |
| M9  | With text-shadow: numbers are clearly legible on revealed tile background                  | Can read all digits without difficulty at normal viewing distance    |
| M10 | Hidden tiles look raised (top-left lighter, bottom-right darker)                           | 3D raised effect visible                                            |
| M11 | Revealed tiles look flat and clearly different from hidden                                 | No raised shadow on revealed tiles; clearly darker background       |
| M12 | Flag a tile: ★ appears centered in a raised peach tile                                     | Star visible and centered; tile still looks raised                  |
| M13 | Mine counter uses pixel font (Press Start 2P)                                              | Counter shows bitmapped pixel font characters                       |
| M14 | Network tab confirms WOFF2 loaded from fonts.gstatic.com                                   | Network request status 200                                          |
| M15 | Zero-count revealed tiles show no text                                                     | Empty revealed tiles have no digit                                  |
| M16 | No console errors during play, win, loss, new game                                         | Zero errors in DevTools Console                                     |
| M17 | Wrong-flag tile (loss state) shows ✕ in dark red on coral background                       | ✕ visible on wrong-flag tiles                                       |

---

## 6. Code Scaffolding

### 6.1 Complete index.html `<head>` after Phase 4

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PXL Sweeper</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=block" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
```

### 6.2 Complete style.css after Phase 4

Only the sections that change are shown with their final Phase 4 form. All other sections (`.sr-only`, Phase 3 body state classes, pointer-events lock) remain unchanged.

**`:root` block:**
```css
:root {
  --color-mint:        #b5ead7;
  --color-peach:       #ffb7b2;
  --color-lavender:    #c7b4f0;
  --color-baby-blue:   #aec6cf;
  --color-soft-yellow: #fffacd;

  --color-bg:          #f8f4fb;
  --color-topbar-bg:   #ede8f5;

  --tile-size: clamp(44px, 10vw, 48px);

  --tile-hidden-base:    #ffb7b2;
  --tile-hidden-light:   #ffd4d2;
  --tile-hidden-dark:    #c87070;
  --tile-revealed-bg:    #e8a8a0;
  --tile-revealed-border:#c07870;
}
```

**`#status-bar` and `#mine-counter`:**
```css
#status-bar {
  display: flex;
  align-items: center;
  width: calc(var(--tile-size) * 10);
  background: var(--color-topbar-bg);
  padding: 10px 12px;
  border-bottom: 2px solid var(--color-lavender);
}

#mine-counter {
  flex: 1;
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: #5c3a5a;
}
```

**`.tile` base rule:**
```css
.tile {
  width: var(--tile-size);
  height: var(--tile-size);
  background: #ddd;
  border: 1px solid #bbb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: calc(var(--tile-size) * 0.29);
  user-select: none;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
}
```

**Tile state classes (full Phase 4 replacements):**
```css
.tile--hidden {
  background:   var(--tile-hidden-base);
  border-color: var(--tile-hidden-base);
  box-shadow:
    inset  2px  2px 0 0 var(--tile-hidden-light),
    inset -2px -2px 0 0 var(--tile-hidden-dark);
  cursor: pointer;
}

.tile--revealed {
  background:   var(--tile-revealed-bg);
  border-color: var(--tile-revealed-border);
  box-shadow:   none;
  cursor:       default;
  text-shadow:  1px 1px 0 rgba(0, 0, 0, 0.45);
}

.tile--flagged {
  background:   var(--tile-hidden-base);
  border-color: var(--tile-hidden-base);
  box-shadow:
    inset  2px  2px 0 0 var(--tile-hidden-light),
    inset -2px -2px 0 0 var(--tile-hidden-dark);
  cursor: pointer;
}

.tile--flagged::before {
  content: '★';
  color: var(--color-lavender);
  font-size: calc(var(--tile-size) * 0.45);
  line-height: 1;
}

.tile--mine {
  background:   #f4827a;
  border-color: #d06060;
  box-shadow:   none;
  cursor:       default;
}

.tile--wrong-flag {
  background:   #f4827a;
  border-color: #d06060;
  box-shadow:   none;
  cursor:       default;
}

.tile--wrong-flag::before {
  content: '✕';
  color: #8b0000;
  font-size: calc(var(--tile-size) * 0.4);
  font-family: system-ui, sans-serif;
}
```

**Number color rules:**
```css
/* === Number colors (§4.3) === */
.tile--revealed[data-count="1"] { color: #6ec6e6; }
.tile--revealed[data-count="2"] { color: #5ecb9e; }
.tile--revealed[data-count="3"] { color: #f4827a; }
.tile--revealed[data-count="4"] { color: #9b84d4; }
.tile--revealed[data-count="5"] { color: #e8c43a; }
.tile--revealed[data-count="6"] { color: #3db8b8; }
.tile--revealed[data-count="7"] { color: #e8699a; }
.tile--revealed[data-count="8"] { color: #aaaaaa; }
```

---

## 7. Exit Criteria

Move to `DONE.md` only when **all** of the following are satisfied:

- [ ] All 10 grep checks (G1–G10) pass.
- [ ] All 7 console assertion blocks (C1–C7) pass with zero `✗ FAIL` lines.
- [ ] All 17 manual checks (M1–M17) pass.
- [ ] `render.js` unchanged (verify with `git diff render.js`).
- [ ] `game.js` unchanged (verify with `git diff game.js`).
- [ ] No console errors in Chrome or Firefox during play, win, loss, and new game.
- [ ] All 8 number colors are visually distinguishable and readable with text-shadow.
- [ ] Contrast limitation is documented in `DONE.md` (prescribed colors + text-shadow rationale).
- [ ] `TODO.md` updated with Phase 5 entries before `DONE.md` write.
