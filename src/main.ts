import './style.css'

import * as d3 from 'd3';
import csv from './assets/data.csv.gzip';
import "gridjs/dist/theme/mermaid.css";
import { fail } from './util';
import { Row, State, Views } from './state';
import { GridView } from './gridView';
import { BoardView } from './boardView';

let state: State | null = null;

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
  const schoolRows : Row[] = []
  for (const d of df) {
    schoolRows.push({
      school: d["Operation"],
      board: d['City'],
      ghg_kg: parseFloat(d["GHG Emissions KG"])
    });
  }

  state = new State(schoolRows);

  const boardView = new BoardView();
  const gridView = new GridView(state);

  const views:Views = {}
  views[GridView.name] = gridView;
  views[BoardView.name] = boardView;
  await state.init(views, gridView);
  state.render();
}

main();