import { State, getFilteredRows, Row } from "./state";
import { View } from "./view";
import { fail } from "./util";
import { Grid } from "gridjs";
import { BOARD_COLUMN_INDEX, SCHOOL_COLUMN_INDEX } from "./constants";

function row_to_array(row: Row) {
    return [row.school, row.city, Math.round(row.ghg_kg)];
}

export class GridView extends View {
    #grid: Grid
    constructor(state: State) {
        super(document.querySelector("#table_container") ?? fail());
        this.#grid = new Grid({
            columns: state.columns,
            data: [],
            pagination: {
                limit: 20
            },
            sort: true
        });
        this.#grid.render(this.el());
        this.#grid.on('rowClick', (_, data) => {
            // TODO: switch view.
            const board = data.cells[BOARD_COLUMN_INDEX].data ?? fail();
            this.el().style.display = "block";
            state.focus = { kind: 'board', name: board.toString() };
            //boardName.innerText = state.focus.name;
            console.log('row: ' + JSON.stringify(board))
        });

        const search = document.getElementById("search") as HTMLInputElement ?? fail();
        search.addEventListener("input", () => {
            state.searchQuery = search.value.toLocaleLowerCase();
            console.log("q: " + state.searchQuery);
            this.render(state);
        });

        const aggregate = document.getElementById("aggregate") as HTMLInputElement ?? fail();
        aggregate.addEventListener("input", () => {
            state.aggregateSchoolboards = aggregate.checked;
            this.render(state);
        })
    }

    render(state: State): void {
        let filteredRows = getFilteredRows(state);

        state.columns[SCHOOL_COLUMN_INDEX].hidden = state.aggregateSchoolboards;

        this.#grid.updateConfig({
            data: filteredRows.map(x => row_to_array(x)),
        }).forceRender();
    }
}
