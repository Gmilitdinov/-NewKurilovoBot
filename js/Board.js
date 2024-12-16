class Board {
    constructor(playerColor = 'white') {
        this.state = new Array(8).fill(null).map(() => new Array(8).fill(null));
        this.element = document.getElementById('board');
        this.playerColor = playerColor;
        this.init();
    }

    init() {
        this.element.innerHTML = '';
        
        // Создаем клетки
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = this.createCell(i, j);
                this.element.appendChild(cell);
            }
        }

        // Расставляем шашки
        if (this.playerColor === 'black') {
            // Для черных: черные внизу, белые вверху
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if ((7 - row + col) % 2 !== 0) {
                        const cell = this.getCell(7 - row, col);
                        if (row < 3) {
                            // Белые шашки сверху
                            this.addPiece(cell, 'white');
                            this.state[7 - row][col] = 'white';
                        } else if (row > 4) {
                            // Черные шашки снизу
                            this.addPiece(cell, 'black');
                            this.state[7 - row][col] = 'black';
                        }
                    }
                }
            }
            this.element.classList.add('reversed');
        } else {
            // Для белых: стандартная расстановка
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if ((row + col) % 2 !== 0) {
                        const cell = this.getCell(row, col);
                        if (row < 3) {
                            // Черные шашки сверху
                            this.addPiece(cell, 'black');
                            this.state[row][col] = 'black';
                        } else if (row > 4) {
                            // Белые шашки снизу
                            this.addPiece(cell, 'white');
                            this.state[row][col] = 'white';
                        }
                    }
                }
            }
            this.element.classList.remove('reversed');
        }
    }

    createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = `cell ${(row + col) % 2 === 0 ? 'cell-white' : 'cell-black'}`;
        cell.dataset.row = row;
        cell.dataset.col = col;
        return cell;
    }

    addPiece(cell, color) {
        const piece = document.createElement('div');
        piece.className = `piece piece-${color}`;
        cell.appendChild(piece);
    }

    getCell(row, col) {
        return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    isValidMove(fromRow, fromCol, toRow, toCol, isCapture) {
        if ((toRow + toCol) % 2 === 0) {
            return false;
        }

        const piece = this.state[fromRow][fromCol];
        const isKing = piece?.includes('king');

        const hasAnyCapture = this.hasAnyCapture(this.state[fromRow][fromCol].split('_')[0]);
        if (hasAnyCapture && !isCapture) {
            return false;
        }
        
        if (!isCapture) {
            if (Math.abs(toRow - fromRow) !== 1 || Math.abs(toCol - fromCol) !== 1) {
                return false;
            }

            if (!isKing) {
                const direction = piece.startsWith('white') ? -1 : 1;
                if (toRow - fromRow !== direction) {
                    return false;
                }
            }
        } else {
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

            if ((toRow === 0 && this.state[toRow][toCol].startsWith('white')) ||
                (toRow === 7 && this.state[toRow][toCol].startsWith('black'))) {
                piece.classList.add('king');
                this.state[toRow][toCol] = this.state[toRow][toCol].split('_')[0] + '_king';
            } else if (wasKing) {
                piece.classList.add('king');
                this.state[toRow][toCol] = this.state[toRow][toCol].split('_')[0] + '_king';
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

            if ((toRow === 0 && this.state[toRow][toCol].startsWith('white')) ||
                (toRow === 7 && this.state[toRow][toCol].startsWith('black'))) {
                piece.classList.add('king');
                this.state[toRow][toCol] = this.state[toRow][toCol].split('_')[0] + '_king';
            } else if (wasKing) {
                piece.classList.add('king');
                this.state[toRow][toCol] = this.state[toRow][toCol].split('_')[0] + '_king';
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