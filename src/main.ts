import './style.css'

import * as d3 from 'd3';
import fuzzysearch from 'fuzzysearch-ts';

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

function rerender(tbody: d3.Selection<HTMLTableSectionElement, unknown, HTMLElement, any>,
  rows: Row[]) {

  let filteredRows: Row[] = [];
  if (!searchQuery) {
    filteredRows = rows;
  } else {
    for (const row of rows) {
      if (
        fuzzysearch(searchQuery, row.city.toLowerCase()) ||
        fuzzysearch(searchQuery, row.school.toLowerCase())
      ) {
        filteredRows.push(row);
      }
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
  school: string,
  city: string,
  ghg_kg: number,
}

async function main() {
  const df = await d3.csv("2020.csv");
  console.log(df);

  let rows: Row[] = []
  for (const d of df) {
    if (d["Sector"] != "School Board") {
      continue;
    }
    rows.push({
      school: d["Operation"],
      city: d['City'],
      ghg_kg: parseFloat(d["GHG Emissions KG"])
    });
  }

  const tbody = createTable(COLUMN_NAMES)
  rerender(tbody, rows);

  const search = document.getElementById("search") as HTMLInputElement;
  search?.addEventListener("input", () => {
    searchQuery = search.value.toLocaleLowerCase();
    console.log("q: " + searchQuery);
    rerender(tbody, rows);
  });
}

main();