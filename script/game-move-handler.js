import {SERVER_NAME} from './setting-jp.js'

export class GameMoveHandler{

    constructor() {
        this.collection = firebase.firestore().collection(SERVER_NAME + 'games');
        this.gameId = null;

        this.moveSubscriber = null;
        this.newGameSubscriber = null;
    }

    sendMove(playerColor, x, y) {
        return this.collection.doc(this.gameId).collection('moves').add({
            color: playerColor,
            x: x,
            y: y,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
    }

    deleteLastMove() {
        // lastMove
        // delete move
    }

    createGame(creatorColor, size) {
        let that = this;

        return this.collection.add({
            gameSize: size,
            creatorColor: creatorColor,
            finished: false,
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

    setMoveListener(handler) {
        this.moveSubscriber = this.collection
            .doc(this.gameId)
            .collection('moves')
            .orderBy('timestamp')
            .onSnapshot(snapshot => {
                snapshot.forEach(doc => {
                    let data = doc.data();
                    if (data.timestamp === null) return;

                    handler(data.x, data.y);
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
                .onSnapshot(function(snapshot) {
                    snapshot.docChanges().forEach(function(change) {
                        if (change.type === "modified" && change.doc.id === that.gameId) {
                            gameFinishSubscriber();
                            resolve();
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