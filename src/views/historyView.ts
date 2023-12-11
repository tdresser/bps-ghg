import { State } from "../state";
import { View } from "./view";
import { fail } from "../util";
import { Grid } from "gridjs";
import { ViewManager } from "./viewManager";
import { HistoryGraph } from "./historyGraph";
import { TabView } from "./tabView";

export class MainView extends View {
    #grid: Grid
    #tableElement: HTMLElement;
    #search_school: HTMLInputElement;
    #search_board: HTMLInputElement;
    #lastSearching: 'schools' | 'boards';
    #graph: HistoryGraph;
    #tabView: TabView;
    constructor(state: State, viewManager: ViewManager) {
        super(document.querySelector("#history_view") ?? fail());
        this.#tableElement = document.querySelector("#table_container") ?? fail();
        this.#lastSearching = "schools";
        this.#graph = new HistoryGraph("#history_graph", state);
        this.#tabView = new TabView(state, viewManager);
        viewManager.setTabView(this.#tabView);
        this.#grid = new Grid({
            data: [],
            pagination: {
                limit: 10
            },
        });
        this.#grid.render(this.#tableElement);
        this.#grid.on('rowClick', (_, data) => {
            this.#tableElement.style.visibility = "hidden";
            if (this.#lastSearching == "boards") {
                const board = data.cells[0].data ?? fail();
                state.setFocus({ kind: "board", board: board.toString() });
                this.#search_board.value = board.toString();
                // Even if the school didn't change, we want to focus on the board.
                // A board can only be focused if there's no selected school.
                this.#search_school.value = "";
            } else if (this.#lastSearching == "schools") {
                const school = data.cells[0].data ?? fail();
                // We stored the board/address in a second/third hidden column.
                const board = data.cells[1].data as string ?? fail();
                const address = data.cells[2].data ?? fail();
                state.setFocus({
                    kind: "school",
                    schoolName: school.toString(),
                    address: address.toString(),
                    board: board,
                });
                this.#search_school.value = school.toString();
                this.#search_board.value = board.toString();
            } else {
                throw ("Should only be able to search schools or boards.")
            }
            viewManager.updateFromState(state);
        });

        this.#search_board = document.getElementById("search_board") as HTMLInputElement ?? fail();
        this.#search_board.addEventListener("input", () => {
            viewManager.updateFromState(state);
        });
        this.#search_board.addEventListener("focus", () => {
            this.#lastSearching = "boards";
            this.#search_board.value = "";
            const y = this.#search_board.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.updateFromState(state);
        });

        this.#search_school = document.getElementById("search_school") as HTMLInputElement ?? fail();
        this.#search_school.addEventListener("input", () => {
            viewManager.updateFromState(state);
        });
        this.#search_school.addEventListener("focus", () => {
            this.#lastSearching = "schools";
            this.#search_school.value = "";
            const y = this.#search_school.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.updateFromState(state);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key == "Escape") {
                this.#search_board.blur();
                this.#search_school.blur();
            }
        });

        this.el().addEventListener("click", (e) => {
            if ((e.target as HTMLElement).tagName == "LABEL") {
                this.#search_board.blur();
                this.#search_school.blur();
                switch (state.focus().kind) {
                    case "none":
                        this.#search_board.value = "";
                        this.#search_school.value = "";
                        break;
                    case "board":
                        this.#search_school.value = "";
                        break;
                }
                this.#tableElement.style.visibility = "hidden";
            }
        })
    }

    updateFromState(state: State): void {
        this.#graph.updateFromState();

        if (this.#lastSearching == "schools") {
            const query = this.#search_school.value;
            const rows = state.getFilteredSchools(query, this.#search_board.value);
            this.#grid.updateConfig({
                columns: [{
                    hidden: false,
                    name: "school"
                }, {
                    hidden: true,  // Store the board in the second hidden column.
                    name: "board"
                },
                {
                    hidden: true,  // Store the address in the third hidden column.
                    name: "address"
                },
                {
                    hidden: false,
                    name: "city"

                }],
                data: rows.map(x => [x.school, x.board, x.address, x.city]),
            }).forceRender();
        } else if (this.#lastSearching == "boards") {
            const query = this.#search_board.value;
            const rows = state.getFilteredBoards(query);
            this.#grid.updateConfig({
                columns: [{
                    hidden: false,
                    name: "board"
                }],
                data: rows.map(x => [x.board]),
            }).forceRender();
        }
    }
}
