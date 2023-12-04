import * as d3 from 'd3';
import { BoardRow, State } from '../state';
import { fail } from '../util';
import { Selection } from '../util';

const YEAR = 2020;
const MARGIN = { top: 10, right: 30, bottom: 30, left: 60 };

export class TodoGraph {
    #state: State;
    #yScale: d3.ScaleBand<number>;
    #yAxisEl: Selection<SVGGElement>;
    #xScale: d3.ScaleLinear<number, number, never>;
    #xAxisEl: Selection<SVGGElement>;
    #svg: Selection<SVGGElement>;
    #rect: DOMRect;
    #bars: Selection<SVGGElement>;
    #sortedBoardRows: BoardRow[];

    constructor(containerSelector: string,
        state: State) {
        this.#state = state;

        const container = d3.select(containerSelector);
        console.log("HAVE A CONTAINER: ", container)
        this.#rect = (container.node() as HTMLElement).getBoundingClientRect();

        const boardRows = this.#state.allBoardRowsForYear(YEAR) ?? fail();
        this.#sortedBoardRows = boardRows.sort((a, b) => b.ghg_kg - a.ghg_kg);
        let boardNames = this.#sortedBoardRows.map(x => x.board);
        // @ts-ignore
        this.#yScale = d3.scaleBand()
            .range([0, this.#rect.height])
            .domain(boardNames)
            .padding(0.2);

        // TODO: scale.
        this.#xScale = d3.scaleLinear()
            .range([0, this.#rect.width])
            // @ts-ignore
            .domain(d3.extent(this.#sortedBoardRows, d => d.ghg_kg));

        this.#svg = container.append("svg")
            .attr("width", this.#rect.width)
            .attr("height", this.#rect.height)
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

        console.log("SVG: ", this.#svg)

        this.#rect.width = this.#rect.width - MARGIN.left - MARGIN.right;
        this.#rect.height = this.#rect.height - MARGIN.top - MARGIN.bottom;

        this.#yAxisEl = this.#svg.append("g")
            .call(d3.axisLeft(this.#yScale)
                .tickFormat(x => Math.round(x.valueOf()).toString()));

        this.#xAxisEl = this.#svg.append("g")
            .attr("transform", `translate(0, ${this.#rect.height})`)
            .call(d3.axisBottom(this.#xScale));

        /*const yAxis = d3.axisLeft(this.#yScale);
        yAxis(this.#yAxisEl);

        const xAxis = d3.axisBottom(this.#xScale);
        xAxis(this.#xAxisEl);*/

        this.#bars = this.#svg.append("g")
        this.updateFromState();
    }

    updateFromState() {
        console.log("TODO view: updateFromState");
        this.#bars.selectAll("rect")
            .data(this.#sortedBoardRows)
            .join("rect")
            .attr("x", 0)
            // @ts-ignore
            .attr("y", d => this.#yScale(d.board))
            .attr("width", d => this.#xScale(d.ghg_kg))
            .attr("height", this.#yScale.bandwidth())
            .attr("fill", "#69b3a2")

    }
}
