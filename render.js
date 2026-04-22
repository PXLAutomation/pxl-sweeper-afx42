// === RENDER ===
// Pure state-to-DOM projection. Reads from window.Game; writes to the DOM.
// Called once after every game action. No game logic here.

// === MODULE STATE ===
let _triggeredIdx = -1;   // board index of triggered mine; -1 = none
let _mascotState  = 'neutral'; // 'neutral' | 'win' | 'loss'

// === SPRITE CONSTANTS ===
const SVG_FLAG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="10" fill="#f0f0f0"/><rect x="3" y="12" width="5" height="1" fill="#f0f0f0"/><rect x="6" y="2" width="6" height="1" fill="#f4827a"/><rect x="6" y="3" width="4" height="1" fill="#f4827a"/><rect x="6" y="4" width="2" height="1" fill="#f4827a"/><rect x="11" y="2" width="1" height="1" fill="#fffacd"/></svg>`;

const SVG_WRONG_FLAG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="5" y="2" width="1" height="10" fill="#f0f0f0"/><rect x="3" y="12" width="5" height="1" fill="#f0f0f0"/><rect x="6" y="2" width="6" height="1" fill="#f4827a"/><rect x="6" y="3" width="4" height="1" fill="#f4827a"/><rect x="6" y="4" width="2" height="1" fill="#f4827a"/><rect x="11" y="2" width="1" height="1" fill="#fffacd"/><line x1="1.5" y1="1.5" x2="14.5" y2="14.5" stroke="#cc1111" stroke-width="1.5" stroke-linecap="square"/><line x1="14.5" y1="1.5" x2="1.5" y2="14.5" stroke="#cc1111" stroke-width="1.5" stroke-linecap="square"/></svg>`;

const SVG_DONUT = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" shape-rendering="crispEdges"><rect x="6" y="2" width="4" height="1" fill="#c7b4f0"/><rect x="4" y="3" width="8" height="1" fill="#c7b4f0"/><rect x="3" y="4" width="3" height="1" fill="#c7b4f0"/><rect x="10" y="4" width="3" height="1" fill="#c7b4f0"/><rect x="3" y="5" width="2" height="1" fill="#c7b4f0"/><rect x="11" y="5" width="2" height="1" fill="#c7b4f0"/><rect x="7" y="2" width="1" height="1" fill="#b5ead7"/><rect x="10" y="3" width="1" height="1" fill="#fffacd"/><rect x="4" y="4" width="1" height="1" fill="#aec6cf"/><rect x="3" y="6" width="2" height="3" fill="#ffb7b2"/><rect x="11" y="6" width="2" height="3" fill="#ffb7b2"/><rect x="3" y="9" width="3" height="1" fill="#ffb7b2"/><rect x="10" y="9" width="3" height="1" fill="#ffb7b2"/><rect x="4" y="10" width="8" height="1" fill="#ffb7b2"/><rect x="6" y="11" width="4" height="1" fill="#ffb7b2"/></svg>`;

function _visualState(tile, phase) {
  if (tile.state === 'revealed') return tile.isMine ? 'mine' : 'revealed';
  if (tile.state === 'flagged')  return (phase === 'lost' && !tile.isMine) ? 'wrong-flag' : 'flagged';
  return (phase === 'lost' && tile.isMine) ? 'mine' : 'hidden';
}

function render() {
  const boardState = Game.getBoard();
  const phase      = Game.getGamePhase();
  const tileDivs   = document.getElementById('grid').querySelectorAll('.tile');
  const mascot     = document.getElementById('mascot');

  const alreadyWon  = document.body.classList.contains('state--win');
  const alreadyLost = document.body.classList.contains('state--loss');

  document.body.classList.toggle('state--win',  phase === 'won');
  document.body.classList.toggle('state--loss', phase === 'lost');

  document.getElementById('mine-counter').textContent = Game.getMineCount();

  if (phase === 'won'  && !alreadyWon)  _mascotState = 'win';
  if (phase === 'lost' && !alreadyLost) _mascotState = 'loss';
  mascot.className = 'mascot--' + _mascotState;

  boardState.forEach((tile, i) => {
    const el          = tileDivs[i];
    const vs          = _visualState(tile, phase);
    const isTriggered = (vs === 'mine' && i === _triggeredIdx);
    const prevTriggered = el.dataset.triggered === 'true';

    if (el.dataset.state === vs && isTriggered === prevTriggered) return;

    el.className         = 'tile tile--' + vs;
    el.dataset.state     = vs;
    el.dataset.count     = tile.adjacentCount;
    el.dataset.triggered = isTriggered ? 'true' : '';

    if (vs === 'revealed' && tile.adjacentCount > 0) {
      el.textContent = tile.adjacentCount;
    } else if (vs === 'flagged') {
      el.innerHTML = SVG_FLAG;
    } else if (vs === 'wrong-flag') {
      el.innerHTML = SVG_WRONG_FLAG;
    } else if (vs === 'mine') {
      el.innerHTML = SVG_DONUT;
    } else {
      el.textContent = '';
    }
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
    const row = parseInt(tile.dataset.row, 10);
    const col = parseInt(tile.dataset.col, 10);
    const evt = Game.revealTile(row, col);
    if (evt.type === 'loss') _triggeredIdx = row * 10 + col;
    render();
  });

  grid.addEventListener('contextmenu', e => {
    e.preventDefault();
    const tile = e.target.closest('.tile');
    if (!tile) return;
    Game.toggleFlag(parseInt(tile.dataset.row, 10), parseInt(tile.dataset.col, 10));
    render();
  });

  grid.addEventListener('mousedown', e => {
    if (e.target.closest('.tile')) {
      mascot.className = 'mascot--surprised';
    }
  });

  document.addEventListener('mouseup', () => {
    mascot.className = 'mascot--' + _mascotState;
  });

  mascot.addEventListener('click', () => {
    _triggeredIdx = -1;
    _mascotState  = 'neutral';
    Game.newGame();
    document.getElementById('aria-announcer').textContent = '';
    render();
  });

  render();
});
