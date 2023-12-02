import './style.css'

import * as d3 from 'd3';
import csv from './assets/data.csv.gzip';
import "gridjs/dist/theme/mermaid.css";
import { fail } from './util';
import { State } from './state';
import { GridView } from './gridView';
import { BoardView } from './boardView';

let state: State = new State([])

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
  const schoolRows = []
  for (const d of df) {
    schoolRows.push({
      school: d["Operation"],
      city: d['City'],
      ghg_kg: parseFloat(d["GHG Emissions KG"])
    });
  }
  state = new State(schoolRows)



  const gridView = new GridView(state);
  const boardView = new BoardView();
  const views = [gridView, boardView]

  await state.init();

  gridView.render(state);
}

main();