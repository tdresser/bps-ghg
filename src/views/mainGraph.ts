import * as d3 from 'd3';
import { State } from '../state';
import { fail } from '../util';
import { Selection } from '../util';

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020];
const MARGIN = { top: 10, right: 30, bottom: 30, left: 60 };

export class MainGraph {
    #state: State;
    #yScale: d3.ScaleLinear<number, number, never>;
    #xScale: d3.ScaleBand<number>;
    #yAxisEl: Selection<SVGGElement>;
    #svg: Selection<SVGGElement>;
    #rect: DOMRect;
    #path: Selection<SVGPathElement>;
    #bars: Selection<SVGGElement>;
    #mainTitle: HTMLElement;

    constructor(containerSelector: string,
        state: State) {
        this.#state = state;
        const container = d3.select(containerSelector);
        this.#rect = (container.node() as HTMLElement).getBoundingClientRect();
        this.#mainTitle = document.getElementById("main_title") ?? fail();
        this.#svg = container.append("svg")
            .attr("width", this.#rect.width)
            .attr("height", this.#rect.height)
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

        this.#rect.width = this.#rect.width - MARGIN.left - MARGIN.right;
        this.#rect.height = this.#rect.height - MARGIN.top - MARGIN.bottom;

        // @ts-ignore
        this.#xScale = d3.scaleBand()
            .range([0, this.#rect.width])
            // @ts-ignore
            .domain(YEARS)
            .padding(0.2);

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
        const yAxis = d3.axisLeft(this.#yScale);
        yAxis(this.#yAxisEl);

        this.#path = this.#svg.append("path")
        this.#bars = this.#svg.append("g")
    }
    updateFromState() {
        this.#mainTitle.innerText = "Overall Sector Performance";

        const schoolRows = this.#state.focusedSchoolRows();
        const boardRows = this.#state.focusedBoardRows();
        const sectorRows = this.#state.sectorRows();

        let aggregateRows = sectorRows;
        let domainMax = 0;

        if (boardRows && boardRows.length > 0) {
            this.#mainTitle.innerText = "Board Performance";
            domainMax = Math.max(domainMax,
                d3.max(boardRows, function (d) { return +d.energyNorm; }) ?? fail());
                aggregateRows = boardRows;
        }

        if (schoolRows && schoolRows.length > 0) {
            this.#mainTitle.innerText = "School vs Board Performance";
            domainMax = Math.max(domainMax,d3.max(schoolRows, function (d) { return +d.energyNorm; }) ?? fail())
            if (!boardRows || boardRows.length == 0) {
                throw("should only have school rows along with board rows.")
            }
        }

        if (domainMax == 0) {
            domainMax = d3.max(sectorRows, function (d) { return +d.energyNorm; }) ?? fail()
        }

        this.#yScale = d3.scaleLinear()
            .domain([0, domainMax])
            .range([this.#rect.height, 0])
        const yAxis = d3.axisLeft(this.#yScale);
        yAxis(this.#yAxisEl);

        // Add the line
        this.#path.datum(aggregateRows)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                // @ts-ignore
                .x(d => this.#xScale(d.year) + this.#xScale.bandwidth()/2)
                // @ts-ignore
                .y(d => this.#yScale(d.energyNorm)) as any
            );

        if (schoolRows) {
            console.log("WE HAVE SCHOOL ROWS");
            this.#bars.selectAll("rect")
                .data(schoolRows)
                .join("rect")
                // @ts-ignore
                .attr("x", d => this.#xScale(d.year))
                .attr("y", d => this.#yScale(d.energyNorm))
                .attr("width", this.#xScale.bandwidth())
                .attr("height", d => this.#rect.height - this.#yScale(d.energyNorm))
                .attr("fill", "#69b3a2")
        }
    }
}
