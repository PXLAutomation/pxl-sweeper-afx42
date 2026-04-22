// === CONSTANTS ===
const GRID_ROWS  = 10;
const GRID_COLS  = 10;
const MINE_COUNT = 15;

// === MODULE STATE ===
let board     = [];      // Array(100) of tile objects
let gamePhase = 'idle';  // 'idle' | 'active' | 'won' | 'lost'

// === PRIVATE HELPERS ===

function _idx(row, col) {
  return row * GRID_COLS + col;
}

function _inBounds(row, col) {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

function _getNeighbors(row, col) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (_inBounds(nr, nc)) neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}

// === MINE PLACEMENT ===

function _placeMines(excludeRow, excludeCol) {
  const excluded = new Set();
  excluded.add(_idx(excludeRow, excludeCol));
  for (const n of _getNeighbors(excludeRow, excludeCol)) {
    excluded.add(_idx(n.row, n.col));
  }

  const pool = [];
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (!excluded.has(i)) pool.push(i);
  }

  // Partial Fisher-Yates: select exactly MINE_COUNT positions
  for (let i = 0; i < MINE_COUNT; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    board[pool[i]].isMine = true;
  }
}

// === ADJACENCY ===

function _calcAdjacency() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = board[_idx(r, c)];
      if (tile.isMine) continue;
      let count = 0;
      for (const n of _getNeighbors(r, c)) {
        if (board[_idx(n.row, n.col)].isMine) count++;
      }
      tile.adjacentCount = count;
    }
  }
}

// === FLOOD FILL ===

function _floodFill(startRow, startCol) {
  const revealed = [];
  const queue = [{ row: startRow, col: startCol }];
  const visited = new Set([_idx(startRow, startCol)]);

  while (queue.length > 0) {
    const { row, col } = queue.shift();
    const tile = board[_idx(row, col)];

    if (tile.state === 'flagged') continue;

    tile.state = 'revealed';
    revealed.push({ row, col });

    // Only expand BFS from empty tiles — numbered tiles are revealed but not expanded
    if (tile.adjacentCount === 0) {
      for (const n of _getNeighbors(row, col)) {
        const ni = _idx(n.row, n.col);
        if (!visited.has(ni) && board[ni].state !== 'revealed' &&
            board[ni].state !== 'flagged' && !board[ni].isMine) {
          visited.add(ni);
          queue.push(n);
        }
      }
    }
  }

  return revealed;
}

// === WIN CHECK ===

function _checkWin() {
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (!board[i].isMine && board[i].state !== 'revealed') return false;
  }
  return true;
}

// === PUBLIC API ===

function newGame() {
  gamePhase = 'idle';
  board = Array.from({ length: GRID_ROWS * GRID_COLS }, () => ({
    state: 'hidden',
    isMine: false,
    adjacentCount: 0,
  }));
}

function revealTile(row, col) {
  if (gamePhase === 'won' || gamePhase === 'lost') return { type: 'noop' };
  if (!_inBounds(row, col)) return { type: 'noop' };

  const tile = board[_idx(row, col)];
  if (tile.state === 'flagged') return { type: 'noop' };
  if (tile.state === 'revealed') return { type: 'noop' };

  // First click: place mines now, excluding this tile and its neighbors
  if (gamePhase === 'idle') {
    _placeMines(row, col);
    _calcAdjacency();
    gamePhase = 'active';
  }

  // Mine hit → loss
  if (tile.isMine) {
    tile.state = 'revealed';
    gamePhase = 'lost';

    const allMines = [];
    const wrongFlags = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const t = board[_idx(r, c)];
        if (t.isMine) allMines.push({ row: r, col: c });
        if (t.state === 'flagged' && !t.isMine) wrongFlags.push({ row: r, col: c });
      }
    }

    return { type: 'loss', triggeredTile: { row, col }, allMines, wrongFlags };
  }

  // Empty tile → BFS flood fill
  if (tile.adjacentCount === 0) {
    const tiles = _floodFill(row, col);
    if (_checkWin()) {
      gamePhase = 'won';
      return { type: 'win', tiles };
    }
    return { type: 'revealed', tiles };
  }

  // Numbered tile → reveal only this tile
  tile.state = 'revealed';
  if (_checkWin()) {
    gamePhase = 'won';
    return { type: 'win', tiles: [{ row, col }] };
  }
  return { type: 'revealed', tiles: [{ row, col }] };
}

function toggleFlag(row, col) {
  if (gamePhase === 'won' || gamePhase === 'lost') return;
  if (!_inBounds(row, col)) return;
  const tile = board[_idx(row, col)];
  if (tile.state === 'revealed') return;
  tile.state = tile.state === 'flagged' ? 'hidden' : 'flagged';
}

function getMineCount() {
  let flags = 0;
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    if (board[i].state === 'flagged') flags++;
  }
  return MINE_COUNT - flags;
}

function getBoard() {
  return board.map(t => ({ ...t }));
}

function getGamePhase() {
  return gamePhase;
}

// === DOM BOOTSTRAP (Phase 1 — do not add game logic below this line) ===

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
  newGame();
  buildGrid();
});

// === PUBLIC WINDOW EXPORT ===

window.Game = {
  newGame,
  revealTile,
  toggleFlag,
  getMineCount,
  getBoard,
  getGamePhase,
};
