export class User{
    constructor(name, isMain) {
        this.name = name;
        this.isMain = isMain;
    }

    getName() {
        return this.name;
    }
}