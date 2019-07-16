import {OthelloDrawer} from './othello-drawer.js';
import {Othello} from './othello.js';
import {GameMoveHandler} from './game-move-handler.js'

export class GameManager {
    constructor(canvas, gameTitleMessage, gameMessage, user, gameModeSelector, colorSelector) {
        this.canvas = canvas;
        this.user = user;
        this.gameModeSelector = gameModeSelector;
        this.colorSelector = colorSelector;
        this.gameTitleMessage = gameTitleMessage;
        this.gameMessage = gameMessage;

        this.gmh = new GameMoveHandler();

        this.messages = {
            playMessage: this.user.getName() + 'の番だよ～',
            waitMessage: this.user.getOtherUserName() + '考え中...'
        };
    }

    start() {
        let that = this;
        return new Promise(resolve => {
            // create Othello objects
            if (that.user.isMain) {
                return resolve(that.creatorStarter());
            } else {
                return resolve(that.creatorWaiter());
            }
        }).then(game => {
            // Add listeners
            that.od = new OthelloDrawer(that.canvas, that.gameTitleMessage, that.gameMessage, that.game, that.messages,
                (a, b, c, d) => that.moveSender(a, b, c, d, that));
            that.od.drawBoard();

            that.gmh.setMoveListener((x, y) => {
                that.game.place(x, y);
                that.od.drawBoard();
            });

            return that.gmh.gameCompleted();
        }).then(() => {
            // clean ups
            that.gmh.unsubscribeMoves();
            that.od.removeListeners();
            return that.game.getWinner();
        });
    }

    moveSender(player, x, y, isDone, that) {
        return this.gmh.sendMove(player, x, y).then(() => {
            if (isDone) return that.gmh.markFinished();
        });
    }

    creatorStarter() {
        let that = this;
        return this.gmh.getLastGame().then(doc => {
            if (doc === null || doc.data().finished) {
                return that.promptNewGameSetting();
            }
            let data = doc.data();
            that.gmh.gameId = doc.id;
            return that.game = new Othello(data.creatorColor, data.gameSize);
        });
    }

    promptNewGameSetting() {
        let that = this;
        return this.gameModeSelector().then(mode => {
            that.mode = mode;
            return that.colorSelector()
        }).then(color => {
            that.color = color;
            return that.gmh.createGame(color, that.mode)
        }).then(() => {
            return this.game = new Othello(that.color, that.mode);
        })
    }

    creatorWaiter() {
        // create user
        let that = this;
        return this.gmh.waitNewGame()
            .then(data => {
                let myColor = data.creatorColor === "black" ? "white" : "black";
                return that.game = new Othello(myColor, data.gameSize);
            })
    }
}