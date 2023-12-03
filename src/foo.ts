class Foo {
    #x:number;

    constructor() {
        this.#x = 2;
    }

    doubleX() {
        this.#x = this.#x * 2;
    }
}

const foo = new Foo();
foo.doubleX();
