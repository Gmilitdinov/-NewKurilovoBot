class AI {
    constructor(game) {
        this.game = game;
        this.difficulty = 'medium';
    }

    setDifficulty(level) {
        this.difficulty = level;
    }

    makeMove() {
        setTimeout(() => {
            const aiColor = this.game.playerColor === 'white' ? 'black' : 'white';
            const possibleMoves = this.getAllPossibleMoves(aiColor);
            
            if (possibleMoves.length > 0) {
                const captureMoves = possibleMoves.filter(move => move.isCapture);
                let move;

                if (captureMoves.length > 0) {
                    move = this.chooseBestMove(captureMoves);
                } else {
                    move = this.chooseBestMove(possibleMoves);
                }

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
        switch (this.difficulty) {
            case 'easy':
                // Случайный выбор хода
                return moves[Math.floor(Math.random() * moves.length)];
            
            case 'medium':
                // Приоритет взятия и защиты своих шашек
                return this.chooseMediumMove(moves);
            
            case 'hard':
                // Анализ на несколько ходов вперед
                return this.chooseHardMove(moves);
            
            default:
                return moves[Math.floor(Math.random() * moves.length)];
        }
    }

    chooseMediumMove(moves) {
        // Приоритеты:
        // 1. Взятие шашки
        // 2. Защита своих шашек под угрозой
        // 3. Продвижение к дамке
        // 4. Случайный ход
        
        const captureMoves = moves.filter(move => move.isCapture);
        if (captureMoves.length > 0) {
            return captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }

        const defensiveMoves = moves.filter(move => this.isDefensiveMove(move));
        if (defensiveMoves.length > 0) {
            return defensiveMoves[Math.floor(Math.random() * defensiveMoves.length)];
        }

        const progressMoves = moves.filter(move => this.isProgressMove(move));
        if (progressMoves.length > 0) {
            return progressMoves[Math.floor(Math.random() * progressMoves.length)];
        }

        return moves[Math.floor(Math.random() * moves.length)];
    }

    chooseHardMove(moves) {
        // Оценка каждого хода с учетом:
        // 1. Возможности множественного взятия
        // 2. Контроля центра доски
        // 3. Защиты своих шашек
        // 4. Создания дамки
        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const move of moves) {
            const score = this.evaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    evaluateMove(move) {
        let score = 0;

        // Базовые очки за взятие
        if (move.isCapture) score += 10;

        // Очки за продвижение к дамке
        if (this.isProgressMove(move)) score += 5;

        // Очки за контроль центра
        if (this.isControllingCenter(move.to)) score += 3;

        // Очки за защиту
        if (this.isDefensiveMove(move)) score += 4;

        return score;
    }

    isDefensiveMove(move) {
        // Проверяем, защищает ли ход шашку под угрозой
        return false; // Реализовать логику
    }

    isProgressMove(move) {
        // Проверяем, приближает ли ход к созданию дамки
        const aiColor = this.game.playerColor === 'white' ? 'black' : 'white';
        const direction = aiColor === 'black' ? 1 : -1;
        return direction * (move.to.row - move.from.row) > 0;
    }

    isControllingCenter(position) {
        // Проверяем, контролирует ли позиция центр доски
        const { row, col } = position;
        return (row >= 2 && row <= 5 && col >= 2 && col <= 5);
    }

    simulateMove(from, to) {
        const fromCell = this.game.board.getCell(from.row, from.col);
        const toCell = this.game.board.getCell(to.row, to.col);
        this.game.makeMove(fromCell, toCell);
    }
} 