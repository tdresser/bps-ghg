import './style.css'

import * as d3 from 'd3';
import * as fuzzysearch from 'fast-fuzzy';
import csv from './assets/data.csv.gzip';
import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import { fail, yieldy } from './util';

const SCHOOL_COLUMN_INDEX = 0;
const BOARD_COLUMN_INDEX = 1;

let searchQuery = "";
let aggregateSchoolboards = false;
let focusedBoard: string | null = null;

const tableContainer = document.querySelector("#table_container") ?? fail();
const boardView = document.querySelector("#board_view") as HTMLElement ?? fail();
const boardName = document.querySelector("#board_name") as HTMLElement ?? fail();

function createTable(columns: Column[], rows: Row[]): Grid {
  const grid = new Grid({
    columns,
    data: rows.map(x => row_to_array(x)),
    pagination: {
      limit: 20
    },
    sort: true
  });
  grid.render(tableContainer);
  grid.on('rowClick', (_, data) => {
    const board = data.cells[BOARD_COLUMN_INDEX].data ?? fail();
    boardView.style.display = "block";
    focusedBoard = board.toString();
    boardName.innerText = focusedBoard;

    console.log('row: ' + JSON.stringify(board))
  });
  return grid;
}

function rerender(grid: Grid,
  schoolRows: Row[], schoolSearcher: fuzzysearch.Searcher<Row, fuzzysearch.FullOptions<Row>>,
  boardRows: Row[], boardSearcher: fuzzysearch.Searcher<Row, fuzzysearch.FullOptions<Row>>) {

  let filteredRows: Row[] = [];
  if (searchQuery == "") {
    if (aggregateSchoolboards) {
      filteredRows = boardRows;
    } else {
      filteredRows = schoolRows;
    }
  } else {
    if (aggregateSchoolboards) {
      filteredRows = boardSearcher.search(searchQuery);
    } else {
      filteredRows = schoolSearcher.search(searchQuery);
    }
  }

  columns[SCHOOL_COLUMN_INDEX].hidden = aggregateSchoolboards;

  grid.updateConfig({
    data: filteredRows.map(x => row_to_array(x)),
  }).forceRender();
}

interface Column {
  name: string,
  hidden: boolean
}

const columns: Column[] = [
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
  }];
interface Row {
  school: string | null,
  city: string,
  ghg_kg: number,
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

  let schoolRows: Row[] = []
  for (const d of df) {
    if (d["Sector"] != "School Board") {
      continue;
    }
    schoolRows.push({
      school: d["Operation"],
      city: d['City'],
      ghg_kg: parseFloat(d["GHG Emissions KG"])
    });
  }

  const boardRows = Array.from(d3.rollup(schoolRows, d => {
    return {
      ghg_kg: d3.sum(d, v => v.ghg_kg),
      school: null,
      city: d[0].city
    }
  }, d => d.city).values());

  const grid = createTable(columns, schoolRows);

  await yieldy()
  const schoolSearcher = new fuzzysearch.Searcher(schoolRows, {
    keySelector: d => d.city + " " + d.school
  });

  await yieldy()
  const boardSearcher = new fuzzysearch.Searcher(boardRows, {
    keySelector: d => d.city + " " + d.school
  });

  rerender(grid, schoolRows, schoolSearcher, boardRows, boardSearcher);

  const search = document.getElementById("search") as HTMLInputElement ?? fail();
  search.addEventListener("input", () => {
    searchQuery = search.value.toLocaleLowerCase();
    console.log("q: " + searchQuery);
    rerender(grid, schoolRows, schoolSearcher, boardRows, boardSearcher);
  });

  const aggregate = document.getElementById("aggregate") as HTMLInputElement ?? fail();
  aggregate.addEventListener("input", () => {
    aggregateSchoolboards = aggregate.checked;
    rerender(grid, schoolRows, schoolSearcher, boardRows, boardSearcher);
  })
}

main();