import * as fuzzysearch from 'fast-fuzzy';
import { SCHOOL_COLUMN_INDEX } from './constants';
import * as d3 from 'd3';
import { yieldy } from './util';
import { View } from './views/view';
import { BoardView } from './views/boardView';
import { SchoolView } from './views/schoolView';
import { GridView } from './views/gridView';

export type Searcher = fuzzysearch.Searcher<Row, fuzzysearch.FullOptions<Row>>;
export type Views = { [name: string]: View};

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
    kind: 'none'
}

export interface SchoolFocus {
    kind: 'school';
    value: string;
}

export interface BoardFocus {
    kind: 'board';
    value: string;
}

type Focus = SchoolFocus | BoardFocus | NoFocus;

export class State {
    #searchQuery: string;
    #focus: Focus = {kind:"none"};
    #aggregateSchoolBoards = false;
    #views: Views = {};
    #activeView: View | null = null;
    #columns: Column[] = [
        {
            name: "School",
            hidden: false
        },
        {
            name: "Board",
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
                board: d[0].board
            }
        }, d => d.board).values());
    }

    async init(views: Views, activeView: View) {
        this.#views = views;
        this.#activeView = activeView;

        await yieldy()
        this.#schoolSearcher = new fuzzysearch.Searcher(this.#schoolRows, {
            keySelector: d => d.board + " " + d.school
        });

        await yieldy()
        this.#boardSearcher = new fuzzysearch.Searcher(this.#boardRows, {
            keySelector: d => d.board + " " + d.school
        });
    }

    render() {
        console.log("RENDER");
        for (const viewName in this.#views) {
          const view = this.#views[viewName];
          view.setVisible(view == this.#activeView);
        }
        this.#activeView?.render(this);
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

    setFocus(focus: Focus) {
        this.#focus = focus;
        switch(focus.kind) {
            case 'board':
                this.#activeView = this.#views[BoardView.name]
                break;
            case 'school':
                this.#activeView = this.#views[SchoolView.name]
                break;
            case 'none':
                this.#activeView = this.#views[GridView.name]
        }
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
    }

    aggregateSchoolBoards():boolean {
        return this.#aggregateSchoolBoards;
    }

    activeView():View {
        if (this.#activeView == null) {
            throw("Missing active view");
        }
        return this.#activeView;
    }

    views(): Views {
        return this.#views;
    }
}

