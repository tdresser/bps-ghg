import { State } from "./state";
import { ViewManager } from "./views/viewManager";

export function fail(): never {
    throw new Error("missing element");
}

export function yieldy() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

export function makeBack(x:Element, state:State, viewManager:ViewManager) {
    x.addEventListener("click", () => {
        state.setFocus({kind:"none"})
        viewManager.render(state);
    })
}