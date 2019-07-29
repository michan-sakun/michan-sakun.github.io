
import {User} from './user.js'
import {MessageHandler} from './messege-handler.js'
import {GameManager} from './game-manager.js'
import {USER_SELECTION, PICK_GAME_MODE, PICK_COLOR, white, black} from './setting-jp.js'

import {AI} from './ai.js'
import {Othello} from './othello.js'

const user1 = "さーくん";
const user2 = "みーちゃん";

const six = "6x6";

let user = null;

let mHandler = undefined;
let canvas = document.getElementById('othello-board');
let gameTitleMessage = document.getElementById('game-title-message');
let gameMessage = document.getElementById('game-message');

const backButton = document.getElementById('back-btn');
const aiButton = document.getElementById('ai-btn');
const messageButton = document.getElementById('msg-btn');

const opponentAiInfo = document.getElementById('opponent-ai-info');
const myAiInfo = document.getElementById('my-ai-info');


aiButton.onclick = () => {
    if (!aiButton.active) {
        aiButton.active = true;
        aiButton.classList.remove("btn-secondary");
        aiButton.classList.add("btn-primary");
    } else {
        aiButton.active = false;
        aiButton.classList.remove("btn-primary");
        aiButton.classList.add("btn-secondary");
    }
};


function main() {
    return userSelection().then(myUser => {
        user = myUser;
        opponentAiInfo.innerHTML = `${user.getOpponentName()}助けられ中`;
        myAiInfo.innerHTML = `${user.getName()}助けられ中`;

        setUpMessaging(user);
        return mainLoop();
    })
}

function mainLoop(){
    let gm = new GameManager(
        canvas,
        gameTitleMessage,
        gameMessage,
        user,
        gameModeSelection,
        colorSelection,
        backButton,
        aiButton,
        opponentAiInfo,
        myAiInfo
    );
    return gm.start().then((winner) => {
        let titleMessage = null;
        let message = null;

        if (user.getName() === user1) {
            if (winner === null) {
                titleMessage = "引き分けだよ～";
                message =　"仲好し～";
            } else if (winner === gm.game.player) {
                titleMessage = "さーくんの勝利！！";
                message = "次も本気だよ！";
            } else {
                titleMessage = "さーくんの負けだよ...";
                message = "元気だして～";
            }

        } else {
            if (winner === null) {
                titleMessage = "引き分けだよ～";
                message =　"仲好しだね♥";
            } else if (winner === gm.game.player) {
                titleMessage = "みーちゃん勝利！！";
                message = "まさかこんな日がくるなんて！";
            } else {
                titleMessage = "みーちゃんの負けだよ...";
                message = "次は勝てるよ♥";
            }
        }
        return gameFinishModal(titleMessage, message);

    }).then(() => {
        return mainLoop();
    });
}


function setUpMessaging(user) {
    if (mHandler === undefined) {
        mHandler = new MessageHandler(user);
        mHandler.setMessageHandler(displayMessage);
    }
}

main();


function userSelection() {
    return twoButtonModal(USER_SELECTION, user1, user2, '#b9d4ff', '#ffd0d9').then( (selection) => {
        if (selection === undefined) return userSelection();
        return new User(
            selection,
            selection === user2,
            selection === user1 ? user2: user1);
    })
}

function gameModeSelection() {
    return twoButtonModal(PICK_GAME_MODE, six, "8x8", '#fffdd9', '#dbceff').then((selection) => {
        if (selection === undefined) return gameModeSelection();
        return selection === six ? 6 : 8;
    });
}

function colorSelection() {
    return twoButtonModal(PICK_COLOR, white, black, '#fafbf9', '#c9c6c9').then((selection) => {
        if (selection === undefined) return colorSelection();
        return selection === white ? "white" : "black";
    });
}


function twoButtonModal(title, textLeft, textRight, colorLeft, colorRight) {
    let modal = Swal.fire({
        html: `
    <div class="row">
        <div class="text-center col-sm-6">
            <button class='jumbotron col-sm-12' id='select_left'>${textLeft}</button>
        </div>
        <div class="text-center col-sm-6">
            <button class='jumbotron col-sm-12' id='select_right'>${textRight}</button>
        </div>
    </div>
    `,
        title: title,
            showConfirmButton: false,
        });

    let leftButton = document.getElementById("select_left");
    let rightButton = document.getElementById("select_right");

    leftButton.style.backgroundColor = colorLeft;
    rightButton.style.backgroundColor = colorRight;

    return new Promise(function (resolve) {
        leftButton.onclick = () => {
            modal.close();
            resolve(textLeft);
        };

        rightButton.onclick = () => {
            modal.close();
            resolve(textRight);
        };
        modal.then( () => resolve());
    });
}

function gameFinishModal(titleMessage, message) {
    return Swal.fire({
            title: titleMessage,
            text: message,
            confirmButtonText: '次のゲームへ！',
        })
}

/* Message related functions */

function displayMessage(id, timestamp, name, text) {
    let html = undefined;
    if (timestamp === null) return;

    let date = moment(timestamp.seconds * 1000);
    let dateString = date.format("h:mm a");

    if (name === user.getName()) {
        html = `
        <div class="col-12 outgoing_msg">
            <div class="sent_msg">
                <p>${text}</p>
                <span class="time_date">${dateString}</span> </div>
        </div>`
    } else {
        html = `<div class="col-12 incoming_msg">
            <div class="incoming_msg_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>
            <div class="received_msg">
                <div class="received_withd_msg">
                <p>${text}</p>
                <span class="time_date">${dateString}</span></div>
            </div>
        </div>`
    }

    let msg_history = document.getElementById("msg_history");
    let lastMessage = msg_history.lastElementChild;

    if (lastMessage === null || lastMessage.date < date) { // append to last
        msg_history.insertAdjacentHTML('beforeend', html);
        msg_history.lastElementChild.date = date;
    } else { // append in the beginning
        msg_history.insertAdjacentHTML('afterbegin', html);
        msg_history.firstElementChild.date = date;
    }

}


function sendMessage(){
    let textBox = document.getElementById("text_message");
    mHandler.sendMessage(textBox.value);
    textBox.value = "";
}

document.getElementById("send_button").onclick = sendMessage;

document.getElementById("text_message").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode === 13) { sendMessage(); }
});