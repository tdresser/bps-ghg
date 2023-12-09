import * as fuzzysearch from 'fast-fuzzy';
import * as d3 from 'd3';
import { fail, yieldy } from './util';

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
    energy: number;
    ghgiN: number; //weather normalized ghg emissions intensity
    eiN: number; //weather normalized energy use intensity


    constructor(d: BoardRowData) {
        this.year = d.year
        this.board = d.board;
        this.ghg_kg = d.ghg_kg;
        this.ei = d.ei;
        this.hdd = d.hdd;
        this.area = d.area;
        this.energy = this.ei * this.area;
        this.ghgiN = this.ghg_kg / this.hdd / this.area;
        this.eiN = this.ei / this.hdd;
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
    kind: "none";
}

export interface SchoolFocus {
    kind: "school";
    schoolName: string;
    address: string;
}

export interface BoardFocus {
    kind: "board";
    value: string;
}

type Focus = SchoolFocus | BoardFocus | NoFocus;
type ViewType = "main" | "todo";

export class State {
    #focus: Focus = { kind: "none" };
    #viewType: ViewType;
    #schoolRows: SchoolRow[];
    #boardRows: BoardRow[];
    #sectorRows: BoardRow[];
    #schoolSearcher: Searcher<SchoolRow> = new fuzzysearch.Searcher([]);
    #boardSearcher: Searcher<BoardRow> = new fuzzysearch.Searcher([]);

    constructor(schoolRows: SchoolRow[]) {
        this.#schoolRows = schoolRows;
        this.#viewType = "main";

        this.#boardRows = this.combineRows(this.#schoolRows, d => d.board + d.year);
        this.#sectorRows = this.combineRows(this.#boardRows, d => d.year);
    }

    combineRows(data: BoardRow[], aggregation): BoardRow[] {
        return Array.from(d3.rollup(data, d => {
            return new BoardRow({
                ghg_kg: d3.sum(d, v => v.ghg_kg),
                board: d[0].board,
                year: d[0].year,
                ei: d3.sum(d, v => v.energy) / d3.sum(d, v=> v.area),
                hdd: d[0].hdd,
                area: d3.sum(d, v => v.area),
            });
        }, aggregation).values());

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

    allBoardRowsForYear(year: number): BoardRow[] {
        return this.#boardRows.filter(x => x.year == year);
    }

    focusedSchoolRows(): SchoolRow[] | null {
        if (this.#focus.kind != "school") {
            null;
        }
        const address = (this.#focus as SchoolFocus).address;
        return this.#schoolRows.filter(x => x.address == address);
    }

    focusedBoardRows(): BoardRow[] | null {
        switch (this.#focus.kind) {
            case "none":
                return null;
            case "board": {
                const board = (this.#focus as BoardFocus).value;
                return this.#boardRows.filter(x => x.board == board);
            }
            case "school": {
                const focus = (this.#focus as SchoolFocus);
                const schoolName = focus.schoolName;
                const address = focus.address;

                const school = this.#schoolRows.find(
                    x => x.school == schoolName && x.address == address) ?? fail("Can't find school");
                const board = school.board;

                return this.#boardRows.filter(
                    x => x.board == board)
            }
        }
    }

    setViewType(view: ViewType) {
        this.#viewType = view;
    }
    viewType() {
        return this.#viewType;
    }
}

