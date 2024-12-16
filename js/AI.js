class AI {
    constructor(game) {
        this.game = game;
    }

    makeMove() {
        setTimeout(() => {
            const aiColor = this.game.playerColor === 'white' ? 'black' : 'white';
            const possibleMoves = this.getAllPossibleMoves(aiColor);
            
            if (possibleMoves.length > 0) {
                const captureMoves = possibleMoves.filter(move => move.isCapture);
                const move = captureMoves.length > 0 ? 
                    this.chooseBestMove(captureMoves) : 
                    this.chooseBestMove(possibleMoves);

                this.simulateMove(move.from, move.to);

                if (move.isCapture) {
                    const nextCaptures = this.game.board.getAvailableCapturesForPiece(move.to.row, move.to.col);
                    if (nextCaptures.length > 0) {
                        setTimeout(() => {
                            const nextMove = {
                                from: move.to,
                                to: nextCaptures[0],
                                isCapture: true
                            };
                            this.simulateMove(nextMove.from, nextMove.to);
                        }, 500);
                    }
                }
            }
        }, 500);
    }

    getAllPossibleMoves(color) {
        const moves = [];
        const board = this.game.board;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board.state[i][j]?.startsWith(color)) {
                    const captureMoves = this.getCaptureMoves(i, j, color);
                    moves.push(...captureMoves);
                }
            }
        }

        if (moves.length === 0) {
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (board.state[i][j]?.startsWith(color)) {
                        const regularMoves = this.getRegularMoves(i, j, color);
                        moves.push(...regularMoves);
                    }
                }
            }
        }

        return moves;
    }

    getCaptureMoves(row, col, color) {
        const moves = [];
        const board = this.game.board;
        const directions = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
        const isKing = board.state[row][col]?.includes('king');

        for (let [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            const midRow = row + dRow/2;
            const midCol = col + dCol/2;

            if (!board.isValidPosition(newRow, newCol)) continue;
            if ((newRow + newCol) % 2 === 0) continue;
            if (board.state[newRow][newCol]) continue;

            const midPiece = board.state[midRow][midCol];
            if (midPiece && !midPiece.startsWith(color)) {
                moves.push({
                    from: { row, col },
                    to: { row: newRow, col: newCol },
                    isCapture: true
                });
            }
        }

        return moves;
    }

    getRegularMoves(row, col, color) {
        const moves = [];
        const board = this.game.board;
        const isKing = board.state[row][col]?.includes('king');
        
        const directions = isKing ? 
            [[-1, -1], [-1, 1], [1, -1], [1, 1]] : // Для дамки
            (color === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]); // Для обычных шашек

        for (let [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (!board.isValidPosition(newRow, newCol)) continue;
            if ((newRow + newCol) % 2 === 0) continue;
            if (board.state[newRow][newCol]) continue;

            moves.push({
                from: { row, col },
                to: { row: newRow, col: newCol },
                isCapture: false
            });
        }

        return moves;
    }

    chooseBestMove(moves) {
        const captureMoves = moves.filter(move => move.isCapture);
        if (captureMoves.length > 0) {
            return captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    simulateMove(from, to) {
        const fromCell = this.game.board.getCell(from.row, from.col);
        const toCell = this.game.board.getCell(to.row, to.col);
        this.game.makeMove(fromCell, toCell);
    }
} 