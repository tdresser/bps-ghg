import { State } from "../state";
import { View } from "./view";
import { fail } from "../util";
import { Grid } from "gridjs";
import { ViewManager } from "./viewManager";
import { MainGraph } from "./mainGraph";

export class MainView extends View {
    #grid: Grid
    #tableElement: HTMLElement;
    #search_school: HTMLInputElement;
    #search_board: HTMLInputElement;
    #lastSearching: 'schools' | 'boards';
    #hidingTimer: number | undefined = undefined;
    #graph: MainGraph;
    constructor(state: State, viewManager: ViewManager) {
        super(document.querySelector("#main_view") ?? fail());
        this.#tableElement = document.querySelector("#table_container") ?? fail();
        this.#lastSearching = "schools";
        this.#graph = new MainGraph("#main_graph", state);
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
                console.log("CURRENTLY Searching Boards")
                const board = data.cells[0].data ?? fail();
                state.setFocus({ kind: "board", value: board.toString() });
                this.#search_board.value = board.toString();
                // TODO: maybe keep the school if this didn't change?
                this.#search_school.value = "";
            } else if (this.#lastSearching == "schools") {
                console.log("CURRENTLY Searching Schools")
                const school = data.cells[0].data ?? fail();
                // We stored the board/address in a second/third hidden column.
                const board = data.cells[1].data ?? fail();
                const address = data.cells[2].data ?? fail();
                state.setFocus({
                    kind: "school",
                    schoolName: school.toString(),
                    address: address.toString()
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
            this.updateFromState(state);
        });
        this.#search_board.addEventListener("focus", () => {
            window.clearTimeout(this.#hidingTimer);
            this.#lastSearching = "boards";
            this.#search_board.value = "";
            const y = this.#search_board.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.updateFromState(state);
        });
        this.#search_board.addEventListener("focusout", () => {
            this.#hidingTimer = window.setTimeout(() => {
                this.#tableElement.style.visibility = "hidden";
            }, 0);
        });

        this.#search_school = document.getElementById("search_school") as HTMLInputElement ?? fail();
        this.#search_school.addEventListener("input", () => {
            this.updateFromState(state);
        });
        this.#search_school.addEventListener("focus", () => {
            window.clearTimeout(this.#hidingTimer);
            this.#lastSearching = "schools";
            this.#search_school.value = "";
            const y = this.#search_school.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.updateFromState(state);
        });
        this.#search_school.addEventListener("focusout", () => {
            this.#hidingTimer = window.setTimeout(() => {
                this.#tableElement.style.visibility = "hidden";
            }, 0);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key == "Escape") {
                this.#search_board.blur();
                this.#search_school.blur();
            }
        });

        this.el().addEventListener("click", (e) => {
            console.log("CLICKY");
            if ((e.target as HTMLElement).tagName == "LABEL") {
                this.#search_board.blur();
                this.#search_school.blur();
                this.#tableElement.style.visibility = "hidden";
            }
            console.log((e.target as HTMLElement).tagName);
        })
    }

    paginationFocusHack() {
        console.log("FOCUS HACK.")
        const pages = document.querySelectorAll(".gridjs-pages") ?? fail();
        pages.forEach(x => {
            x.addEventListener("click", () => {
                console.log("focus hack: ", this.#lastSearching)
                window.clearTimeout(this.#hidingTimer);
            })
        })
    }

    updateFromState(state: State): void {
        this.#graph.updateFromState();
        if (this.#lastSearching == "schools") {
            // TODO: does this need to be lower case?
            const query = this.#search_school.value.toLocaleLowerCase();
            console.log("Focused school: ", query);
            const rows = state.getFilteredSchools(query, this.#search_board.value);
            console.log("BEFORE UPDATE");
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
                }],
                data: rows.map(x => [x.school, x.board, x.address]),
            }).forceRender();
            this.paginationFocusHack();
            console.log("AFTER");
        } else if (this.#lastSearching == "boards") {
            const query = this.#search_board.value.toLocaleLowerCase();
            console.log("Focused board: ", query);
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
