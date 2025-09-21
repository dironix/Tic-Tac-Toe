// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let isGameActive = false;
let gameMode = 'two-player'; // 'two-player', 'ai-easy', 'ai-hard'
let scores = { X: 0, O: 0, draw: 0 };

// Winning combinations
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// DOM elements
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const modeSelect = document.getElementById('mode-select');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const xScore = document.getElementById('x-score');
const oScore = document.getElementById('o-score');
const drawScore = document.getElementById('draw-score');
const confettiContainer = document.getElementById('confetti');

// Sounds (using Web Audio API for simple tones)
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration) {
    let oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
}

// Event listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

// Handle cell click
function handleCellClick(e) {
    const cellIndex = e.target.getAttribute('data-index');
    if (board[cellIndex] !== '' || !isGameActive) return;

    makeMove(cellIndex, currentPlayer);
    e.target.classList.add('clicked');
    playSound(440, 100); // Move sound

    const result = checkWin();
    if (result) {
        endGame(result);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    if ((gameMode === 'ai-easy' || gameMode === 'ai-hard') && isGameActive && currentPlayer === 'O') {
        setTimeout(makeAIMove, 500);
    }
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player.toLowerCase());
}

// Check for win or draw
function checkWin() {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line: combo };
        }
    }
    if (!board.includes('')) return { winner: 'draw' };
    return null;
}

// AI move
function makeAIMove() {
    let moveIndex;
    if (gameMode === 'ai-easy') {
        const availableCells = board.map((val, index) => (val === '' ? index : null)).filter(val => val !== null);
        moveIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
    } else { // ai-hard
        moveIndex = minimax(board, 'O').index;
    }

    makeMove(moveIndex, 'O');
    cells[moveIndex].classList.add('clicked');
    playSound(440, 100); // Move sound

    const result = checkWin();
    if (result) {
        endGame(result);
        return;
    }

    currentPlayer = 'X';
    updateStatus();
}

// Minimax for hard AI
function minimax(newBoard, player) {
    const availableCells = newBoard.map((val, index) => (val === '' ? index : null)).filter(val => val !== null);

    const result = checkWinForMinimax(newBoard);
    if (result) {
        if (result.winner === 'O') return { score: 10 };
        if (result.winner === 'X') return { score: -10 };
        return { score: 0 };
    }

    let moves = [];
    for (let index of availableCells) {
        let move = {};
        move.index = index;
        newBoard[index] = player;

        if (player === 'O') {
            move.score = minimax(newBoard, 'X').score;
        } else {
            move.score = minimax(newBoard, 'O').score;
        }

        newBoard[index] = ''; // Undo
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let move of moves) {
            if (move.score > bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    } else {
        let bestScore = Infinity;
        for (let move of moves) {
            if (move.score < bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    }
    return bestMove;
}

function checkWinForMinimax(boardToCheck) {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (boardToCheck[a] && boardToCheck[a] === boardToCheck[b] && boardToCheck[a] === boardToCheck[c]) {
            return { winner: boardToCheck[a] };
        }
    }
    if (!boardToCheck.includes('')) return { winner: 'draw' };
    return null;
}

// Update status
function updateStatus() {
    if (!isGameActive) return;
    let message = `Player ${currentPlayer}'s Turn`;
    if (gameMode !== 'two-player' && currentPlayer === 'O') {
        message = "AI's Turn";
    }
    statusDisplay.textContent = message;
    statusDisplay.style.color = currentPlayer === 'X' ? '#d32f2f' : '#1976d2';
}

// End game
function endGame(result) {
    isGameActive = false;
    let message;
    if (result.winner === 'draw') {
        message = "It's a Draw!";
        scores.draw++;
        drawScore.textContent = `Draws: ${scores.draw}`;
        playSound(220, 300); // Draw sound
    } else {
        message = `${result.winner} Wins!`;
        if (gameMode !== 'two-player' && result.winner === 'O') message = 'AI Wins!';
        scores[result.winner]++;
        (result.winner === 'X' ? xScore : oScore).textContent = `${result.winner}: ${scores[result.winner]}`;
        result.line.forEach(index => cells[index].classList.add('winner'));
        playSound(880, 200); // Win sound
        triggerConfetti();
    }
    statusDisplay.textContent = message;
}

// Trigger confetti (simple CSS-based)
function triggerConfetti() {
    for (let i = 0; i < 100; i++) {
        let confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${Math.random() * 100}vh`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = '0';
        confetti.style.transition = 'all 2s ease-out';
        confettiContainer.appendChild(confetti);

        setTimeout(() => {
            confetti.style.top = `${parseFloat(confetti.style.top) - 100}vh`;
            confetti.style.opacity = '1';
        }, Math.random() * 500);

        setTimeout(() => confetti.remove(), 2500);
    }
}

// Start game
function startGame() {
    gameMode = modeSelect.value;
    resetGame(true);
    isGameActive = true;
    currentPlayer = 'X';
    updateStatus();
}

// Reset game
function resetGame(fullReset = false) {
    board = ['', '', '', '', '', '', '', '', ''];
    isGameActive = false;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner', 'clicked');
    });
    statusDisplay.textContent = fullReset ? 'Choose mode and start!' : 'Game Reset. Start again!';
    statusDisplay.style.color = '#333';
    if (fullReset) {
        scores = { X: 0, O: 0, draw: 0 };
        xScore.textContent = 'X: 0';
        oScore.textContent = 'O: 0';
        drawScore.textContent = 'Draws: 0';
    }
}