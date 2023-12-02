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