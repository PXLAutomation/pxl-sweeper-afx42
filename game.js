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
