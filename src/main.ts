import './style.css'

import * as d3 from 'd3';
import * as fuzzysearch from 'fast-fuzzy';
import csv from './assets/data.csv.gzip';
import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import { fail, yieldy } from './util';

const SCHOOL_COLUMN_INDEX = 0;
const BOARD_COLUMN_INDEX = 1;


interface Column {
  name: string,
  hidden: boolean
}

interface Row {
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

type Searcher = fuzzysearch.Searcher<Row, fuzzysearch.FullOptions<Row>>;

interface State {
  searchQuery: string;
  aggregateSchoolboards: boolean;
  focus: SchoolFocus | BoardFocus | null;
  columns: Column[];
  schoolRows: Row[];
  schoolSearcher: Searcher;
  boardRows: Row[];
  boardSearcher: Searcher;
}

const state: State = {
  searchQuery: "",
  aggregateSchoolboards: false,
  focus: null,
  columns: [
    {
      name: "School",
      hidden: false
    },
    {
      name: "City",
      hidden: false
    },
    {
      name: "Greenhouse Gas KG",
      hidden: false
    }],
  // Require actual initialization, but leaving non-null.
  schoolRows: [],
  schoolSearcher: new fuzzysearch.Searcher([]),
  boardRows: [],
  boardSearcher: new fuzzysearch.Searcher([]),
}

function getFilteredRows(state: State) {
  if (state.searchQuery == "") {
    return state.aggregateSchoolboards ? state.boardRows : state.schoolRows;
  }
  const searcher = state.aggregateSchoolboards ? state.boardSearcher : state.schoolSearcher;
  return searcher.search(state.searchQuery);
}

const tableContainer = document.querySelector("#table_container") ?? fail();
const boardView = document.querySelector("#board_view") as HTMLElement ?? fail();
const boardName = document.querySelector("#board_name") as HTMLElement ?? fail();

function createTable(state: State): Grid {
  const grid = new Grid({
    columns: state.columns,
    data: [],
    pagination: {
      limit: 20
    },
    sort: true
  });
  grid.render(tableContainer);
  grid.on('rowClick', (_, data) => {
    const board = data.cells[BOARD_COLUMN_INDEX].data ?? fail();
    boardView.style.display = "block";
    state.focus = { kind: 'board', name: board.toString() };
    boardName.innerText = state.focus.name;
    console.log('row: ' + JSON.stringify(board))
  });
  return grid;
}

function rerender(grid: Grid, state: State) {

  let filteredRows = getFilteredRows(state);

  state.columns[SCHOOL_COLUMN_INDEX].hidden = state.aggregateSchoolboards;

  grid.updateConfig({
    data: filteredRows.map(x => row_to_array(x)),
  }).forceRender();
}


function row_to_array(row: Row) {
  return [row.school, row.city, Math.round(row.ghg_kg)];
}

async function main() {
  const body = (await fetch(csv)).body || fail();
  //console.log(await body.getReader().read());
  const ds = new DecompressionStream("gzip");
  const reader = body.pipeThrough(ds).getReader();
  let decompressedString = "";
  while (true) {
    const { done, value } = await reader.read();
    decompressedString += new TextDecoder().decode(value);
    if (done) {
      break;
    }
  }
  const df = d3.csvParse(decompressedString);

  for (const d of df) {
    if (d["Sector"] != "School Board") {
      continue;
    }
    state.schoolRows.push({
      school: d["Operation"],
      city: d['City'],
      ghg_kg: parseFloat(d["GHG Emissions KG"])
    });
  }

  state.boardRows = Array.from(d3.rollup(state.schoolRows, d => {
    return {
      ghg_kg: d3.sum(d, v => v.ghg_kg),
      school: null,
      city: d[0].city
    }
  }, d => d.city).values());

  const grid = createTable(state);

  await yieldy()
  state.schoolSearcher = new fuzzysearch.Searcher(state.schoolRows, {
    keySelector: d => d.city + " " + d.school
  });

  await yieldy()
  state.boardSearcher = new fuzzysearch.Searcher(state.boardRows, {
    keySelector: d => d.city + " " + d.school
  });

  rerender(grid, state);

  const search = document.getElementById("search") as HTMLInputElement ?? fail();
  search.addEventListener("input", () => {
    state.searchQuery = search.value.toLocaleLowerCase();
    console.log("q: " + state.searchQuery);
    rerender(grid, state);
  });

  const aggregate = document.getElementById("aggregate") as HTMLInputElement ?? fail();
  aggregate.addEventListener("input", () => {
    state.aggregateSchoolboards = aggregate.checked;
    rerender(grid, state);
  })
}

main();