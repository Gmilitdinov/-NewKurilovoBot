class Game {
    constructor() {
        this.db = new Database();
        this.currentPlayer = null;
        this.board = new Board();
        this.currentPlayer = 'white';
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
        this.ui.showColorSelection();
    }

    async login(username) {
        try {
            let player = await this.db.getPlayer(username);
            if (!player) {
                player = await this.db.addPlayer(username);
            }
            this.currentPlayer = player;
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
        this.ui.hideColorSelection();
        this.ui.updateGameInfo();
        if (!this.isPlayerTurn) {
            this.ai.makeMove();
        }
    }

    makeMove(from, to) {
        const result = this.board.movePiece(from, to);
        if (result) {
            this.moveCount[this.currentPlayer]++;
            
            if (!result.continueTurn) {
                this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
                this.isPlayerTurn = !this.isPlayerTurn;
            } else {
                this.continueTurn = true;
            }

            this.checkForCaptures();
            this.ui.updateGameInfo();
            
            if (this.isGameOver()) {
                this.handleGameOver();
            }

            if (!this.isPlayerTurn) {
                this.ai.makeMove();
            }
            return true;
        }
        return false;
    }

    checkForCaptures() {
        this.availableCaptures = this.board.getAvailableCaptures(this.currentPlayer);
        this.mustCapture = this.availableCaptures.length > 0;
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
        localStorage.setItem('whiteScore', this.totalScore.white);
        localStorage.setItem('blackScore', this.totalScore.black);
        if (this.currentPlayer) {
            this.db.updatePlayerStats(this.currentPlayer.username, 
                this.playerColor === winner);
        }
        this.ui.showGameOver(winner);
    }

    resetGame() {
        this.board = new Board();
        this.currentPlayer = 'white';
        this.playerColor = null;
        this.isPlayerTurn = false;
        this.moveCount = { white: 0, black: 0 };
        this.mustCapture = false;
        this.availableCaptures = [];
        this.selectedPiece = null;
        this.continueTurn = false;
        const currentPlayer = this.currentPlayer;
        this.ui.showColorSelection();
        if (currentPlayer) {
            this.ui.updatePlayerInfo(currentPlayer);
        }
    }
} 