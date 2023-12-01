import './style.css'

import * as d3 from 'd3';
import * as fuzzysearch from 'fast-fuzzy';
import csv from './assets/2020.csv.gz';

let searchQuery = "";

// The table generation function
function createTable(columns: string[]) {
  const table = d3.select("#table_container").append("table");
  const thead = table.append("thead");
  const tbody = table.append("tbody");

  // append the header row
  thead.append("tr")
    .selectAll("th")
    .data(columns)
    .join("th")
    .text(x => x);
  return tbody;
}

const aggregateSchoolboards = false;

function rerender(tbody: d3.Selection<HTMLTableSectionElement, unknown, HTMLElement, any>,
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

  tbody.selectAll("tr")
    .data(filteredRows)
    .join("tr")
    .html(d => `
    <td>${d.city}</td>
    <td>${d.school}</td>
    <td>${Math.round(d.ghg_kg)}</td>`)
}

const COLUMN_NAMES = ["School", "City", "Greenhouse Gas KG"];
interface Row {
  school: string | null,
  city: string,
  ghg_kg: number,
}

async function main() {
  const df = await d3.csv(csv);

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

  console.log(boardRows);

  const schoolSearcher = new fuzzysearch.Searcher(schoolRows, {
    keySelector: d => d.city + " " + d.school
  });

  const boardSearcher = new fuzzysearch.Searcher(boardRows, {
    keySelector: d => d.city + " " + d.school
  });

  const tbody = createTable(COLUMN_NAMES)
  rerender(tbody, schoolRows, schoolSearcher, boardRows, boardSearcher);

  const search = document.getElementById("search") as HTMLInputElement;
  search?.addEventListener("input", () => {
    searchQuery = search.value.toLocaleLowerCase();
    console.log("q: " + searchQuery);
    rerender(tbody, schoolRows, schoolSearcher, boardRows, boardSearcher);
  });
}

main();