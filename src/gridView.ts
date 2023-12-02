import { State, Row } from "./state";
import { View } from "./view";
import { fail } from "./util";
import { Grid } from "gridjs";
import { BOARD_COLUMN_INDEX } from "./constants";

function row_to_array(row: Row) {
    return [row.school, row.city, Math.round(row.ghg_kg)];
}

export class GridView extends View {
    #grid: Grid
    constructor(state: State) {
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
            const board = data.cells[BOARD_COLUMN_INDEX].data ?? fail();
            state.setFocus({ kind: 'board', value: board.toString() });
            state.render();
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

    render(state: State): void {
        let filteredRows = state.getFilteredRows();
        this.#grid.updateConfig({
            data: filteredRows.map(x => row_to_array(x)),
            columns: state.columns()
        }).forceRender();
    }
}
