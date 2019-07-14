
import {User} from './user.js'
import {MessageHandler} from './messege-handler.js'
import {GameManager} from './game-manager.js'


let user1 = "さーくん";
let user2 = "みーちゃん";
let six = "6x6";
let white = "白（先攻）";

let user = null;

let mHandler = undefined;
let canvas = document.getElementById('othello-board');

function main() {
    return userSelection().then(myUser => {
        user = myUser;
        setUpMessaging(user);
        return mainLoop();
    })
}

function mainLoop(){
    let gm = new GameManager(canvas, user, gameModeSelection, colorSelection);
    return gm.start().then(() => {
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
    return twoButtonModal("あなたは誰ですか？", user1, user2, '#b9d4ff', '#ffd0d9').then( (selection) => {
        if (selection === undefined) return userSelection();
        return new User(selection, selection === user2);
    })
}

function gameModeSelection() {
    return twoButtonModal("ゲームモード選択！", six, "8x8", '#fffdd9', '#dbceff').then((selection) => {
        if (selection === undefined) return gameModeSelection();
        return selection === six ? 6 : 8;
    });
}

function colorSelection() {
    return twoButtonModal("どっちの色がいい？", white, "黒（後攻）", '#fafbf9', '#c9c6c9').then((selection) => {
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

/* Message related functions */

function displayMessage(id, timestamp, name, text) {
    let html = undefined;
    if (timestamp === null) return;

    let date = new Date();
    let dateString = moment(timestamp.seconds * 1000).format("h:mm a");

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
    document.getElementById("msg_history").insertAdjacentHTML('beforeend', html)
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