import * as d3 from 'd3';
import { State } from '../state';

export class MainGraph {
    #state: State;
    #xAxis: d3.ScaleLinear<number, number, never>;
    #yAxis: d3.ScaleLinear<number, number, never>;
    #svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    constructor(containerSelector: string,
        state: State) {
        this.#state = state;
        const container = d3.select(containerSelector);
        const width = 100;
        const height = 100;
        this.#svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);
        this.#xAxis = d3.scaleLinear()
            .domain([0, 1])
            .range([0, width]);
        this.#yAxis = d3.scaleLinear()
            .domain([0, 1])
            .range([height, 0]);

        this.#svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(this.#xAxis));
    }
    update() {
        const schoolRows = this.#state.focusedSchoolRows();
        const boardRows = this.#state.focusedBoardRows();

        // @ts-ignore
        const extent = d3.extent(schoolRows, d => d.year) as [number, number];

        // https://stackoverflow.com/questions/16919280/how-to-update-axis-using-d3-js
        /*var xAxis = d3.svg.axis().scale(x).orient("bottom");
        var yAxis = d3.svg.axis().scale(y).orient("left");

        this.#svg.selectAll("g.y.axis")
            .call(this.#yAxis);

        this.#svg.selectAll("g.x.axis")
            .call(this.#xAxis);*/

        // Add Y axis
        // TODO: pick right data!
        let domainMax = 0;
        if (schoolRows) {
            domainMax = d3.max(schoolRows, function (d) { return +d.ghg_kg; }) as number
        }
        if (boardRows) {
            domainMax = Math.max(domainMax,
                d3.max(boardRows, function (d) { return +d.ghg_kg; }) as number);
        }

        this.#svg.append("g")
            .call(d3.axisLeft(this.#yAxis));

        // Add the line
        this.#svg.append("path")
            .datum(boardRows)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                // @ts-ignore
                .x(d => d.year)
                // @ts-ignore
                .y(d => d.ghg_kg) as any
            );
    }
}
