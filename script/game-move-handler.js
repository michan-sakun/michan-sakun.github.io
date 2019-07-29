import {SERVER_NAME} from './setting-jp.js'
import {Player} from './othello.js'

export class GameMoveHandler{

    constructor(aiUpdateHandler) {
        this.collection = firebase.firestore().collection(SERVER_NAME + 'games');
        this.gameId = null;

        this.moveSubscriber = null;
        this.newGameSubscriber = null;
        this.aiUpdateHandler = aiUpdateHandler;
    }

    sendMove(playerColor, x, y) {
        console.log("sending move", x, y, playerColor);
        return this.collection.doc(this.gameId).collection('moves').add({
            color: playerColor,
            x: x,
            y: y,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
    }

    deleteLastMove() {
        let that = this;

        return this.collection.doc(this.gameId).collection('moves')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get()
            .then(docs => {
                docs.forEach(doc => {
                    doc.ref.delete();
                });
            });

    }

    createGame(creatorColor, size) {
        let that = this;

        return this.collection.add({
            gameSize: size,
            creatorColor: creatorColor,
            finished: false,
            p1ai: false,
            p2ai: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(docRef => {
            that.gameId = docRef.id;
            return true;
        })
    }

    markFinished() {
        let that = this;

        let request = this.collection.doc(this.gameId).update({
            finished: true,
        }).then(result => {
            return result;
        });
    }

    updateAiInfo(isCreator, isUsing) {
        let that = this;
        let statusTag = isCreator ? "p1ai" : "p2ai";
        let updateDict = {};
        updateDict[statusTag] = isUsing;

        let request = this.collection.doc(this.gameId).update(updateDict)
            .then(result => {
                return result;
            });
    }

    getLastGame() {
        let query = this.collection
            .orderBy('timestamp', 'desc')
            .limit(1);

        return query.get().then(docs => {
            let result = null;
            docs.forEach(doc => {
                if (doc.exists) result = doc;
            });
            return result;
        });
    }

    setMoveListener(newMoveHandler, deleteMoveHandler) {
        this.moveSubscriber = this.collection
            .doc(this.gameId)
            .collection('moves')
            .orderBy('timestamp')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach((change) => {
                    let data = change.doc.data();
                    console.log(`-- ct: ${change.type}, x:${data.x} y:${data.y}`);
                    if (change.type === "added") {
                        if (data.timestamp === null) return;
                        newMoveHandler(data.x, data.y);

                    } else if (change.type === "removed") {
                        deleteMoveHandler(data.x, data.y);
                    }
                })
            });
    }

    waitNewGame(doneWaiting) {
        let that = this;
        return new Promise(resolve => {
            that.newGameSubscriber = that.collection.orderBy('timestamp', 'desc').limit(1)
                .onSnapshot(docs => {
                    docs.forEach(doc => {
                        let data = doc.data();
                        if (!data.finished) {
                            that.gameId = doc.id;
                            that.unsubscribeNewGame();
                            resolve(data);
                        }
                    })
                });
        });

    }

    /*Promise that resolves when the game is completed*/
    gameCompleted() {
        let that = this;
        return new Promise(resolve => {
            let gameFinishSubscriber = that.collection.orderBy('timestamp', 'desc').limit(1)
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        console.log("udpated");
                        if (change.type === "modified" && change.doc.id === that.gameId) {
                            let data = change.doc.data();
                            if (data.finished) {
                                gameFinishSubscriber();
                                resolve();
                            } else {

                                that.aiUpdateHandler(data.p1ai, data.p2ai);
                            }
                        }
                    });
                });
            });
    }

    unsubscribeMoves() {
        if (this.moveSubscriber !== null) {
            this.moveSubscriber();
            this.moveSubscriber = null;
        }
    }

    unsubscribeNewGame() {
        if (this.newGameSubscriber !== null) {
            this.newGameSubscriber();
            this.newGameSubscriber = null;
        }
    }
}