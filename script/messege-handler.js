import {SERVER_NAME} from './setting-jp.js'

export class MessageHandler{

    constructor(user) {
        this.user = user;
        this.collection = firebase.firestore().collection(SERVER_NAME + 'messages');
    }

    sendMessage(messageText) {
        return this.collection.add({
            name: this.user.getName(),
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
    }

    // Loads chat messages history and listens for upcoming ones.
    setMessageHandler(handler) {
        let query = this.collection
            .orderBy('timestamp', 'desc')
            .limit(MessageHandler.MESSAGE_LIMIT);

        query.onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    let message = change.doc.data();
                    if(message.timestamp === null) return;
                    handler(change.doc.id, message.timestamp, message.name, message.text);
                });
            });
    }
}

MessageHandler.MESSAGE_LIMIT = 12;
