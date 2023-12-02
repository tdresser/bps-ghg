import * as fuzzysearch from 'fast-fuzzy';
import { SCHOOL_COLUMN_INDEX } from './constants';
import * as d3 from 'd3';
import { yieldy } from './util';
export type Searcher = fuzzysearch.Searcher<Row, fuzzysearch.FullOptions<Row>>;

export interface Column {
    name: string,
    hidden: boolean
}

export interface Row {
    school: string | null,
    city: string,
    ghg_kg: number,
}

interface SchoolFocus {
    kind: 'school';
    name: string;
}

interface BoardFocus {
    kind: 'board';
    name: string;
}

export class State {
    #searchQuery: string;
    #focus: SchoolFocus | BoardFocus | null = null;
    #aggregateSchoolBoards = false;
    #columns: Column[] = [
        {
            name: "School",
            hidden: false
        },
        {
            name: "City",
            hidden: false,
        },
        {
            name: "Greenhouse Gas KG",
            hidden: false
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
                city: d[0].city
            }
        }, d => d.city).values());
    }

    async init() {
        await yieldy()
        this.#schoolSearcher = new fuzzysearch.Searcher(this.#schoolRows, {
            keySelector: d => d.city + " " + d.school
        });

        await yieldy()
        this.#boardSearcher = new fuzzysearch.Searcher(this.#boardRows, {
            keySelector: d => d.city + " " + d.school
        });
    }

    getFilteredRows() {
        const aggregate = this.#aggregateSchoolBoards;
        if (this.#searchQuery == "") {
            return aggregate ? this.#boardRows : this.#schoolRows;
        }
        const searcher = aggregate ? this.#boardSearcher : this.#schoolSearcher;
        return searcher.search(this.#searchQuery);
    }

    columns() {
        return this.#columns;
    }

    setFocus(focus: SchoolFocus | BoardFocus | null) {
        this.#focus = focus;
    }

    setSearchQuery(query: string) {
        this.#searchQuery = query;
    }

    setAggregateSchoolboards(aggregate: boolean) {
        this.#aggregateSchoolBoards = aggregate;
        this.#columns[SCHOOL_COLUMN_INDEX].hidden = aggregate;
    }
}

