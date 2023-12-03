import * as fuzzysearch from 'fast-fuzzy';
import * as d3 from 'd3';
import { yieldy } from './util';
import { FocusType } from './views/view';

export type Searcher<T extends BoardRow> = fuzzysearch.Searcher<T, fuzzysearch.FullOptions<T>>;

export interface Column {
    name: string,
    hidden: boolean
}

interface BoardRowData {
    year: number;
    board: string;
    ghg_kg: number;
    ei: number;
    hdd: number;
    area: number;
}

interface SchoolRowData extends BoardRowData {
    school: string;
    address: string;
    city: string;
}

export class BoardRow {
    year: number;
    board: string;
    ghg_kg: number;
    ei: number;
    hdd: number;
    area: number;


    constructor(d:BoardRowData) {
        this.year = d.year;
        this.board = d.board;
        this.ghg_kg = d.ghg_kg;
        this.ei = d.ei;
        this.hdd = d.hdd;
        this.area = d.area;
    }

    name() {
        return this.board;
    }
}

export class SchoolRow extends BoardRow {
    school: string;
    address: string;
    city: string;

    constructor(d:SchoolRowData) {
        super(d);
        this.school = d.school;
        this.address = d.address;
        this.city = d.city;
    }

    name() {
        return this.school;
    }
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
    #schoolRows: SchoolRow[];
    #boardRows: BoardRow[];
    #schoolSearcher: Searcher<SchoolRow> = new fuzzysearch.Searcher([]);
    #boardSearcher: Searcher<BoardRow> = new fuzzysearch.Searcher([]);

    constructor(schoolRows: SchoolRow[]) {
        this.#searchQuery = "";
        this.#schoolRows = schoolRows;

        this.#boardRows = Array.from(d3.rollup(this.#schoolRows, d => {
            // TODO: Caleb to fill this out.
            return new BoardRow({
                ghg_kg: d3.sum(d, v => v.ghg_kg),
                board: d[0].board,
                year: d[0].year,
                ei: 0,
                hdd: 0,
                area: 0,
            });
        }, d => d.board + d.year).values());
    }

    async init() {
        await yieldy()
        this.#schoolSearcher = new fuzzysearch.Searcher(this.#schoolRows, {
            keySelector: d => d.board + " " + d.school
        });

        await yieldy()
        this.#boardSearcher = new fuzzysearch.Searcher(this.#boardRows, {
            keySelector: d => d.board
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
    }

    aggregateSchoolBoards(): boolean {
        return this.#aggregateSchoolBoards;
    }
}

