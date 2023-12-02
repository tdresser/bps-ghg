import * as fuzzysearch from 'fast-fuzzy';
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

export interface State {
    searchQuery: string;
    aggregateSchoolboards: boolean;
    focus: SchoolFocus | BoardFocus | null;
    columns: Column[];
    schoolRows: Row[];
    schoolSearcher: Searcher;
    boardRows: Row[];
    boardSearcher: Searcher;
}

export function getFilteredRows(state: State) {
    if (state.searchQuery == "") {
        return state.aggregateSchoolboards ? state.boardRows : state.schoolRows;
    }
    const searcher = state.aggregateSchoolboards ? state.boardSearcher : state.schoolSearcher;
    return searcher.search(state.searchQuery);
}