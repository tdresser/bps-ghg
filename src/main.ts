import './style.css'

import * as d3 from 'd3';
import * as fuzzysearch from 'fast-fuzzy';
import csv from './assets/data.csv.gzip';
import "gridjs/dist/theme/mermaid.css";
import { fail, yieldy } from './util';
import { State } from './state';
import { GridView } from './gridView';
import { BoardView } from './boardView';

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
      hidden: false,
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

  const gridView = new GridView(state);
  const boardView = new BoardView();
  const views = [gridView, boardView]

  await yieldy()
  state.schoolSearcher = new fuzzysearch.Searcher(state.schoolRows, {
    keySelector: d => d.city + " " + d.school
  });

  await yieldy()
  state.boardSearcher = new fuzzysearch.Searcher(state.boardRows, {
    keySelector: d => d.city + " " + d.school
  });

  gridView.render(state);
}

main();