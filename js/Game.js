class Game {
    constructor() {
        this.db = new Database();
        this.currentPlayer = null;
        this.opponent = {
            username: 'Компьютер',
            rating: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0
        };
        this.board = new Board();
        this.currentTurn = 'white';
        this.playerColor = null;
        this.isPlayerTurn = false;
        this.moveCount = {
            white: 0,
            black: 0
        };
        this.mustCapture = false;
        this.availableCaptures = [];
        this.selectedPiece = null;
        this.totalScore = {
            white: parseInt(localStorage.getItem('whiteScore') || 0),
            black: parseInt(localStorage.getItem('blackScore') || 0)
        };
        this.continueTurn = false;
        this.ui = new UI(this);
        this.ai = new AI(this);
        this.gameStartTime = null;
        this.gameTime = null;
    }

    async login(username) {
        try {
            let player = await this.db.getPlayer(username);
            if (!player) {
                player = await this.db.addPlayer(username);
            }
            this.currentPlayer = player;
            this.ui.updatePlayerInfo(player);
            return player;
        } catch (error) {
            console.error('Error logging in:', error);
            return null;
        }
    }

    start(color) {
        console.log('Starting game with color:', color);
        this.playerColor = color;
        this.isPlayerTurn = color === 'white';
        this.currentTurn = 'white';
        this.gameStartTime = new Date();

        if (this.board) {
            this.board.element.innerHTML = '';
        }
        this.board = new Board(this.playerColor);

        this.ui.updateOpponentInfo(this.opponent);
        this.ui.updateGameInfo();
        this.ui.startTimer();

        if (!this.isPlayerTurn) {
            setTimeout(() => {
                this.ai.makeMove();
            }, 500);
        }
    }

    makeMove(from, to) {
        if (this.mustCapture) {
            const fromRow = parseInt(from.dataset.row);
            const fromCol = parseInt(from.dataset.col);
            const toRow = parseInt(to.dataset.row);
            const toCol = parseInt(to.dataset.col);
            
            if (Math.abs(toRow - fromRow) !== 2) {
                console.log('Есть обязательное взятие!');
                return false;
            }
        }

        const result = this.board.movePiece(from, to);
        if (result) {
            this.moveCount[this.currentTurn]++;
            
            if (!result.continueTurn) {
                this.currentTurn = this.currentTurn === 'black' ? 'white' : 'black';
                this.isPlayerTurn = !this.isPlayerTurn;
                this.selectedPiece = null;
                this.continueTurn = false;
            } else {
                this.continueTurn = true;
                this.selectedPiece = to;
            }

            this.checkForCaptures();
            this.ui.updateGameInfo();
            this.ui.updateBoard();
            
            if (this.isGameOver()) {
                this.handleGameOver();
            }

            if (!this.isPlayerTurn && !this.continueTurn) {
                this.ai.makeMove();
            }
            return true;
        }
        return false;
    }

    checkForCaptures() {
        this.availableCaptures = this.board.getAvailableCaptures(this.currentTurn);
        this.mustCapture = this.availableCaptures.length > 0;
        
        if (this.continueTurn && this.selectedPiece) {
            this.availableCaptures = this.availableCaptures.filter(cell => 
                cell.dataset.row === this.selectedPiece.dataset.row && 
                cell.dataset.col === this.selectedPiece.dataset.col
            );
        }
        
        return this.mustCapture;
    }

    isGameOver() {
        const whitePieces = this.countPieces('white');
        const blackPieces = this.countPieces('black');
        return whitePieces === 0 || blackPieces === 0;
    }

    countPieces(color) {
        let count = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board.state[i][j]?.startsWith(color)) {
                    count++;
                }
            }
        }
        return count;
    }

    handleGameOver() {
        const winner = this.countPieces('white') === 0 ? 'black' : 'white';
        this.totalScore[winner]++;
        
        const endTime = new Date();
        const timeDiff = endTime - this.gameStartTime;
        this.gameTime = this.formatGameTime(timeDiff);
        
        const currentPlayer = { ...this.currentPlayer };
        
        if (currentPlayer) {
            const isWinner = this.playerColor === winner;
            this.db.updatePlayerStats(
                currentPlayer.username,
                isWinner
            ).then(async () => {
                this.currentPlayer = await this.db.getPlayer(currentPlayer.username);
                this.ui.updatePlayerInfo(this.currentPlayer);
            });
        }
        
        this.ui.showGameOver(winner, currentPlayer, this.gameTime);
    }

    formatGameTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    resetGame() {
        const savedPlayer = this.currentPlayer;
        
        this.board.element.innerHTML = '';
        this.board = new Board();
        this.currentTurn = 'white';
        this.playerColor = null;
        this.isPlayerTurn = false;
        this.moveCount = { white: 0, black: 0 };
        this.mustCapture = false;
        this.availableCaptures = [];
        this.selectedPiece = null;
        this.continueTurn = false;

        this.opponent = {
            username: 'Компьютер',
            rating: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0
        };

        this.currentPlayer = savedPlayer;
        
        if (this.currentPlayer) {
            this.ui.updatePlayerInfo(this.currentPlayer);
        }
        this.ui.updateOpponentInfo(this.opponent);
    }

    setDifficulty(level) {
        this.ai.setDifficulty(level);
    }
} 