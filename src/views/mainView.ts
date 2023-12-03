import { State } from "../state";
import { View, FocusType } from "./view";
import { fail } from "../util";
import { Grid } from "gridjs";
import { ViewManager } from "./viewManager";

export class MainView extends View {
    static key = FocusType.None;
    #grid: Grid
    #tableElement: HTMLElement;
    #search_school: HTMLInputElement;
    #search_board: HTMLInputElement;
    #lastSearching: 'schools' | 'boards';
    constructor(state: State, viewManager: ViewManager) {
        super(document.querySelector("#main_view") ?? fail());
        this.#tableElement = document.querySelector("#table_container") ?? fail();
        this.#lastSearching = "schools";
        this.#grid = new Grid({
            data: [],
            pagination: {
                limit: 10
            },
        });
        this.#grid.render(this.#tableElement);
        this.#grid.on('rowClick', (_, data) => {
            if (this.#lastSearching == "boards") {
                console.log("CURRENTLY Searching Boards")
                const board = data.cells[0].data ?? fail();
                state.setFocus({ kind: FocusType.Board, value: board.toString() });
                this.#search_board.value = board.toString();
                // TODO: maybe keep the school if this didn't change?
                this.#search_school.value = "";
            } else if (this.#lastSearching == "schools"){
                console.log("CURRENTLY Searching Schools")
                const school = data.cells[0].data ?? fail();
                // We stored the board in a second hidden column.
                const board = data.cells[1].data ?? fail();
                state.setFocus({ kind: FocusType.School, value: school.toString() });
                this.#search_school.value = school.toString();
                this.#search_board.value = board.toString();
            } else {
                throw("Should only be able to search schools or boards.")
            }
            viewManager.render(state);
        });

        this.#search_board = document.getElementById("search_board") as HTMLInputElement ?? fail();
        this.#search_board.addEventListener("input", () => {
            this.render(state);
        });
        this.#search_board.addEventListener("focus", () => {
            this.#lastSearching = "boards";
            this.#search_board.value = "";
            const y = this.#search_board.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.render(state);
        });
        this.#search_board.addEventListener("focusout", () => {
            window.setTimeout(() => {
                this.#tableElement.style.visibility = "hidden";
            }, 0);
        });

        this.#search_school = document.getElementById("search_school") as HTMLInputElement ?? fail();
        this.#search_school.addEventListener("input", () => {
            this.render(state);
        });
        this.#search_school.addEventListener("focus", () => {
            this.#lastSearching = "schools";
            this.#search_school.value = "";
            const y = this.#search_school.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.render(state);
        });
        this.#search_school.addEventListener("focusout", () => {
            window.setTimeout(() => {
                this.#tableElement.style.visibility = "hidden";
            }, 0);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key == "Escape") {
                this.#search_board.blur();
                this.#search_school.blur();
            }
        });

        /*this.el().addEventListener("click", (e) => {
            console.log("CLICKY");
            if ((e.target as HTMLElement).tagName == "LABEL") {
                this.#search_board.blur();
                this.#search_school.blur();
            }
            console.log((e.target as HTMLElement).tagName);
        })*/
    }

    key() {
        return MainView.key;
    }

    render(state: State): void {
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
                    name:"board"
                }],
                data: rows.map(x => [x.school, x.board]),
            }).forceRender();
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
