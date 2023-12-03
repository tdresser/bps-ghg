import { State, SchoolFocus, BoardFocus } from "../state";
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
    constructor(state: State, viewManager: ViewManager) {
        super(document.querySelector("#main_view") ?? fail());
        this.#tableElement = document.querySelector("#table_container") ?? fail();
        this.#grid = new Grid({
            data: [],
            pagination: {
                limit: 10
            },
        });
        this.#grid.render(this.#tableElement);
        this.#grid.on('rowClick', (_, data) => {
            console.log("ROW CLICK");
            if (state.aggregateSchoolBoards()) {
                const board = data.cells[0].data ?? fail();
                state.setFocus({ kind: FocusType.Board, value: board.toString() });
                // TODO.
                this.#search_school.value = "";
            } else {
                const school = data.cells[0].data ?? fail();
                state.setFocus({ kind: FocusType.School, value: school.toString() });
            }
            console.log(state);
            viewManager.render(state);
        });

        this.#search_board = document.getElementById("search_board") as HTMLInputElement ?? fail();
        this.#search_board.addEventListener("input", () => {
            state.setSearchQuery(this.#search_board.value.toLocaleLowerCase());
            this.render(state);
        });
        this.#search_board.addEventListener("focus", () => {
            state.setAggregateSchoolboards(true);
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
            state.setSearchQuery(this.#search_school.value.toLocaleLowerCase());
            this.render(state);
        });
        this.#search_school.addEventListener("focus", () => {
            state.setAggregateSchoolboards(false);
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
        let filteredRows = state.getFilteredRows();
        console.log("NUM ROWS: ", filteredRows.length);
        this.#grid.updateConfig({
            data: filteredRows.map(x => [x.name()]),
        }).forceRender();
        switch (state.focus().kind) {
            case FocusType.School:
                this.#search_school.value = (state.focus() as SchoolFocus).value;
                break;
            case FocusType.Board:
                this.#search_board.value = (state.focus() as BoardFocus).value;
                break;
            case FocusType.None:
                this.#search_board.value = ""
                this.#search_school.value = ""
                break;
        }
    }
}
