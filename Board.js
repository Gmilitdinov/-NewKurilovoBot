class Board {
    constructor(playerColor = 'white') {
        this.element = document.getElementById('board');
        this.state = Array(8).fill().map(() => Array(8).fill(null));
        this.isReversed = playerColor === 'black';
        
        this.createBoard();
        this.initializePieces();
    }

    createBoard() {
        this.element.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Если доска перевернута, меняем координаты
                const row = this.isReversed ? 7 - i : i;
                const col = this.isReversed ? 7 - j : j;
                
                cell.classList.add((row + col) % 2 === 0 ? 'cell-white' : 'cell-black');
                cell.dataset.row = row.toString();
                cell.dataset.col = col.toString();
                
                this.element.appendChild(cell);
            }
        }
    }

    initializePieces() {
        // Расставляем черные шашки
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 8; j++) {
                if ((i + j) % 2 === 1) {
                    const row = this.isReversed ? 7 - i : i;
                    const col = this.isReversed ? 7 - j : j;
                    this.addPiece(row, col, 'black');
                }
            }
        }

        // Расставляем белые шашки
        for (let i = 5; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if ((i + j) % 2 === 1) {
                    const row = this.isReversed ? 7 - i : i;
                    const col = this.isReversed ? 7 - j : j;
                    this.addPiece(row, col, 'white');
                }
            }
        }
    }

    addPiece(row, col, color) {
        const cell = this.getCell(row, col);
        const piece = document.createElement('div');
        piece.className = `piece piece-${color}`;
        cell.appendChild(piece);
        this.state[row][col] = color;
    }

    getCell(row, col) {
        return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    isValidMove(fromRow, fromCol, toRow, toCol, isCapture) {
        // Проверяем, что целевая клетка черная
        if ((toRow + toCol) % 2 === 0) {
            return false;
        }

        const piece = this.state[fromRow][fromCol];
        if (!piece) return false;

        const isKing = piece.includes('king');
        const pieceColor = piece.split('_')[0];

        // Проверяем наличие обязательных взятий
        const hasAnyCapture = this.hasAnyCapture(pieceColor);
        if (hasAnyCapture && !isCapture) {
            return false;
        }
        
        if (!isCapture) {
            // Обычный ход
            if (Math.abs(toRow - fromRow) !== 1 || Math.abs(toCol - fromCol) !== 1) {
                return false;
            }

            // Для обычной шашки проверяем направление движения
            if (!isKing) {
                const direction = pieceColor === 'white' ? -1 : 1;
                if (toRow - fromRow !== direction) {
                    return false;
                }
            }
        } else {
            // Ход с взятием
            if (Math.abs(toRow - fromRow) !== 2 || Math.abs(toCol - fromCol) !== 2) {
                return false;
            }
        }

        return true;
    }

    hasAnyCapture(color) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.state[i][j]?.startsWith(color)) {
                    if (this.hasCapture(i, j, color)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    movePiece(from, to) {
        const fromRow = parseInt(from.dataset.row);
        const fromCol = parseInt(from.dataset.col);
        const toRow = parseInt(to.dataset.row);
        const toCol = parseInt(to.dataset.col);
        
        const piece = from.querySelector('.piece');
        if (!piece) return false;

        const pieceColor = piece.classList.contains('piece-black') ? 'black' : 'white';
        const isCapture = Math.abs(toRow - fromRow) === 2;
        const wasKing = piece.classList.contains('king');
        
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol, isCapture)) {
            return false;
        }

        if (isCapture) {
            if (!this.canCapture(fromRow, fromCol, toRow, toCol)) {
                return false;
            }
            
            this.capturePiece(fromRow, fromCol, toRow, toCol);
            
            from.removeChild(piece);
            to.appendChild(piece);
            this.state[toRow][toCol] = this.state[fromRow][fromCol];
            this.state[fromRow][fromCol] = null;

            if ((toRow === 0 && pieceColor === 'white') ||
                (toRow === 7 && pieceColor === 'black')) {
                piece.classList.add('king');
                this.state[toRow][toCol] = pieceColor + '_king';
            } else if (wasKing) {
                piece.classList.add('king');
                this.state[toRow][toCol] = pieceColor + '_king';
            }

            const nextCaptures = this.getAvailableCapturesForPiece(toRow, toCol);
            if (nextCaptures.length > 0) {
                return { continueTurn: true };
            }
        } else {
            from.removeChild(piece);
            to.appendChild(piece);
            this.state[toRow][toCol] = this.state[fromRow][fromCol];
            this.state[fromRow][fromCol] = null;

            if ((toRow === 0 && pieceColor === 'white') ||
                (toRow === 7 && pieceColor === 'black')) {
                piece.classList.add('king');
                this.state[toRow][toCol] = pieceColor + '_king';
            } else if (wasKing) {
                piece.classList.add('king');
                this.state[toRow][toCol] = pieceColor + '_king';
            }
        }
        
        return { continueTurn: false };
    }

    capturePiece(fromRow, fromCol, toRow, toCol) {
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        const midCell = this.getCell(midRow, midCol);
        const capturedPiece = midCell.querySelector('.piece');
        if (capturedPiece) {
            midCell.removeChild(capturedPiece);
            this.state[midRow][midCol] = null;
        }
    }

    getAvailableCaptures(color) {
        const captures = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.state[i][j]?.startsWith(color)) {
                    const pieceCaps = this.getAvailableCapturesForPiece(i, j);
                    if (pieceCaps.length > 0) {
                        captures.push(this.getCell(i, j));
                    }
                }
            }
        }
        return captures;
    }

    canCapture(fromRow, fromCol, toRow, toCol) {
        if (!this.isValidPosition(toRow, toCol)) return false;
        if (this.state[toRow][toCol]) return false;
        if ((toRow + toCol) % 2 === 0) return false;

        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        const attackingPiece = this.state[fromRow][fromCol];
        const targetPiece = this.state[midRow][midCol];

        return targetPiece && 
               !targetPiece.startsWith(attackingPiece.split('_')[0]) &&
               Math.abs(toRow - fromRow) === 2 &&
               Math.abs(toCol - fromCol) === 2;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    getAvailableCapturesForPiece(row, col) {
        if (!this.state[row][col]) return [];

        const color = this.state[row][col].split('_')[0];
        const isKing = this.state[row][col].includes('king');
        const directions = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
        const captures = [];

        for (let [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            const midRow = row + dRow/2;
            const midCol = col + dCol/2;

            if (!this.isValidPosition(newRow, newCol) || !this.isValidPosition(midRow, midCol)) {
                continue;
            }

            if ((newRow + newCol) % 2 === 1 && !this.state[newRow][newCol]) {
                const midPiece = this.state[midRow][midCol];
                if (midPiece && !midPiece.startsWith(color)) {
                    captures.push({ row: newRow, col: newCol });
                }
            }
        }

        return captures;
    }

    hasCapture(row, col, color) {
        return this.getAvailableCapturesForPiece(row, col).length > 0;
    }
} 