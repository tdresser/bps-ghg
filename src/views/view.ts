import { State } from '../state';

export enum ViewType {
    Grid = 1,
    Board = 2,
    School = 3
}

export abstract class View {
    #el: HTMLElement;
    #visible: boolean | null = null;
    constructor(el: HTMLElement) {
        this.#el = el;
    }
    abstract render(state: State): void;
    el() { return this.#el }
    setVisible(visible: boolean) {
        if (visible == this.#visible) {
            return;
        }
        this.#el.style.display = visible ? "block" : "none";
    }
    abstract key() : ViewType;
}