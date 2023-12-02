import { BoardFocus, State } from "../state";
import { fail, makeBack } from "../util";
import { View } from "./view"

export class BoardView extends View {
    #boardName: HTMLElement;
    constructor(state:State) {
        super(document.querySelector("#board_view") as HTMLElement ?? fail());
        this.#boardName = document.querySelector("#board_name") as HTMLElement ?? fail();
        const back = document.querySelector("#board_back") ?? fail();
        makeBack(back, state);
    }
    render(state: State): void {
        const focus = state.focus() as BoardFocus;
        console.log("FOCUS: " + focus.value)
        this.#boardName.innerText = "Board: " + focus.value;
    }
}