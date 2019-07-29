export const Player = Object.freeze({"BLACK":0, "WHITE":1});
export const Piece = Object.freeze({"BLACK":0, "WHITE":1});

export class Othello {
    constructor(playerColor, boardSize) {
        this.currentPlayer = Player.WHITE;
        this.playerColorString = playerColor;
        this.player = playerColor.toLowerCase() === "black" ? Player.BLACK : Player.WHITE;
        this.size = boardSize;
        this.blackScore = 2;
        this.whiteScore = 2;
        this._positions = {};
        this._positionsSet = {};

        this.changeHistory = [];

        // initialize board
        this.board = new Array(this.size);

        for (let i = 0; i < this.size; i++) {
            this.board[i] = new Array(this.size).fill(undefined);
        }

        let middle_two = [this.size / 2 - 1, this.size / 2];
        for (let i of middle_two) {
            for (let j of middle_two) {
                this.board[i][j] = i === j ? Piece.WHITE : Piece.BLACK;
            }
        }
    }

    static copy(game) {
        let copy = new Othello(game.playerColorString, game.size);
        copy.currentPlayer = game.currentPlayer;
        copy.changeHistory = game.changeHistory.slice();
        copy.board = game.board.map(function(arr) {
            return arr.slice();
        });
        return copy;
    }

    place(x, y) {
        if (this.board[x][y] !== undefined) return;

        let currentColor = this.getCurrentPieceColor();
        this.board[x][y] = currentColor;
        let flipped = [];

        for (let i of [-1, 0, 1]) {
            for (let j of [-1, 0, 1]) {
                if (i === 0 && j === 0) continue;
                let checkX = x + i;
                let checkY = y + j;
                let haveOtherColor = false;
                let potentialFlip = [];

                while (true) {
                    if (checkX < 0 || checkX >= this.size ||
                        checkY < 0 || checkY >= this.size ||
                        this.board[checkX][checkY] === undefined)
                        break;

                    if (this.board[checkX][checkY] === currentColor) {
                        for (let [xx, yy] of potentialFlip) {
                            this.board[xx][yy] = currentColor;
                        }
                        flipped.push(...potentialFlip);
                        break;
                    }

                    potentialFlip.push([checkX, checkY]);
                    checkX += i;
                    checkY += j;
                    haveOtherColor = true;
                }
            }
        }

        // update score
        if (this.currentPlayer === Player.BLACK) {
            this.blackScore += 1;
            this.blackScore += flipped.length;
            this.whiteScore -= flipped.length;
        } else {
            this.whiteScore += 1;
            this.whiteScore += flipped.length;
            this.blackScore -= flipped.length;

        }

        // update history
        this.changeHistory.push([this.currentPlayer, [x, y], flipped]);

        // update cache
        this._positions = {};
        this._positionsSet = {};

        // update player
        let otherPlayer = Othello.otherPlayer(this.currentPlayer);
        if (this.placeables(otherPlayer).length !== 0) this.currentPlayer = otherPlayer;


        return flipped;
    }

    getCurrentPieceColor() {
        return Othello.getPlayerPieceColor(this.currentPlayer);
    }

    static getPlayerPieceColor(player) {
        return player === Player.BLACK ? Piece.BLACK : Piece.WHITE;
    }

    static otherPlayer(player){
        return player === Player.BLACK? Player.WHITE : Player.BLACK;
    }

    isFinished() {
        return this.placeables(Player.BLACK).length === 0 &&
               this.placeables(Player.WHITE).length === 0;
    }

    placeablesSet(player){
        if (this._positionsSet[player] !== undefined) return this._positionsSet[player];

        let positions = this.placeables(player);

        this._positionsSet = new Set(positions.map((x) => `${x}`));
        return this._positionsSet;
    }

    placeables(player) {
        if (this._positions[player] !== undefined) return this._positions[player];

        let positions = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.placeable(player, i, j))
                    positions.push([i, j]);
            }
        }

        this._positions[player] = positions;
        return positions;
    }

    placeable(player, x, y) {
        if (this.board[x][y] !== undefined) return false;
        let myColor = Othello.getPlayerPieceColor(player);

        for (let i of [-1, 0, 1]) {
            for (let j of [-1, 0, 1]) {
                if (i === 0 && j === 0) continue;
                let checkX = x + i;
                let checkY = y + j;
                let haveOtherColor = false;
                while (true) {
                    if (checkX < 0 || checkX >= this.size ||
                        checkY < 0 || checkY >= this.size ||
                        this.board[checkX][checkY] === undefined)
                        break;

                    if (this.board[checkX][checkY] === myColor) {
                        if (haveOtherColor) return true;
                        else {
                            break;
                        }
                    }

                    checkX += i;
                    checkY += j;
                    haveOtherColor = true;
                }
            }
        }

        return false;
    }

    undo() {
        if (this.changeHistory.length === 0) return false;

        // update cache
        this._positions = {};
        this._positionsSet = {};

        let [player, lastmove, flipped] = this.changeHistory.pop();
        let [x, y] = lastmove;
        let otherPlayer = Othello.otherPlayer(player);
        let otherPiece = Othello.getPlayerPieceColor(otherPlayer);

        this.board[x][y] = undefined;
        this.currentPlayer = player;

        if (player === Player.WHITE) {
            this.whiteScore -= 1 + flipped.length;
            this.blackScore += flipped.length;
        } else {
            this.blackScore -= 1 + flipped.length;
            this.whiteScore += flipped.length;
        }


        for (let [xx, yy] of flipped) {
            this.board[xx][yy] = otherPiece;
        }

        return this.currentPlayer;
    }

    undoMove(x, y) {
        if (this.changeHistory.length === 0) return false;

        let lastMove = this.changeHistory[this.changeHistory.length - 1][1];
        if (lastMove[0] === x && lastMove[1] === y) return this.undo();

        return false;
    }



    isMyTurn() {
        return this.currentPlayer === this.player;
    }

    toString() {
        let rowStrings = [];

        for (let i = 0; i < this.size; i++) {
            let row = this.board[i].map(piece => {
                if (piece === undefined) return '_';
                else if (piece === Piece.BLACK) return '●';
                else return '○';
            });
            rowStrings.push(row.join(''));
        }

        return rowStrings.join('\n');
    }

    getWinner() {
        if (this.blackScore === this.whiteScore) {
            return null;
        } else if (this.blackScore > this.whiteScore) {
            return Player.BLACK;
        } else {
            return Player.WHITE;
        }
    }
}