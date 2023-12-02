import {State} from './state';

export abstract class View {
    #el: HTMLElement;
    constructor(el: HTMLElement) {
        this.#el = el;
    }
    abstract render(state:State): void;
    el() { return this.#el}
}