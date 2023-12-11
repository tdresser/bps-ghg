import { BoardFocus, State } from "../state";
import { fail } from "../util";
import { TodoGraph } from "./todoGraph";
import { View } from "./view"

// Placeholder for the second view.
export class TodoView extends View {
    #boardName: HTMLElement;
    #graph: TodoGraph | null = null;
    constructor() {
        super(document.querySelector("#todo_view") as HTMLElement ?? fail());
        this.#boardName = document.querySelector("#board_name") as HTMLElement ?? fail();
    }
    updateFromState(state: State): void {
        if (this.#graph == null) {
            this.#graph = new TodoGraph("#todo_graph", state);
        }
        const focus = state.focus() as BoardFocus;
        this.#boardName.innerText = "Board: " + focus.board;
        this.#graph.updateFromState();
    }
}