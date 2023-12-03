import * as fuzzysearch from 'fast-fuzzy';
import { BOARD_COLUMN_INDEX, SCHOOL_COLUMN_INDEX } from './constants';
import * as d3 from 'd3';
import { yieldy } from './util';
import { FocusType } from './views/view';

export type Searcher = fuzzysearch.Searcher<Row, fuzzysearch.FullOptions<Row>>;

export interface Column {
    name: string,
    hidden: boolean
}

export interface Row {
    school: string | null,
    board: string,
    ghg_kg: number,
}

interface NoFocus {
    kind: FocusType.None;
}

export interface SchoolFocus {
    kind: FocusType.School;
    value: string;
}

export interface BoardFocus {
    kind: FocusType.Board;
    value: string;
}

type Focus = SchoolFocus | BoardFocus | NoFocus;

export class State {
    #searchQuery: string;
    #focus: Focus = { kind: FocusType.None };
    #aggregateSchoolBoards = true;
    #columns: Column[] = [
        {
            name: "School",
            hidden: true
        }, {
            name: "Board",
            hidden: false,
        }];
    #schoolRows: Row[];
    #boardRows: Row[];
    #schoolSearcher: Searcher = new fuzzysearch.Searcher([]);
    #boardSearcher: Searcher = new fuzzysearch.Searcher([]);

    constructor(schoolRows: Row[]) {
        this.#searchQuery = "";
        this.#schoolRows = schoolRows;

        this.#boardRows = Array.from(d3.rollup(this.#schoolRows, d => {
            return {
                ghg_kg: d3.sum(d, v => v.ghg_kg),
                school: null,
                board: d[0].board
            }
        }, d => d.board).values());
    }

    async init() {
        await yieldy()
        this.#schoolSearcher = new fuzzysearch.Searcher(this.#schoolRows, {
            keySelector: d => d.board + " " + d.school
        });

        await yieldy()
        this.#boardSearcher = new fuzzysearch.Searcher(this.#boardRows, {
            keySelector: d => d.board + " " + d.school
        });
    }

    getFilteredRows() {
        const aggregate = this.#aggregateSchoolBoards;
        let unfiltered = [];

        if (this.#searchQuery == "") {
            unfiltered = aggregate ? this.#boardRows : this.#schoolRows;
        } else {
            const searcher = aggregate ? this.#boardSearcher : this.#schoolSearcher;
            unfiltered = searcher.search(this.#searchQuery);
        }
        if (aggregate) {
            console.log("Aggregating, so no filter");
            // We should be selecting boards, which don't get filtered.
            return unfiltered;
        } else {
            // We're selecting schools, and might be filtering.
            if (this.focus().kind == FocusType.Board) {
                console.log("FILTERING")
                return unfiltered.filter(x => x.board == (this.focus() as BoardFocus).value)
            }
            return unfiltered;
        }

    }

    columns() {
        return this.#columns;
    }

    setFocus(focus: Focus) {
        this.#focus = focus;
    }

    focus() {
        return this.#focus;
    }

    setSearchQuery(query: string) {
        this.#searchQuery = query;
    }

    setAggregateSchoolboards(aggregate: boolean) {
        this.#aggregateSchoolBoards = aggregate;
        this.#columns[SCHOOL_COLUMN_INDEX].hidden = aggregate;
        this.#columns[BOARD_COLUMN_INDEX].hidden = !aggregate;
    }

    aggregateSchoolBoards(): boolean {
        return this.#aggregateSchoolBoards;
    }
}

