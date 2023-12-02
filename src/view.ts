import {State} from './state';

abstract class View {
    #el: HTMLElement;
    constructor(el: HTMLElement) {
        this.#el = el;
    }
    abstract render(state:State): void;
}