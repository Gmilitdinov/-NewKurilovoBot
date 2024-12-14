class Board {
    constructor() {
        this.state = new Array(8).fill(null).map(() => new Array(8).fill(null));
        this.element = document.getElementById('board');
        this.init();
    }

    init() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = this.createCell(i, j);
                this.element.appendChild(cell);
            }
        }
    }

    createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = `cell ${(row + col) % 2 === 0 ? 'cell-white' : 'cell-black'}`;
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        if ((row + col) % 2 !== 0) {
            if (row < 3) {
                this.addPiece(cell, 'black');
                this.state[row][col] = 'black';
            } else if (row > 4) {
                this.addPiece(cell, 'white');
                this.state[row][col] = 'white';
            }
        }
        
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

    movePiece(from, to) {
        const fromRow = parseInt(from.dataset.row);
        const fromCol = parseInt(from.dataset.col);
        const toRow = parseInt(to.dataset.row);
        const toCol = parseInt(to.dataset.col);
        
        const piece = from.querySelector('.piece');
        if (!piece) return false;
        
        if ((toRow === 0 && this.state[fromRow][fromCol] === 'white') ||
            (toRow === 7 && this.state[fromRow][fromCol] === 'black')) {
            piece.classList.add('king');
            this.state[fromRow][fromCol] += '_king';
        }

        if (Math.abs(toRow - fromRow) === 2) {
            this.capturePiece(fromRow, fromCol, toRow, toCol);
            if (this.hasCapture(toRow, toCol, this.state[fromRow][fromCol])) {
                return { continueTurn: true };
            }
        }
        
        from.removeChild(piece);
        to.appendChild(piece);
        this.state[toRow][toCol] = this.state[fromRow][fromCol];
        this.state[fromRow][fromCol] = null;
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
                if (this.state[i][j] === color && this.hasCapture(i, j, color)) {
                    captures.push(this.getCell(i, j));
                }
            }
        }
        return captures;
    }

    hasCapture(row, col, color) {
        const isKing = color.includes('king');
        const directions = isKing ? 
            [[-2, -2], [-2, 2], [2, -2], [2, 2]] : // Дамка может ходить в любом направлении
            (color.startsWith('white') ? [[-2, -2], [-2, 2]] : [[2, -2], [2, 2]]);
        
        for (let [dRow, dCol] of directions) {
            if (this.canCapture(row, col, row + dRow, col + dCol)) {
                return true;
            }
        }
        return false;
    }

    canCapture(fromRow, fromCol, toRow, toCol) {
        if (!this.isValidPosition(toRow, toCol)) return false;
        if (this.state[toRow][toCol]) return false;

        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        
        return this.state[midRow][midCol] && 
               this.state[midRow][midCol] !== this.state[fromRow][fromCol];
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
} 