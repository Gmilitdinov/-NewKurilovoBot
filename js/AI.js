class AI {
    constructor(game) {
        this.game = game;
    }

    makeMove() {
        setTimeout(() => {
            const aiColor = this.game.playerColor === 'white' ? 'black' : 'white';
            const possibleMoves = this.getAllPossibleMoves(aiColor);
            
            if (possibleMoves.length > 0) {
                const move = this.chooseBestMove(possibleMoves);
                this.simulateMove(move.from, move.to);
            }
        }, 500);
    }

    getAllPossibleMoves(color) {
        const moves = [];
        const captures = [];
        const board = this.game.board;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board.state[i][j] === color) {
                    if (board.hasCapture(i, j, color)) {
                        captures.push({
                            from: { row: i, col: j },
                            to: this.getCaptureMoves(i, j, color)[0]
                        });
                    } else {
                        const possibleMoves = this.getRegularMoves(i, j, color);
                        moves.push(...possibleMoves.map(move => ({
                            from: { row: i, col: j },
                            to: move
                        })));
                    }
                }
            }
        }
        
        return captures.length > 0 ? captures : moves;
    }

    getRegularMoves(row, col, color) {
        const moves = [];
        const directions = color === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
        
        for (let [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.game.board.isValidPosition(newRow, newCol) && 
                !this.game.board.state[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol });
            }
        }
        
        return moves;
    }

    getCaptureMoves(row, col, color) {
        const moves = [];
        const directions = color === 'white' ? [[-2, -2], [-2, 2]] : [[2, -2], [2, 2]];
        
        for (let [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.game.board.canCapture(row, col, newRow, newCol)) {
                moves.push({ row: newRow, col: newCol });
            }
        }
        
        return moves;
    }

    chooseBestMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    simulateMove(from, to) {
        const fromCell = this.game.board.getCell(from.row, from.col);
        const toCell = this.game.board.getCell(to.row, to.col);
        this.game.makeMove(fromCell, toCell);
    }
} 