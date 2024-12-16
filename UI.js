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
        
        this.opponentInfoDisplay = document.createElement('div');
        this.opponentInfoDisplay.className = 'player-info';
        gameInfo.insertBefore(this.opponentInfoDisplay, this.totalScoreDisplay);
        
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.className = 'timer';
        gameInfo.insertBefore(this.timerDisplay, this.totalScoreDisplay);
        this.timerInterval = null;
        
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

    updateGameInfo() {
        this.currentPlayerDisplay.textContent = 
            `${this.game.currentTurn === 'white' ? 'Ходят белые' : 'Ходят черные'}` +
            `${this.game.mustCapture ? ' (Обязательное взятие!)' : ''}`;

        const movesInfo = document.createElement('div');
        movesInfo.className = 'moves-info';
        movesInfo.innerHTML = `
            <div>
                <div>Ходы белых:</div>
                <div class="moves-count">${this.game.moveCount.white}</div>
            </div>
            <div>
                <div>Ходы черных:</div>
                <div class="moves-count">${this.game.moveCount.black}</div>
            </div>
        `;

        this.whiteMovesDisplay.parentElement.replaceWith(movesInfo);

        this.totalScoreDisplay.innerHTML = `
            <div>Общий счет</div>
            <div class="highlight">Белые: ${this.game.totalScore.white}</div>
            <div class="highlight">Черные: ${this.game.totalScore.black}</div>
        `;
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
        
        if (pieceColor === this.game.playerColor && this.game.isPlayerTurn) {
            if (this.game.mustCapture) {
                if (this.game.continueTurn && this.game.selectedPiece) {
                    if (cell === this.game.selectedPiece) {
                        cell.style.backgroundColor = '#baca44';
                    }
                    return;
                }
                if (!this.game.availableCaptures.includes(cell)) {
                    console.log('Есть обязательное взятие другой шашкой!');
                    return;
                }
            }
            
            this.updateBoard();
            
            this.game.selectedPiece = cell;
            cell.style.backgroundColor = '#baca44';
        }
    }

    handleMoveClick(cell) {
        if (this.game.selectedPiece) {
            if (this.game.makeMove(this.game.selectedPiece, cell)) {
                if (!this.game.continueTurn) {
                    this.updateBoard();
                }
            } else {
                this.game.selectedPiece.style.backgroundColor = '';
                this.game.selectedPiece = null;
            }
        }
    }

    updateTotalScore() {
        return `
            <div>Общий счет:</div>
            <div>Белые: ${this.game.totalScore.white}</div>
            <div>Черные: ${this.game.totalScore.black}</div>
        `;
    }

    showGameOver(winner, player, gameTime) {
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        
        gameOver.innerHTML = `
            <h2>Игра окончена!</h2>
            <div class="highlight">Игрок: ${player.username}</div>
            <div class="highlight">Противник: ${this.game.opponent.username}</div>
            <p>Текущий рейтинг: ${player.rating || 0}</p>
            <div class="highlight">Победили ${winner === 'white' ? 'белые' : 'черные'}!</div>
            <div class="highlight">Время игры: ${gameTime}</div>
            <button class="new-game-btn">Новая игра</button>
        `;

        document.body.appendChild(gameOver);

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        gameOver.querySelector('.new-game-btn').addEventListener('click', () => {
            document.body.removeChild(gameOver);
            this.game.resetGame();
        });

        this.totalScoreDisplay.innerHTML = this.updateTotalScore();
        this.updatePlayerInfo(player);
    }

    calculateRatingChange(playerRating, opponentRating, isWinner) {
        const K = 32;
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        return Math.round(K * ((isWinner ? 1 : 0) - expectedScore));
    }

    createLoginForm() {
        const form = document.createElement('div');
        form.className = 'login-form';
        form.innerHTML = `
            <h2>Шашки</h2>
            <input type="text" id="username" placeholder="Ваше имя" required>
            
            <div class="game-settings">
                <div class="difficulty-selection">
                    <h3>Выберите сложность</h3>
                    <select id="difficulty" class="difficulty-select">
                        <option value="easy">Легкий</option>
                        <option value="medium" selected>Средний</option>
                        <option value="hard">Сложный</option>
                    </select>
                </div>
                
                <div class="color-selection">
                    <h3>Выберите сторону</h3>
                    <div class="color-buttons">
                        <button id="selectWhite" class="color-btn" data-color="white">
                            <span class="piece-preview white"></span>
                            Играть белыми
                        </button>
                        <button id="selectBlack" class="color-btn" data-color="black">
                            <span class="piece-preview black"></span>
                            Играть черными
                        </button>
                    </div>
                </div>
            </div>

            <button id="loginButton" class="start-btn" disabled>
                Начать игру
            </button>
            
            <div class="leaderboard">
                <h3>Лучшие игроки</h3>
                <div id="leaderboardContent"></div>
            </div>
        `;
        return form;
    }

    async showLoginForm() {
        document.body.appendChild(this.loginForm);
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');
        const difficultySelect = document.getElementById('difficulty');
        const whiteButton = document.getElementById('selectWhite');
        const blackButton = document.getElementById('selectBlack');
        let selectedColor = null;

        // Пытаемся получить последнего игрока из localStorage
        const lastPlayer = localStorage.getItem('lastPlayer');
        if (lastPlayer) {
            usernameInput.value = lastPlayer;
        }

        // Обработчики для кнопок выбора цвета
        const handleColorSelect = (color) => {
            selectedColor = color;
            whiteButton.classList.toggle('selected', color === 'white');
            blackButton.classList.toggle('selected', color === 'black');
            loginButton.disabled = !usernameInput.value.trim() || !selectedColor;
        };

        whiteButton.addEventListener('click', () => handleColorSelect('white'));
        blackButton.addEventListener('click', () => handleColorSelect('black'));

        // Проверка валидности формы
        usernameInput.addEventListener('input', () => {
            loginButton.disabled = !usernameInput.value.trim() || !selectedColor;
        });

        loginButton.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            if (username && selectedColor) {
                const player = await this.game.login(username);
                if (player) {
                    localStorage.setItem('lastPlayer', username);
                    this.game.setDifficulty(difficultySelect.value);
                    this.loginForm.remove();
                    this.updatePlayerInfo(player);
                    this.game.start(selectedColor);
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
        if (!player) return;
        
        this.playerInfoDisplay.innerHTML = `
            <div class="current-player">
                <div>Игрок: ${player.username}</div>
                <div class="highlight">Рейтинг: ${player.rating || 0}</div>
                <div>Всего игр: ${player.gamesPlayed || 0}</div>
                <div class="highlight">Побед: ${player.wins || 0}</div>
                <div>Поражений: ${player.losses || 0}</div>
            </div>
        `;
    }

    updateOpponentInfo(opponent) {
        this.opponentInfoDisplay.innerHTML = `
            <div class="current-player opponent">
                <div>Противник: ${opponent.username}</div>
            </div>
        `;
    }

    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (cell !== this.game.selectedPiece) {
                cell.style.backgroundColor = '';
            }
        });

        if (this.game.continueTurn && this.game.selectedPiece) {
            this.game.selectedPiece.style.backgroundColor = '#baca44';
        }
    }

    startTimer() {
        const startTime = new Date();
        this.updateTimer(startTime);
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.updateTimer(startTime);
        }, 1000);
    }

    updateTimer(startTime) {
        const currentTime = new Date();
        const timeDiff = currentTime - startTime;
        const seconds = Math.floor(timeDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        this.timerDisplay.innerHTML = `
            <div class="timer-display">
                ⏱️ ${minutes}:${remainingSeconds.toString().padStart(2, '0')}
            </div>
        `;
    }
} 