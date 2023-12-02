import { BoardFocus, State } from "../state";
import { fail, makeBack } from "../util";
import { View, ViewType } from "./view"
import { ViewManager } from "./viewManager";

export class BoardView extends View {
    static key = ViewType.Board;

    #boardName: HTMLElement;
    constructor(state:State, viewManager: ViewManager) {
        super(document.querySelector("#board_view") as HTMLElement ?? fail());
        this.#boardName = document.querySelector("#board_name") as HTMLElement ?? fail();
        const back = document.querySelector("#board_back") ?? fail();
        makeBack(back, state, viewManager);
    }
    render(state: State): void {
        const focus = state.focus() as BoardFocus;
        console.log("FOCUS: " + focus.value)
        this.#boardName.innerText = "Board: " + focus.value;
    }
    key() {
        return BoardView.key;
    }
}