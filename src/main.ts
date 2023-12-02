import './style.css'

import * as d3 from 'd3';
import * as fuzzysearch from 'fast-fuzzy';
import csv from './assets/data.csv.gzip';

console.log("CSV IS");
console.log(csv);

// @ts-ignore
window.csv = csv;
window.d3 = d3;

import { Grid } from "gridjs";
import "gridjs/dist/theme/mermaid.css";

export function fail(): never {
  throw new Error("missing element");
}

let searchQuery = "";
const tableContainer = document.querySelector("#table_container") ?? fail();

function createTable(columns: string[], rows:Row[]): Grid {
  console.log("CREATE");
  const grid = new Grid({
    columns,
    data: rows.map(x => row_to_array(x)),
    pagination: {
      limit: 20
    },
    sort: true
  });
  grid.render(tableContainer);
  return grid;
}

const aggregateSchoolboards = false;

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

  grid.updateConfig({
    data: filteredRows.map(x => row_to_array(x)),
  }).forceRender();
}

const COLUMN_NAMES = ["School", "City", "Greenhouse Gas KG"];
interface Row {
  school: string | null,
  city: string,
  ghg_kg: number,
}

function row_to_array(row:Row) {
  return [row.school, row.city, Math.round(row.ghg_kg)];
}

async function main() {
  const body = (await fetch(csv)).body || fail();
  //console.log(await body.getReader().read());
  const ds = new DecompressionStream("gzip");
  const reader = body.pipeThrough(ds).getReader();
  let decompressedString = "";
  while (true) {
    const {done, value} = await reader.read();
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

  // TODO: yield.
  const schoolSearcher = new fuzzysearch.Searcher(schoolRows, {
    keySelector: d => d.city + " " + d.school
  });

  const boardSearcher = new fuzzysearch.Searcher(boardRows, {
    keySelector: d => d.city + " " + d.school
  });

  const grid = createTable(COLUMN_NAMES, schoolRows);
  rerender(grid, schoolRows, schoolSearcher, boardRows, boardSearcher);

  const search = document.getElementById("search") as HTMLInputElement;
  search?.addEventListener("input", () => {
    searchQuery = search.value.toLocaleLowerCase();
    console.log("q: " + searchQuery);
    rerender(grid, schoolRows, schoolSearcher, boardRows, boardSearcher);
  });
}

main();