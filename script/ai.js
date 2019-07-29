import {Piece, Player, Othello} from './othello.js'
import {argMax, sleep} from './util.js'

let MAX_DEPTH = 6;
let count = 0;

export class AI{
    constructor(){
        this.game = null;
        this.search = false;
        this.maximizingPlayer = null;
    }

    async findBestMove(game, resultHandler){

        // cloning game
        this.game = Othello.copy(game);
        console.log(this.game.currentPlayer);
        console.log(this.game.toString());
        this.maximizingPlayer = this.game.currentPlayer;

        this.search = true;

        let prevBestMoves = [];

        // IDS starting from depth = 2
        for (let i = 1; this.search && i <= MAX_DEPTH; i++) {
            console.log("Depth: ", i);
            let scoreMoves = this.allScoreAlphaBeta(-Infinity, Infinity, i, prevBestMoves);
            let [maxScore, moves] = argMax(scoreMoves);
            prevBestMoves = moves;
            resultHandler(scoreMoves);
            await sleep(500);
        }

        return !this.search;
    }

    quitSearch() {
        this.search = false;
    }

    allScoreAlphaBeta(alpha, beta, depth, prevBestMoves) {
        let g = this.game;

        if (depth === 0 || g.isFinished()) {
            return [this.heuristics(), []]
        }

        let scoreMovePairs = [];

        let prevBestMove = null;
        let availableMoves = g.placeables(g.currentPlayer);
        if (prevBestMoves.length > 0) {
            prevBestMove = prevBestMoves.pop();
            let i = availableMoves.findIndex(m => m[0] === prevBestMove[0] && m[1] === prevBestMove[1]);
            let m = availableMoves[i];
            availableMoves.splice(i, 1);
            availableMoves.unshift(m);

        }

        if (g.currentPlayer === this.maximizingPlayer) {
            for (let move of availableMoves) {
                g.place(...move);
                let [score, moves] = this.alphaBeta(alpha, beta, depth - 1, prevBestMoves);
                g.undo();
                alpha = Math.max(score, alpha);
                if (alpha >= beta) break;

                moves.push(move);
                scoreMovePairs.push([score, moves]);
                prevBestMoves = [];
            }

        } else { // minimizing player
            for (let move of availableMoves) {
                g.place(...move);
                let [score, moves] = this.alphaBeta(alpha, beta, depth - 1, prevBestMoves);
                g.undo();
                alpha = Math.min(score, alpha);
                if (alpha >= beta) break;

                moves.push(move);
                scoreMovePairs.push([score, moves]);
                prevBestMoves = [];
            }
        }

        return scoreMovePairs;
    }

    alphaBeta(alpha, beta, depth) {
        let g = this.game;
        if (depth === 0 || g.isFinished()) {
            let multiplier = (g.currentPlayer === this.maximizingPlayer) * 2 - 1;
            return [multiplier * this.heuristics(), []]
        }

        let bestMoves = null;
        let bestScore = null;

        if (g.currentPlayer === this.maximizingPlayer) {
            bestScore = -Infinity;

            for (let move of g.placeables(g.currentPlayer)) {
                g.place(...move);
                let [score, moves] = this.alphaBeta(alpha, beta, depth - 1);
                g.undo();
                alpha = Math.max(score, alpha);
                if (alpha >= beta) break;

                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = moves;
                    bestMoves.push(move);
                }
            }

        } else { // minimizing player
            bestScore = Infinity;

            for (let move of g.placeables(g.currentPlayer)) {
                let prevP = g.currentPlayer;
                let prevState = g.toString();
                let oldMove = move.slice();
                count += 1;
                g.place(...move);
                let [score, moves] = this.alphaBeta(alpha, beta, depth - 1);
                g.undo();
                alpha = Math.min(score, alpha);
                if (alpha >= beta) break;
                if (score < bestScore) {
                    bestScore = score;
                    bestMoves = moves;
                    bestMoves.push(move);
                }
            }
        }

        return [bestScore, bestMoves]
    }

    heuristics() {
        let g = this.game;
        let board = g.board;
        let blackScore = g.blackScore;
        let whiteScore = g.whiteScore;
        let size = g.size;

        let corners = [board[0][0], board[size-1][0], board[0][size-1], board[size-1][size-1]];
        let corner_helpers = [];
        for (let cx of [0, size-1]) {
            for (let cy of [0, size-1]) { // for each corners
                let xdif = cx === 0? 2: -2;
                let ydif = cy === 0? 2: -2;
                corner_helpers.push(board[cx + xdif][cy], board[cx + xdif][cy + ydif], board[cx][cy + ydif]);
            }
        }
        // and get score
        let isWhite = (piece) => {
            if (piece === Piece.WHITE) return 1;
            if (piece === Piece.BLACK) return -1;
            return 0;
        };

        let pieceReducer = (accumulator, currentValue) => accumulator + isWhite(currentValue);

        return 7 * corners.reduce(pieceReducer, 0)
            + 2 * corner_helpers.reduce(pieceReducer, 0)
            + blackScore - whiteScore;
    }

}