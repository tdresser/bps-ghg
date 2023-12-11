import { State, ViewType } from "../state";
import { fail } from "../util";
import { ViewManager } from "./viewManager";

export class TabView {
    #tab_history: HTMLElement;
    #tab_board_ranking: HTMLElement;
    #state: State;


    constructor(state: State, viewManager: ViewManager) {
        this.#state = state;
        this.#tab_history = document.getElementById("tab_history") ?? fail();
        this.#tab_board_ranking = document.getElementById("tab_board_ranking") ?? fail();

        for (const d of [this.#tab_history, this.#tab_board_ranking]) {
            d.addEventListener("click", e => {
                console.log(e);
                const newViewType: ViewType = d == this.#tab_history ? "main" : "todo";
                state.setViewType(newViewType);
                viewManager.updateFromState(state);
            })
        }
    }

    updateFromState() {
        switch (this.#state.viewType()) {
            case "main":
                this.#tab_board_ranking.className = "inactive"
                this.#tab_history.className = ""

                break;
            case "todo":
                this.#tab_board_ranking.className = ""
                this.#tab_history.className = "inactive"
                break;
        }
    }
}