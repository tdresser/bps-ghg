import * as d3 from 'd3';
import { State } from '../state';
import { fail } from '../util';

function updateYAxis(
    yScale: d3.ScaleLinear<number, number, never>,
    yAxisEl: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
    const yAxis = d3.axisLeft(yScale);
    yAxis(yAxisEl);
}

const MARGIN = { top: 10, right: 30, bottom: 30, left: 60 };
type Selection<T extends d3.BaseType> = d3.Selection<T, unknown, HTMLElement, any>;

export class MainGraph {
    #state: State;
    #xScale: d3.ScaleLinear<number, number, never>;
    #yScale: d3.ScaleLinear<number, number, never>;
    #yAxisEl: Selection<SVGGElement>;
    #svg: Selection<SVGGElement>;
    #rect: DOMRect;
    #path: Selection<SVGPathElement>;

    constructor(containerSelector: string,
        state: State) {
        this.#state = state;
        const container = d3.select(containerSelector);
        this.#rect = (container.node() as HTMLElement).getBoundingClientRect();
        this.#svg = container.append("svg")
            .attr("width", this.#rect.width)
            .attr("height", this.#rect.height)
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

        this.#rect.width = this.#rect.width - MARGIN.left - MARGIN.right;
        this.#rect.height = this.#rect.height - MARGIN.top - MARGIN.bottom;
        this.#xScale = d3.scaleLinear()
            .domain([2015, 2020])
            .range([0, this.#rect.width]);

        this.#svg.append("g")
            .attr("transform", `translate(0, ${this.#rect.height})`)
            .call(d3.axisBottom(this.#xScale)
                .tickFormat(x => Math.round(x.valueOf()).toString())
            );

        // Temporary scale.
        this.#yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.#rect.height, 0]);
        this.#yAxisEl = this.#svg.append("g")
        updateYAxis(this.#yScale, this.#yAxisEl);

        this.#path = this.#svg.append("path")
    }
    updateFromState() {
        const schoolRows = this.#state.focusedSchoolRows();
        const boardRows = this.#state.focusedBoardRows();
        if ((!schoolRows || schoolRows.length == 0) &&
            (!boardRows || boardRows.length == 0)) {
            // TODO: cleanup.
            return;
        }

        // https://stackoverflow.com/questions/16919280/how-to-update-axis-using-d3-js

        // Add Y axis
        // TODO: pick right data!
        let domainMax = 0;
        console.log(schoolRows);
        console.log(boardRows)
        if (schoolRows && schoolRows.length > 0) {
            domainMax = d3.max(schoolRows, function (d) { return +d.ghg_kg; }) ?? fail()
        }
        console.log("POST SCHOOLS MAX: ", domainMax)
        if (boardRows && boardRows.length > 0) {
            domainMax = Math.max(domainMax,
                d3.max(boardRows, function (d) { return +d.ghg_kg; }) ?? fail());
        }

        this.#yScale = d3.scaleLinear()
            .domain([0, domainMax])
            .range([this.#rect.height, 0])
        console.log("Domain max: ", domainMax)
        updateYAxis(this.#yScale, this.#yAxisEl);

        console.log("DRAWING LINE");
        // Add the line
        this.#path.datum(boardRows)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                // @ts-ignore
                .x(d => this.#xScale(d.year))
                // @ts-ignore
                .y(d => this.#yScale(d.ghg_kg)) as any
            );
    }
}
