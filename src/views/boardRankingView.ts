import { State } from "../state";
import { fail } from "../util";
import { BoardRankingGraph } from "./boardRankingGraph";
import { View } from "./view"

export class BoardRankingView extends View {
    #graph: BoardRankingGraph | null = null;
    constructor() {
        super(document.querySelector("#board_ranking_view") as HTMLElement ?? fail());
    }
    updateFromState(state: State): void {
        if (this.#graph == null) {
            this.#graph = new BoardRankingGraph("#board_ranking_graph", state);
        }
        this.#graph.updateFromState();
    }
}