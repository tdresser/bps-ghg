import { State, Row } from "../state";
import { View, ViewType } from "./view";
import { fail } from "../util";
import { Grid } from "gridjs";
import { BOARD_COLUMN_INDEX, SCHOOL_COLUMN_INDEX } from "../constants";
import { ViewManager } from "./viewManager";

function row_to_array(row: Row) {
    return [row.school, row.board, Math.round(row.ghg_kg)];
}

export class GridView extends View {
    static key = ViewType.Grid;
    #grid: Grid
    constructor(state: State, viewManager:ViewManager) {
        super(document.querySelector("#grid_view") ?? fail());
        const tableElement = document.querySelector("#table_container") ?? fail();
        this.#grid = new Grid({
            columns: state.columns(),
            data: [],
            pagination: {
                limit: 20
            },
            sort: true
        });
        this.#grid.render(tableElement);
        this.#grid.on('rowClick', (_, data) => {
            if (state.aggregateSchoolBoards()) {
                const board = data.cells[BOARD_COLUMN_INDEX].data ?? fail();
                state.setFocus({ kind: ViewType.Board, value: board.toString() });
            } else {
                const school = data.cells[SCHOOL_COLUMN_INDEX].data ?? fail();
                state.setFocus({ kind: ViewType.School, value: school.toString() });
            }
            viewManager.render(state);
        });

        const search = document.getElementById("search") as HTMLInputElement ?? fail();
        search.addEventListener("input", () => {
            state.setSearchQuery(search.value.toLocaleLowerCase());
            this.render(state);
        });

        const aggregate = document.getElementById("aggregate") as HTMLInputElement ?? fail();
        aggregate.addEventListener("input", () => {
            state.setAggregateSchoolboards(aggregate.checked);
            this.render(state);
        })
    }

    key() {
        return GridView.key;
    }

    render(state: State): void {
        let filteredRows = state.getFilteredRows();
        this.#grid.updateConfig({
            data: filteredRows.map(x => row_to_array(x)),
            columns: state.columns()
        }).forceRender();
    }
}
