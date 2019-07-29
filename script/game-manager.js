import {OthelloDrawer} from './othello-drawer.js';
import {Othello} from './othello.js';
import {GameMoveHandler} from './game-move-handler.js'

export class GameManager {
    constructor(canvas, gameTitleMessage, gameMessage, user, gameModeSelector,
                colorSelector, backButton, aiButton, opponentAiInfo, myAiInfo) {
        this.canvas = canvas;
        this.user = user;
        this.gameModeSelector = gameModeSelector;
        this.colorSelector = colorSelector;
        this.gameTitleMessage = gameTitleMessage;
        this.gameMessage = gameMessage;

        let aiInfoHandler = (p1On, p2On) => {
            let myOn = false;
            let opOn = false;

            if (this.user.isMain) {
                myOn = p1On;
                opOn = p2On;
            } else {
                myOn = p2On;
                opOn = p1On;
            }

            if (myOn) {
                myAiInfo.classList.remove("ai-disabled");
            } else {
                myAiInfo.classList.add("ai-disabled");
            }

            if (opOn) {
                opponentAiInfo.classList.remove("ai-disabled");
            } else {
                opponentAiInfo.classList.add("ai-disabled");
            }
        };

        this.gmh = new GameMoveHandler(aiInfoHandler);

        this.messages = {
            playMessage: this.user.getName() + 'の番だよ～',
            waitMessage: this.user.getOpponentName() + '考え中...'
        };

        this.aiButton = aiButton;

        let prevHandler = aiButton.onclick;

        aiButton.onclick = () => {
            prevHandler();
            if (aiButton.active) {
                this.od.startAI();
                this.gmh.updateAiInfo(this.user.isMain, true);
            } else {
                this.od.quitAI();
                this.gmh.updateAiInfo(this.user.isMain, false);
            }
        };

        backButton.onclick = () => {
            console.log('back button');
            if(this.game.undo() !== false) { //since player.Black === 0, we need to check whether it is actually false
                console.log('back success');
                this.od.draw();
                this.gmh.deleteLastMove();
            }
        }
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
            that.od = new OthelloDrawer(
                that.canvas,
                that.gameTitleMessage,
                that.gameMessage,
                that.game,
                that.messages,
                (a, b, c, d) => that.moveSender(a, b, c, d, that));
            that.od.draw();

            let newMoveHandler = (x, y) => {
                that.game.place(x, y);
                that.od.updateAgent();
                if (that.aiButton.active) that.od.startAI();
                that.od.draw();
            };

            let deleteMoveHandler = (x, y) => {
                that.game.undoMove(x, y);
                that.od.quitAI();
                if (that.aiButton.active) that.od.startAI();
                that.od.draw();
            };

            that.gmh.setMoveListener(newMoveHandler, deleteMoveHandler);

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