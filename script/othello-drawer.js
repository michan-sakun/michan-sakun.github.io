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
    constructor(canvas, gameTitleMessage, gameMessage, game, messages, moveSender) {
        let that = this;

        this.canvas = canvas;
        this.gameMessage = gameMessage;
        this.gameTitleMessage = gameTitleMessage;
        this.messages = messages;

        this.ctx = canvas.getContext('2d');
        this.game = game;

        this.myColor = OthelloDrawer.getPieceColor(
            Othello.getPlayerPieceColor(game.player));

        this._lastX = -1;
        this._lastY = -1;

        let getMousePosition = function (canvas, event) {
            let rect = canvas.getBoundingClientRect();
            let x = event.pageX - rect.left;
            let y = event.pageY - rect.top;
            let scale = 320 / canvas.offsetWidth;

            return [x*scale, y*scale];
        };

        this.clickHanler = (event) => {
            if (!this.game.isMyTurn()) return;

            this.drawBoard();
            let [x, y] = getMousePosition(canvas, event);

            let [gx, gy] = this.findGrid(x, y);
            let placements = this.game.placeablesSet(this.game.currentPlayer);

            if (!placements.has(`${gx},${gy}`)) return;
            if (gx === -1) return;

            let cp = this.game.currentPlayer;
            this.game.place(gx, gy);
            moveSender(cp, gx, gy, this.game.isFinished());

            this.drawBoard();
        };

        this.moveHandler = (event) => {
            if (!this.game.isMyTurn()) return;

            let [x, y] = getMousePosition(canvas, event);
            let [gx, gy] = this.findGrid(x, y);

            if (this._lastX === gx && this._lastY === gy) return;

            this.drawBoard();
            let placements = this.game.placeablesSet(this.game.currentPlayer);

            this._lastX = gx;
            this._lastY = gy;
            if (gx === -1 || !placements.has(`${gx},${gy}`)) return;

            this.drawLightPiece(...this.gridToXY(gx, gy), this.myColor);
        };

        canvas.addEventListener('click', this.clickHanler);
        canvas.addEventListener('mousemove', this.moveHandler);
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
        for (let i = 1; i < size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(OFFSET + BORDER       , OFFSET + BORDER + i * (SIDE / size));
            this.ctx.lineTo(OFFSET + BORDER + SIDE, OFFSET + BORDER + i * (SIDE / size));
            this.ctx.stroke();
        }

        // vlines
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
        let message = this.game.isMyTurn() ? this.messages.playMessage : this.messages.waitMessage;
        this.updateText(`◯ ${this.game.whiteScore} - ${this.game.blackScore} ⬤`, message);
        this.drawPlacementHelper();
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

    drawPlacementHelper() {
        if (!this.game.isMyTurn()) return;

        let placeables = this.game.placeables(this.game.player);

        this.ctx.fillStyle = OthelloDrawer.getPieceColor(this.game.player);
        this.ctx.globalAlpha = 0.5;

        for(let [gx, gy] of placeables) {
            let [x, y] = this.gridToXY(gx, gy);
            this.drawCircle(x, y, 2);
        }

        this.ctx.globalAlpha = 1;
    }

    static getPieceColor(piece) {
        return piece === Piece.BLACK ? BLACK : WHITE;

    }

    drawCircle(x, y, radius){
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }

    updateText(titleMessage, message) {
        this.gameTitleMessage.innerText = titleMessage;
        this.gameMessage.innerText = message;
    }

    removeListeners() {
        this.canvas.removeEventListener("click", this.clickHanler);
        this.canvas.removeEventListener("mousemove", this.moveHandler);
    }
}
