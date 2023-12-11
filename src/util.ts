import { State } from "./state";
import { ViewManager } from "./views/viewManager";

export function fail(message?:string): never {
    if (message) {
        throw new Error("Failure");
    } else {
        throw new Error(message);
    }
}

export function yieldy() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

export function makeBack(x:Element, state:State, viewManager:ViewManager) {
    x.addEventListener("click", () => {
        state.setViewType("history");
        viewManager.updateFromState(state);
    })
}

export type Selection<T extends d3.BaseType> = d3.Selection<T, unknown, HTMLElement, any>;