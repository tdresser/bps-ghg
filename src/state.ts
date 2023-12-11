import * as fuzzysearch from 'fast-fuzzy';
import * as d3 from 'd3';
import { fail, yieldy } from './util';

export type Searcher<T extends AggregateRow> = fuzzysearch.Searcher<T, fuzzysearch.FullOptions<T>>;

export interface Column {
    name: string,
    hidden: boolean
}

interface AggregateRowData {
    year: number;
    board: string;
    area: number;
    ghgNorm: number;
    energyNorm: number;
}

interface SchoolRowData extends AggregateRowData {
    school: string;
    address: string;
    city: string;
}

export class AggregateRow {
    year: number;
    board: string;
    area: number;
    energyNorm: number;
    ghgNorm: number;
    ghgIntNorm: number;
    energyIntNorm: number;


    constructor(d: AggregateRowData) {
        this.year = d.year
        this.board = d.board;
        this.area = d.area;
        this.energyNorm = d.energyNorm;
        this.ghgNorm = d.ghgNorm;
        this.ghgIntNorm = this.ghgNorm / this.area * 1000;
        this.energyIntNorm = this.energyNorm / this.area * 1000;
    }

    name() {
        return this.board;
    }
}

export class SchoolRow extends AggregateRow {

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
    board: string;
}

export interface BoardFocus {
    kind: "board";
    board: string;
}

type Focus = SchoolFocus | BoardFocus | NoFocus;
export type ViewType = "history" | "board_ranking";

export class State {
    #focus: Focus = { kind: "none" };
    #viewType: ViewType;
    #schoolRows: SchoolRow[];
    #boardRows: AggregateRow[];
    #sectorRows: AggregateRow[];
    #schoolSearcher: Searcher<SchoolRow> = new fuzzysearch.Searcher([]);
    #boardSearcher: Searcher<AggregateRow> = new fuzzysearch.Searcher([]);

    constructor(schoolRows: SchoolRow[]) {
        this.#schoolRows = schoolRows.filter(d => d.energyIntNorm > 1);
        this.#schoolRows.map(x => {
            x.school = x.school + ", " + x.address;
        })
        this.#viewType = "history";

        this.#boardRows = this.combineRows(this.#schoolRows, d => d.board + d.year);
        this.#sectorRows = this.combineRows(this.#boardRows, d => "" + d.year);
    }

    combineRows(data: AggregateRow[], aggregation: (b:AggregateRow) => string): AggregateRow[] {
        return Array.from(d3.rollup(data, d => {
            return new AggregateRow({
                ghgNorm: d3.sum(d, v => v.ghgNorm),
                board: d[0].board,
                year: d[0].year,
                energyNorm: d3.sum(d, v => v.energyNorm),
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

    getFilteredBoards(searchQuery: string): AggregateRow[] {
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

    allBoardRowsForYear(year: number): AggregateRow[] {
        return this.#boardRows.filter(x => x.year == year);
    }

    focusedSchoolRows(): SchoolRow[] | null {
        if (this.#focus.kind != "school") {
            null;
        }
        const address = (this.#focus as SchoolFocus).address;
        return this.#schoolRows.filter(x => x.address == address);
    }

    focusedBoardRows(): AggregateRow[] | null {
        switch (this.#focus.kind) {
            case "none":
                return null;
            case "board": {
                const board = (this.#focus as BoardFocus).board;
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

    sectorRows() {
        return this.#sectorRows;
    }
}

