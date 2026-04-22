// === RENDER ===
// Pure state-to-DOM projection. Reads from window.Game; writes to the DOM.
// Called once after every game action. No game logic here.

function _visualState(tile, phase) {
  if (tile.state === 'revealed') return tile.isMine ? 'mine' : 'revealed';
  if (tile.state === 'flagged')  return (phase === 'lost' && !tile.isMine) ? 'wrong-flag' : 'flagged';
  return (phase === 'lost' && tile.isMine) ? 'mine' : 'hidden';
}

function render() {
  const boardState = Game.getBoard();
  const phase      = Game.getGamePhase();
  const tileDivs   = document.getElementById('grid').querySelectorAll('.tile');

  // Capture before toggling for ARIA transition detection
  const alreadyWon  = document.body.classList.contains('state--win');
  const alreadyLost = document.body.classList.contains('state--loss');

  document.body.classList.toggle('state--win',  phase === 'won');
  document.body.classList.toggle('state--loss', phase === 'lost');

  document.getElementById('mine-counter').textContent = Game.getMineCount();

  boardState.forEach((tile, i) => {
    const el = tileDivs[i];
    const vs = _visualState(tile, phase);

    el.className     = 'tile tile--' + vs;
    el.dataset.state = vs;
    el.dataset.count = tile.adjacentCount;
    el.textContent   = (vs === 'revealed' && tile.adjacentCount > 0) ? tile.adjacentCount : '';
  });

  const announcer = document.getElementById('aria-announcer');
  if (phase === 'won'  && !alreadyWon)  announcer.textContent = 'You win! Board cleared.';
  if (phase === 'lost' && !alreadyLost) announcer.textContent = 'Game over! You hit a mine.';
}

// === EVENT WIRING ===

document.addEventListener('DOMContentLoaded', () => {
  const grid   = document.getElementById('grid');
  const mascot = document.getElementById('mascot');

  grid.addEventListener('click', e => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    Game.revealTile(parseInt(tile.dataset.row, 10), parseInt(tile.dataset.col, 10));
    render();
  });

  grid.addEventListener('contextmenu', e => {
    e.preventDefault();
    const tile = e.target.closest('.tile');
    if (!tile) return;
    Game.toggleFlag(parseInt(tile.dataset.row, 10), parseInt(tile.dataset.col, 10));
    render();
  });

  mascot.addEventListener('click', () => {
    Game.newGame();
    document.getElementById('aria-announcer').textContent = '';
    render();
  });

  render();
});
