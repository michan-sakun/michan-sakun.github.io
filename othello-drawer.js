import {Othello, Piece, Player} from './othello.js';

const GREEN = '#51A04F';
const BLACK = '#2e2e2e';
const WHITE = '#fafafa';

const SIDE = 300;
const OFFSET = 5;
const BORDER = 4;
const DOT_RADIUS = 4;
const PIECE_OFFSET = 4;


export class OthelloDrawer {
    constructor(canvas, game, moveSender) {

        this.canvas = canvas;

        this.ctx = canvas.getContext('2d');
        this.game = game;

        this.myColor = OthelloDrawer.getPieceColor(
            Othello.getPlayerPieceColor(game.player));

        this._lastX = -1;
        this._lastY = -1;

        canvas.addEventListener('click', (event) => {
            console.log(this.game.isMyTurn());
            if (!this.game.isMyTurn()) return;

            this.drawBoard();
            let x = event.pageX - canvas.offsetLeft;
            let y = event.pageY - canvas.offsetTop;

            let [gx, gy] = this.findGrid(x, y);
            let placements = this.game.placeablesSet(this.game.currentPlayer);
            console.log(placements, gx, gy);

            if (!placements.has(`${gx},${gy}`)) return;
            console.log("yes");
            if (gx === -1) return;

            let cp = this.game.currentPlayer;
            this.game.place(gx, gy);
            moveSender(cp, gx, gy, this.game.isFinished());
            this.drawBoard();
        });

        canvas.addEventListener('mousemove', (event) => {
            if (!this.game.isMyTurn()) return;

            let x = event.pageX - canvas.offsetLeft;
            let y = event.pageY - canvas.offsetTop;
            let scale = 320 / this.canvas.offsetWidth;

            x *= scale;
            y *= scale;
            let [gx, gy] = this.findGrid(x, y);

            if (this._lastX === gx && this._lastY === gy) return;

            this.drawBoard();
            let placements = this.game.placeablesSet(this.game.currentPlayer);

            this._lastX = gx;
            this._lastY = gy;
            if (gx === -1 || !placements.has(`${gx},${gy}`)) return;

            this.drawLightPiece(...this.gridToXY(gx, gy), this.myColor);
        });
    }

    findGrid(x, y) {
        let boardX = x - OFFSET - BORDER;
        let boardY = y - OFFSET - BORDER;

        if (boardX < 0 || boardX >= SIDE ||
            boardY < 0 || boardY >= SIDE) {
            return [-1, -1];
        }

        let gridX = Math.floor(boardX / (SIDE / this.game.size));
        let gridY = Math.floor(boardY / (SIDE / this.game.size));

        return [gridX, gridY];
    }


    gridToXY(gx, gy) {
        return [this.gridToX(gx), this.gridToX(gy)];
    }

    gridToX(gx) {
        return OFFSET + BORDER + (gx + 0.5) * (SIDE / this.game.size);
    }

    drawPiece(x, y, color) {
        this.ctx.fillStyle = color;
        this.drawCircle(x, y, SIDE / (2 * this.game.size) - PIECE_OFFSET);
    }

    drawLightPiece(x, y, color) {
        this.ctx.globalAlpha = 0.5;
        this.drawPiece(x, y, color);
        this.ctx.globalAlpha = 1;
    }

    drawBoard() {
        let size = this.game.size;

        // border
        this.ctx.fillStyle = BLACK;
        this.ctx.fillRect(OFFSET, OFFSET, SIDE + 2 * BORDER, SIDE + + 2 * BORDER);

        // main green
        this.ctx.fillStyle = GREEN;
        this.ctx.fillRect(OFFSET + BORDER, OFFSET + BORDER, SIDE, SIDE);

        // hlines
        this.ctx.fillStyle = BLACK;
        // todo replace with game.size
        for (let i = 1; i < size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(OFFSET + BORDER       , OFFSET + BORDER + i * (SIDE / size));
            this.ctx.lineTo(OFFSET + BORDER + SIDE, OFFSET + BORDER + i * (SIDE / size));
            this.ctx.stroke();
        }

        // vlines
        // todo replace with game.size
        for (let i = 1; i < size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(OFFSET + BORDER + i * (SIDE / size), OFFSET + BORDER);
            this.ctx.lineTo(OFFSET + BORDER + i * (SIDE / size), OFFSET + BORDER + SIDE);
            this.ctx.stroke();
        }

        // dots
        for (let x of [OFFSET + BORDER + 2 * (SIDE / size), OFFSET + BORDER + (size - 2) * (SIDE / size)]) {
            for (let y of [OFFSET + BORDER + 2 * (SIDE / size), OFFSET + BORDER + (size - 2) * (SIDE / size)]) {
                this.drawCircle(x, y, DOT_RADIUS);
            }
        }

        this.drawGameState();
    }

    drawGameState() {
        for(let i = 0; i < this.game.size; i++) {
            for(let j = 0; j < this.game.size; j++) {
                let piece = this.game.board[i][j];
                if (piece !== undefined) {
                    this.drawPiece(...this.gridToXY(i, j),
                        OthelloDrawer.getPieceColor(piece));
                }
            }
        }
    }

    static getPieceColor(piece) {
        return piece === Piece.BLACK ? BLACK : WHITE;

    }

    drawCircle(x, y, radius){
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }
}
