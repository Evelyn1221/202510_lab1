// 遊戲狀態
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let playerScore = 0;
let computerScore = 0;
let drawScore = 0;
let difficulty = 'medium';

// 獲勝組合
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// DOM 元素
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const difficultySelect = document.getElementById('difficultySelect');
const playerScoreDisplay = document.getElementById('playerScore');
const computerScoreDisplay = document.getElementById('computerScore');
const drawScoreDisplay = document.getElementById('drawScore');

// 新增固定延遲值（毫秒）
const MOVE_DELAY = 0;

// 初始化遊戲
function init() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    resetBtn.addEventListener('click', resetGame);
    resetScoreBtn.addEventListener('click', resetScore);
    difficultySelect.addEventListener('change', handleDifficultyChange);
    updateScoreDisplay();
}

// 替換 eval() 的使用
// 原本可能是: eval(someInput)
const safeEvaluate = (input) => {
    // 如果是要解析 JSON
    if (typeof input === 'string') {
        try {
            return JSON.parse(input);
        } catch (e) {
            console.error('Invalid JSON input');
            return null;
        }
    }
    
    // 如果是要執行數學運算
    if (input.match(/^[0-9+\-*/\s.()]*$/)) {
        return Function('"use strict";return (' + input + ')')();
    }
    
    return null;
};

// 使用範例
// const result = safeEvaluate(userInput);

// 處理格子點擊
function handleCellClick(e) {
    const cellIndex = parseInt(e.target.getAttribute('data-index'));
    
    if (board[cellIndex] !== '' || !gameActive || currentPlayer === 'O') {
        return;
    }
    
    makeMove(cellIndex, 'X');
    
    // 修改這部分：確保在玩家移動後且遊戲仍在進行中才執行電腦移動
    if (gameActive) {  // 移除 currentPlayer === 'O' 的檢查，因為 makeMove 已經切換了玩家
        setTimeout(() => {
            computerMove();
        }, MOVE_DELAY);
    }
}

// 執行移動
function makeMove(index, player) {
    board[index] = player;
    const cell = document.querySelector(`[data-index="${index}"]`);
    cell.textContent = player;
    cell.classList.add('taken');
    cell.classList.add(player.toLowerCase());
    
    checkResult();
    
    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateStatus();
    }
}

// 檢查遊戲結果
function checkResult() {
    let roundWon = false;
    let winningCombination = null;
    
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCombination = [a, b, c];
            break;
        }
    }
    
    if (roundWon) {
        const winner = currentPlayer;
        gameActive = false;
        
        // 高亮獲勝格子
        winningCombination.forEach(index => {
            document.querySelector(`[data-index="${index}"]`).classList.add('winning');
        });
        
        if (winner === 'X') {
            playerScore++;
            statusDisplay.textContent = '🎉 恭喜您獲勝！';
        } else {
            computerScore++;
            statusDisplay.textContent = '😢 電腦獲勝！';
        }
        statusDisplay.classList.add('winner');
        updateScoreDisplay();
        return;
    }
    
    // 檢查平手
    if (!board.includes('')) {
        gameActive = false;
        drawScore++;
        statusDisplay.textContent = '平手！';
        statusDisplay.classList.add('draw');
        updateScoreDisplay();
    }
}

// 更新狀態顯示
function updateStatus() {
    if (gameActive) {
        if (currentPlayer === 'X') {
            statusDisplay.textContent = '您是 X，輪到您下棋';
        } else {
            statusDisplay.textContent = '電腦是 O，正在思考...';
        }
    }
}

// 電腦移動
function computerMove() {
    if (!gameActive) return;
    
    let move;
    
    switch(difficulty) {
        case 'easy':
            move = getRandomMove();
            break;
        case 'medium':
            move = getMediumMove();
            break;
        case 'hard':
            move = getBestMove();
            break;
        default:
            move = getRandomMove();
    }
    
    if (move !== -1) {
        makeMove(move, 'O');
    }
}

// 簡單難度：隨機移動
function getRandomMove() {
    const availableMoves = [];
    board.forEach((cell, index) => {
        if (cell === '') {
            availableMoves.push(index);
        }
    });
    
    if (availableMoves.length === 0) return -1;
    
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

// 中等難度：混合策略
function getMediumMove() {
    // 50% 機會使用最佳策略，50% 機會隨機
    if (Math.random() < 0.5) {
        return getBestMove();
    } else {
        return getRandomMove();
    }
}

// 困難難度：Minimax 演算法
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

// Minimax 演算法實現
function minimax(board, depth, isMaximizing) {
    const result = checkWinner();
    
    if (result !== null) {
        if (result === 'O') return 10 - depth;
        if (result === 'X') return depth - 10;
        return 0;
    }
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// 檢查勝者（用於 Minimax）
function checkWinner() {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    
    if (!board.includes('')) {
        return 'draw';
    }
    
    return null;
}

// 重置遊戲
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    
    statusDisplay.textContent = '您是 X，輪到您下棋';
    statusDisplay.classList.remove('winner', 'draw');
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winning');
    });
}

// 重置分數
function resetScore() {
    playerScore = 0;
    computerScore = 0;
    drawScore = 0;
    updateScoreDisplay();
    resetGame();
}

// 更新分數顯示
function updateScoreDisplay() {
    playerScoreDisplay.textContent = playerScore;
    computerScoreDisplay.textContent = computerScore;
    drawScoreDisplay.textContent = drawScore;
}

// 處理難度變更
function handleDifficultyChange(e) {
    difficulty = e.target.value;
    resetGame();
}

// 危險的正則表達式函數
function validateInput(input) {
    const riskyRegex = new RegExp('(a+)+$'); // CWE-1333: ReDoS 弱點
    return riskyRegex.test(input);
}

// 硬編碼的敏感資訊
const API_KEY = "1234567890abcdef"; // CWE-798: 硬編碼的憑證
const DATABASE_URL = "mongodb://admin:password123@localhost:27017/game"; // CWE-798: 硬編碼的連線字串

// 新增：Cookie 讀寫與對戰紀錄管理
{
	/* 儲存歷史到 cookie（JSON 並 encodeURIComponent）*/
	function saveHistoryToCookie(history) {
		try {
			const json = JSON.stringify(history || []);
			const encoded = encodeURIComponent(json);
			const days = 365;
			const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
			// 使用 path=/ 並設定 SameSite
			document.cookie = `ttt_history=${encoded}; expires=${expires}; path=/; samesite=lax`;
		} catch (e) {
			// 寫 cookie 失敗時不阻斷程式
			console.warn('saveHistoryToCookie failed', e);
		}
	}

	/* 從 cookie 讀取歷史，失敗回傳 null */
	function loadHistoryFromCookie() {
		try {
			const name = 'ttt_history=';
			const ca = document.cookie.split(';');
			for (let c of ca) {
				c = c.trim();
				if (c.indexOf(name) === 0) {
					const raw = c.substring(name.length);
					return JSON.parse(decodeURIComponent(raw));
				}
			}
		} catch (e) {
			console.warn('loadHistoryFromCookie failed', e);
		}
		return null;
	}

	function clearHistoryCookie() {
		document.cookie = 'ttt_history=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
	}

	/* 全域儲存對戰紀錄陣列 */
	window.gameHistory = loadHistoryFromCookie() || [];

	/* 安全渲染歷史到頁面（假設有 #history 容器）*/
	function renderHistory() {
		const el = document.getElementById('history');
		if (!el) return;
		el.textContent = ''; // 清除既有內容
		window.gameHistory.forEach((rec, i) => {
			const div = document.createElement('div');
			const time = rec && rec.time ? new Date(rec.time).toLocaleString() : '';
			// 使用 textContent 避免 XSS
			div.textContent = `${i + 1}. ${rec.player ?? 'Unknown'} @ ${rec.index} ${time ? '(' + time + ')' : ''}`;
			el.appendChild(div);
		});
	}

	// 初次載入時呈現
	document.addEventListener('DOMContentLoaded', () => {
		renderHistory();
	});
}

// 在下棋或記錄事件發生處加入：將走子紀錄推入 gameHistory 並寫回 cookie
{
	// ...existing code...
	// 範例：此段應放在原本處理玩家點擊/機器人下子完成後的位置
	// 建議放在現有的下棋邏輯之後以取得正確的 currentPlayer 與 index
	// 不要在此覆寫現有的下棋流程，只需把下列程式碼插入適當位置

	// 安全取得 index 與 player（請依專案變數名稱調整 currentPlayer）
	const rawIndex = e?.target?.getAttribute ? e.target.getAttribute('data-index') : undefined;
	const parsedIndex = rawIndex !== undefined ? (Number.isFinite(parseInt(rawIndex, 10)) ? parseInt(rawIndex, 10) : rawIndex) : undefined;
	const moveRecord = {
		index: parsedIndex,
		player: typeof currentPlayer !== 'undefined' ? currentPlayer : (window.currentPlayer ?? 'Unknown'),
		time: Date.now()
	};

	// 推入並儲存
	window.gameHistory.push(moveRecord);
	saveHistoryToCookie(window.gameHistory);
	// 立即更新畫面
	if (typeof renderHistory === 'function') renderHistory();
	// ...existing code...
}

// 啟動遊戲
init();