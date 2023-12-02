import { SchoolFocus, State } from "../state";
import { fail, makeBack } from "../util";
import { View, ViewType } from "./view"
import { ViewManager } from "./viewManager";

export class SchoolView extends View {
    static key = ViewType.School;

    #schoolName: HTMLElement;
    constructor(state:State, viewManager:ViewManager) {
        super(document.querySelector("#school_view") as HTMLElement ?? fail());
        this.#schoolName = document.querySelector("#school_name") as HTMLElement ?? fail();
        const back = document.querySelector("#school_back") ?? fail();
        makeBack(back, state, viewManager);
    }
    render(state: State): void {
        const focus = state.focus() as SchoolFocus;
        console.log("FOCUS: " + focus.value)
        this.#schoolName.innerText = "School: " + focus.value;
    }
    key() {
        return SchoolView.key;
    }
}