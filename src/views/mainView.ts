import { State, Row } from "../state";
import { View, FocusType } from "./view";
import { fail } from "../util";
import { Grid } from "gridjs";
import { BOARD_COLUMN_INDEX, SCHOOL_COLUMN_INDEX } from "../constants";
import { ViewManager } from "./viewManager";

function row_to_array(row: Row) {
    return [row.school, row.board, Math.round(row.ghg_kg)];
}

export class MainView extends View {
    static key = FocusType.None;
    #grid: Grid
    #tableElement: HTMLElement;
    constructor(state: State, viewManager: ViewManager) {
        super(document.querySelector("#main_view") ?? fail());
        this.#tableElement = document.querySelector("#table_container") ?? fail();
        this.#grid = new Grid({
            columns: state.columns(),
            data: [],
            pagination: {
                limit: 10
            },
        });
        this.#grid.render(this.#tableElement);
        this.#grid.on('rowClick', (_, data) => {
            if (state.aggregateSchoolBoards()) {
                const board = data.cells[BOARD_COLUMN_INDEX].data ?? fail();
                state.setFocus({ kind: FocusType.Board, value: board.toString() });
            } else {
                const school = data.cells[SCHOOL_COLUMN_INDEX].data ?? fail();
                state.setFocus({ kind: FocusType.School, value: school.toString() });
            }
            viewManager.render(state);
        });

        const search_board = document.getElementById("search_board") as HTMLInputElement ?? fail();
        search_board.addEventListener("input", () => {
            state.setSearchQuery(search_board.value.toLocaleLowerCase());
            this.render(state);
        });
        search_board.addEventListener("focus", () => {
            state.setAggregateSchoolboards(true);
            const y = search_board.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.render(state);
        });
        search_board.addEventListener("focusout", () => {
            this.#tableElement.style.visibility = "hidden";
        });

        const search_school = document.getElementById("search_school") as HTMLInputElement ?? fail();
        search_school.addEventListener("input", () => {
            state.setSearchQuery(search_school.value.toLocaleLowerCase());
            this.render(state);
        });
        search_school.addEventListener("focus", () => {
            state.setAggregateSchoolboards(false);
            const y = search_school.getBoundingClientRect().bottom;
            this.#tableElement.style.visibility = "visible";
            this.#tableElement.style.transform = `translate(0px, ${y}px)`;
            viewManager.render(state);
        });
        search_school.addEventListener("focusout", () => {
            this.#tableElement.style.visibility = "hidden";
        });

        document.addEventListener("keydown", (e) => {
            if (e.key == "Escape") {
                search_board.blur();
                search_school.blur();
            }
        });

        this.el().addEventListener("click", (e) => {
            if ((e.target as HTMLElement).tagName != "INPUT") {
                search_board.blur();
                search_school.blur();
            }
        })
    }

    key() {
        return MainView.key;
    }

    render(state: State): void {
        let filteredRows = state.getFilteredRows();
        this.#grid.updateConfig({
            data: filteredRows.map(x => row_to_array(x)),
            columns: state.columns()
        }).forceRender();
    }
}
