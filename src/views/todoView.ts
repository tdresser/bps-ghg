import { BoardFocus, State } from "../state";
import { fail, makeBack } from "../util";
import { TodoGraph } from "./todoGraph";
import { View } from "./view"
import { ViewManager } from "./viewManager";

// Placeholder for the second view.
export class TodoView extends View {
    #boardName: HTMLElement;
    #graph: TodoGraph | null = null;
    constructor(state: State, viewManager: ViewManager) {
        super(document.querySelector("#todo_view") as HTMLElement ?? fail());
        this.#boardName = document.querySelector("#board_name") as HTMLElement ?? fail();
        const back = document.querySelector("#todo_back") ?? fail();
        makeBack(back, state, viewManager);
    }
    updateFromState(state: State): void {
        if (this.#graph == null) {
            this.#graph = new TodoGraph("#todo_graph", state);
        }
        const focus = state.focus() as BoardFocus;
        this.#boardName.innerText = "Board: " + focus.value;
        this.#graph.updateFromState();
    }
}