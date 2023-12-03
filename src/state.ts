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


    constructor(d: BoardRowData) {
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

    constructor(d: SchoolRowData) {
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
    #focus: Focus = { kind: FocusType.None };
    #schoolRows: SchoolRow[];
    #boardRows: BoardRow[];
    #schoolSearcher: Searcher<SchoolRow> = new fuzzysearch.Searcher([]);
    #boardSearcher: Searcher<BoardRow> = new fuzzysearch.Searcher([]);

    constructor(schoolRows: SchoolRow[]) {
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
        // Restrict to 2020 data to avoid duplicates.
        // TODO: maybe use max year instead of hard coding.
        await yieldy()
        this.#schoolSearcher = new fuzzysearch.Searcher(
            this.#schoolRows.filter(x => x.year == 2020), {
            keySelector: d => d.board + " " + d.school
        });

        await yieldy()
        this.#boardSearcher = new fuzzysearch.Searcher(
            this.#boardRows.filter(x => x.year == 2020), {
            keySelector: d => d.board
        });
    }

    getFilteredSchools(query: string, board: string | null): SchoolRow[] {
        let searchResults: SchoolRow[] = [];

        if (query == "") {
            searchResults = this.#schoolRows;
        } else {
            searchResults = this.#schoolSearcher.search(query);
        }
        console.log("BOARD IS: ", board)
        // If there's a board, filter by it.
        if (board && board.length > 0) {
            return (searchResults.filter(x => x.board == board))
        }
        return searchResults;
    }

    getFilteredBoards(searchQuery: string): BoardRow[] {
        if (searchQuery == "") {
            return this.#boardRows;
        }
        return this.#boardSearcher.search(searchQuery);
    }

    setFocus(focus: Focus) {
        this.#focus = focus;
    }

    focus() {
        return this.#focus;
    }
}

