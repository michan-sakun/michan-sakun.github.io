export class User{
    constructor(name, isMain, otherUserName) {
        this.name = name;
        this.isMain = isMain;
        this.otherUserName = otherUserName;
    }

    getName() {
        return this.name;
    }

    getOpponentName() {
        return this.otherUserName;
    }
}