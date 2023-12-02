import { State } from "./state";

export function fail(): never {
    throw new Error("missing element");
}

export function yieldy() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

export function makeBack(x:Element, state:State) {
    x.addEventListener("click", () => {
        state.setFocus({kind:"none"})
        state.render();
    })
    state.render();
}