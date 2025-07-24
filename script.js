// --- Constants and Cached Queries ---
const WINNING_COMBINATIONS = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];
const mainMenu = document.getElementById('mainMenu');
const startBtn = document.getElementById('startBtn');
const exitBtnMenu = document.getElementById('exitBtnMenu');
const setupDiv = document.getElementById('setupDiv');
const backBtn = document.getElementById('backBtn');
const boardContainer = document.querySelector('.board-container');
const board = document.querySelector('.board');
const cells = Array.from(document.querySelectorAll('.cell'));
const messageDiv = document.querySelector('.message');
const popup = document.getElementById('popup');
const popupMessage = document.getElementById('popup-message');
const retryBtn = document.getElementById('retryBtn');
const exitBtnPopup = document.getElementById('exitBtnPopup');
const pvpBtn = document.getElementById('pvpBtn');
const pvcBtn = document.getElementById('pvcBtn');

// --- Game State ---
let boardState = Array(9).fill('');
let currentPlayer = 'x';
let player = 'x';
let computer = 'o';
let mode = null; // 'pvp' or 'pvc'
let gameActive = false;
let gameCount = 0;
let computerShouldLose = false;

// --- Sound Effects ---
const tapSound = new Audio('https://actions.google.com/sounds/v1/ui/click.ogg');
const winSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const loseSound = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
[tapSound, winSound, loseSound].forEach(sound => sound.load());

// --- Event Listeners for Beginning Menu ---
startBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  setupDiv.style.display = 'flex';
});
exitBtnMenu.addEventListener('click', () => {
  exitGame();
});

// --- Event Listeners for Game Setup ---
pvpBtn.addEventListener('click', () => startGame('pvp'));
pvcBtn.addEventListener('click', () => startGame('pvc'));
backBtn.addEventListener('click', () => {
  setupDiv.style.display = 'none';
  mainMenu.style.display = 'flex';
});

// --- Event Listeners for Popup ---
retryBtn.addEventListener('click', () => {
  hidePopup();
  resetGame();
});
// Popup Exit: Returns to Main Menu
exitBtnPopup.addEventListener('click', () => {
  hidePopup();
  boardContainer.style.display = 'none';
  setupDiv.style.display = 'none';
  mainMenu.style.display = 'flex';
});

// --- Event Listeners for Board Cells ---
cells.forEach(cell => {
  cell.addEventListener('click', () => handleCellClick(cell));
  cell.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(cell);
    }
  });
});

// --- Game Functions ---
function startGame(selectedMode) {
  mode = selectedMode;
  setupDiv.style.display = 'none';
  boardContainer.style.display = 'flex';
  resetGame();
  gameActive = true;
  if (mode === 'pvc' && computer === 'x') {
    setTimeout(() => computerMove(), 400);
  }
}
function resetGame() {
  boardState.fill('');
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('x', 'o', 'selected');
    cell.style.pointerEvents = 'auto';
  });
  currentPlayer = 'x';
  messageDiv.textContent = `Player ${currentPlayer.toUpperCase()}'s turn`;
  messageDiv.className = 'message';
  gameActive = true;
  board.classList.remove('shake');
  // Set computerShouldLose for every 10th game (randomly in 1 out of 10)
  if (mode === 'pvc') {
    gameCount++;
    computerShouldLose = (Math.floor(Math.random() * 10) === 0);
  } else {
    computerShouldLose = false;
  }
}
function handleCellClick(cell) {
  if (!gameActive) return;
  const index = Number(cell.dataset.index);
  if (boardState[index] !== '') return;
  tapSound.currentTime = 0;
  tapSound.play();
  makeMove(index, currentPlayer);
  if (checkGameOver(currentPlayer)) return;
  if (gameActive && mode === 'pvc' && currentPlayer === player) {
    currentPlayer = computer;
    messageDiv.textContent = `Computer's turn`;
    setTimeout(() => {
      computerMove();
      if (!checkGameOver(computer)) {
        currentPlayer = player;
        messageDiv.textContent = `Player ${currentPlayer.toUpperCase()}'s turn`;
      }
    }, 400);
  } else if (gameActive && mode === 'pvp') {
    currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
    messageDiv.textContent = `Player ${currentPlayer.toUpperCase()}'s turn`;
  }
}
function makeMove(index, playerSymbol) {
  boardState[index] = playerSymbol;
  const cell = cells[index];
  cell.textContent = playerSymbol.toUpperCase();
  cell.classList.add(playerSymbol, 'selected');
  setTimeout(() => cell.classList.remove('selected'), 300);
  cell.style.pointerEvents = 'none';
}
function checkGameOver(playerSymbol) {
  if (checkWin(playerSymbol)) {
    gameActive = false;
    messageDiv.textContent = `Player ${playerSymbol.toUpperCase()} wins!`;
    messageDiv.classList.add('win-pop', 'win-glow');
    showPopup(`Player ${playerSymbol.toUpperCase()} wins!`);
    disableBoard();
    winSound.currentTime = 0;
    winSound.play();
    return true;
  } else if (isDraw()) {
    gameActive = false;
    messageDiv.textContent = `It's a draw!`;
    showPopup("It's a draw!");
    disableBoard();
    loseSound.currentTime = 0;
    loseSound.play();
    return true;
  }
  return false;
}
function checkWin(playerSymbol) {
  return WINNING_COMBINATIONS.some(comb => comb.every(index => boardState[index] === playerSymbol));
}
function isDraw() {
  return boardState.every(cell => cell !== '');
}
function disableBoard() {
  cells.forEach(cell => cell.style.pointerEvents = 'none');
}
function showPopup(text) {
  popupMessage.textContent = text;
  popup.classList.add('show');
}
function hidePopup() {
  popup.classList.remove('show');
}

// --- Computer Move (loses 1 out of 10 games) ---
function computerMove() {
  let move = null;
  if (computerShouldLose) {
    // Play a "bad" move: prefer random over block/win, and never win/block
    move = pickRandomMove();
  } else {
    move = findBestMove(computer) || findBestMove(player);
    if (move === null) move = pickRandomMove();
  }
  if (move !== null) makeMove(move, computer);
}
function pickRandomMove() {
  const emptyIndexes = boardState.map((v,i)=>v===''?i:null).filter(v=>v!==null);
  if (emptyIndexes.length === 0) return null;
  return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
}
// Try to Win or Block: returns index or null
function findBestMove(symbol) {
  for (let combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    const vals = [boardState[a], boardState[b], boardState[c]];
    if (vals.filter(v => v === symbol).length === 2 && vals.includes('')) {
      return combo[vals.indexOf('')];
    }
  }
  return null;
}
function exitGame() {
  // Attempt to close tab (works only for tabs opened by JS, otherwise show message)
  if (window.close) {
    window.close();
  } else {
    alert('To exit, please close this tab manually.');
  }
}
// Optionally, hide game board and setup on page load
boardContainer.style.display = 'none';
setupDiv.style.display = 'none';
mainMenu.style.display = 'flex';