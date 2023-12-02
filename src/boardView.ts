import { State } from "./state";
import { fail } from "./util";
import { View } from "./view"

export class BoardView extends View {
    #boardName: HTMLElement;
    constructor() {
        super(document.querySelector("#board_view") as HTMLElement ?? fail());
        this.#boardName = document.querySelector("#board_name") as HTMLElement ?? fail();
    }
    render(state: State): void {
        console.log("FOCUS: " + state.focus()?.value)
        this.#boardName.innerText = state.focus()?.value ?? fail();
    }
}