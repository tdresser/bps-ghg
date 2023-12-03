import { State } from "../state";
import { View } from "./view";

export type Views = View[];

export class ViewManager {
    #views: Views;

    constructor(views: Views) {
        this.#views = views;
    }

    updateFromState(state: State) {
        let currentView = this.activeView(state);
        for (const view of this.#views) {
            view.setVisible(view == currentView);
        }
        currentView.updateFromState(state);
    }

    activeView(_:State):View {
        // TODO.
        return this.#views[0];
        /*for (const view of this.#views) {
            if (view.key() == state.focus().kind) {
                return view;
            }
        }*/
        throw("Failure to find view");
    }
}