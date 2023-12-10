import * as d3 from 'd3';
import { AggregateRow, BoardFocus, State } from '../state';
import { fail } from '../util';
import { Selection } from '../util';

const YEAR = 2020;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 10 };
const BAR_PADDING = 3;

const BAR_SIZE_INCREASE_MAX_DISTANCE = 7;
const BAR_SIZE_INCREASE_PER_ROW = 12 / BAR_SIZE_INCREASE_MAX_DISTANCE;
function heightForBar(rowIndex: number, currentBoardIndex: number) {
    const dist = Math.abs(currentBoardIndex - rowIndex);
    if (dist > BAR_SIZE_INCREASE_MAX_DISTANCE || currentBoardIndex < 0) {
        return 3;
    }
    return 3 + BAR_SIZE_INCREASE_PER_ROW * (BAR_SIZE_INCREASE_MAX_DISTANCE - dist);
}

class AggregateRowWithPosition {
    row: AggregateRow;
    y: number;
    height: number;
    constructor(row: AggregateRow, y: number, height: number) {
        this.row = row;
        this.y = y;
        this.height = height;
    }
}

export class TodoGraph {
    #state: State;
    #xScale: d3.ScaleLinear<number, number, never>;
    #svg: Selection<SVGGElement>;
    #rect: DOMRect;
    #bars: Selection<SVGGElement>;
    #sortedBoardRowsWithPosition: AggregateRowWithPosition[];
    #names: Selection<SVGGElement>;


    constructor(containerSelector: string,
        state: State) {
        this.#state = state;

        const container = d3.select(containerSelector);
        this.#rect = (container.node() as HTMLElement).getBoundingClientRect();
        console.log("RECT BEFORE", this.#rect);

        const boardRows = this.#state.allBoardRowsForYear(YEAR) ?? fail();
        const sortedBoardRows = boardRows.sort((a, b) => b.energyNorm - a.energyNorm);
        this.#sortedBoardRowsWithPosition = sortedBoardRows.map(r => new AggregateRowWithPosition(r, 0, 0));

        this.#svg = container.append("svg")
            .attr("width", this.#rect.width)
            .attr("height", this.#rect.height)
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

        this.#rect.width = this.#rect.width - MARGIN.left - MARGIN.right;
        this.#rect.height = this.#rect.height - MARGIN.top - MARGIN.bottom;

        this.#xScale = d3.scaleLinear()
            .range([0, this.#rect.width])
            // @ts-ignore
            .domain(d3.extent(this.#sortedBoardRowsWithPosition, d => d.row.energyNorm));



        this.#svg.append("g")
            .attr("transform", `translate(0, ${this.#rect.height - MARGIN.bottom})`)
            .call(d3.axisBottom(this.#xScale)
                .tickFormat(x => Math.round(x.valueOf() / 10000).toString()));

        this.#bars = this.#svg.append("g")
        this.#names = this.#svg.append("g");

        this.updateFromState();
    }

    updateFromState() {
        const focusedBoard = (this.#state.focus() as BoardFocus).value;
        console.log("FOCUSED BOARD:", focusedBoard);
        const currentBoardIndex = this.#sortedBoardRowsWithPosition.findIndex(d => d.row.board == focusedBoard)
        console.log("current: ", currentBoardIndex);
        console.log("TODO view: updateFromState");

        let y = 0;
        this.#sortedBoardRowsWithPosition.forEach((row, i) => {
            const height = heightForBar(i, currentBoardIndex);
            row.y = y;
            row.height = height;
            y += height + BAR_PADDING;
        });

        this.#bars.selectAll("rect")
            .data(this.#sortedBoardRowsWithPosition)
            .join("rect")
            .attr("x", 0)
            .attr("y", d => d.y)
            .attr("width", d => this.#xScale(d.row.energyNorm))
            .attr("height", d => d.height)
            .attr("fill", (_, i) => i == currentBoardIndex ? "#EECC77" : "#FFCCCC")

        this.#names.selectAll("text")
            .data(this.#sortedBoardRowsWithPosition)
            .join("text")
            .attr("font-size", 10)
            .attr("x", 2)
            .attr("y", d => d.y + d.height / 2)
            .text(d => d.height > 10 ? d.row.board : "")
            .style("dominant-baseline", "middle")
            .attr("fill", "#000000")
    }
}
