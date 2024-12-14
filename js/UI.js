class UI {
    constructor(game) {
        this.game = game;
        this.loginForm = this.createLoginForm();
        this.colorSelection = document.getElementById('colorSelection');
        this.currentPlayerDisplay = document.getElementById('currentPlayer');
        this.whiteMovesDisplay = document.getElementById('whiteMoves');
        this.blackMovesDisplay = document.getElementById('blackMoves');
        this.playerInfoDisplay = document.createElement('div');
        this.playerInfoDisplay.className = 'player-info';
        this.totalScoreDisplay = document.createElement('div');
        this.totalScoreDisplay.className = 'total-score';
        this.totalScoreDisplay.innerHTML = this.updateTotalScore();
        
        const gameInfo = document.querySelector('.game-info');
        gameInfo.insertBefore(this.playerInfoDisplay, gameInfo.firstChild);
        document.querySelector('.game-info').appendChild(this.totalScoreDisplay);
        
        this.initEventListeners();
        this.showLoginForm();
    }

    initEventListeners() {
        const whiteButton = document.getElementById('playWhite');
        const blackButton = document.getElementById('playBlack');
        
        if (whiteButton) {
            whiteButton.addEventListener('click', () => {
                console.log('White button clicked');
                this.game.start('white');
            });
        }
        
        if (blackButton) {
            blackButton.addEventListener('click', () => {
                console.log('Black button clicked');
                this.game.start('black');
            });
        }
        
        this.game.board.element.addEventListener('click', (e) => this.handleCellClick(e));
    }

    hideColorSelection() {
        console.log('Hiding color selection');
        this.colorSelection.classList.add('hidden');
    }

    showColorSelection() {
        console.log('Showing color selection');
        this.colorSelection.classList.remove('hidden');
    }

    updateGameInfo() {
        this.currentPlayerDisplay.textContent = 
            `Ходят ${this.game.currentPlayer === 'white' ? 'белые' : 'черные'}` +
            `${this.game.mustCapture ? ' (Обязательное взятие!)' : ''}`;
        this.whiteMovesDisplay.textContent = this.game.moveCount.white;
        this.blackMovesDisplay.textContent = this.game.moveCount.black;
    }

    handleCellClick(e) {
        if (!this.game.playerColor || !this.game.isPlayerTurn) return;
        
        const cell = e.target.closest('.cell');
        if (!cell) return;

        if (e.target.classList.contains('piece')) {
            this.handlePieceClick(e.target, cell);
        } else if (this.game.selectedPiece) {
            this.handleMoveClick(cell);
        }
    }

    handlePieceClick(piece, cell) {
        const pieceColor = piece.classList.contains('piece-black') ? 'black' : 'white';
        
        if (pieceColor === this.game.playerColor) {
            if (this.game.mustCapture && !this.game.availableCaptures.includes(cell)) {
                console.log('Есть обязательное взятие!');
                return;
            }
            
            if (this.game.selectedPiece) {
                this.game.selectedPiece.style.backgroundColor = '';
            }
            this.game.selectedPiece = cell;
            cell.style.backgroundColor = '#baca44';
        }
    }

    handleMoveClick(cell) {
        if (this.game.makeMove(this.game.selectedPiece, cell)) {
            this.game.selectedPiece.style.backgroundColor = '';
            this.game.selectedPiece = null;
        }
    }

    updateTotalScore() {
        return `
            <div>Общий счет:</div>
            <div>Белые: ${this.game.totalScore.white}</div>
            <div>Черные: ${this.game.totalScore.black}</div>
        `;
    }

    showGameOver(winner) {
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = `
            <h2>Игра окончена!</h2>
            <p>Игрок: ${this.game.currentPlayer.username}</p>
            <p>Победили ${winner === 'white' ? 'белые' : 'черные'}!</p>
            <button class="new-game-btn">Новая игра</button>
        `;
        document.body.appendChild(gameOver);

        gameOver.querySelector('.new-game-btn').addEventListener('click', () => {
            document.body.removeChild(gameOver);
            this.game.resetGame();
        });

        this.totalScoreDisplay.innerHTML = this.updateTotalScore();
        this.updatePlayerInfo(this.game.currentPlayer);
    }

    createLoginForm() {
        const form = document.createElement('div');
        form.className = 'login-form';
        form.innerHTML = `
            <h2>Введите ваше имя</h2>
            <input type="text" id="username" placeholder="Имя игрока" required>
            <button id="loginButton">Начать игру</button>
            <div class="leaderboard">
                <h3>Таблица лидеров</h3>
                <div id="leaderboardContent"></div>
            </div>
        `;
        return form;
    }

    async showLoginForm() {
        document.body.appendChild(this.loginForm);
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');

        loginButton.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            if (username) {
                const player = await this.game.login(username);
                if (player) {
                    this.loginForm.remove();
                    this.updatePlayerInfo(player);
                    this.showColorSelection();
                }
            }
        });

        this.updateLeaderboard();
    }

    async updateLeaderboard() {
        const leaderboard = await this.game.db.getLeaderboard();
        const content = document.getElementById('leaderboardContent');
        content.innerHTML = leaderboard
            .slice(0, 5)
            .map((player, index) => `
                <div class="leaderboard-item">
                    ${index + 1}. ${player.username} - ${player.wins} побед
                </div>
            `)
            .join('');
    }

    updatePlayerInfo(player) {
        this.playerInfoDisplay.innerHTML = `
            <div class="current-player">
                <div>Игрок: ${player.username}</div>
                <div>Всего игр: ${player.gamesPlayed}</div>
                <div>Побед: ${player.wins}</div>
            </div>
        `;
    }
} 