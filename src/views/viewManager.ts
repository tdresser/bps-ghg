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

    activeView(state:State):View {
        switch (state.viewType()) {
            case "main":
                return this.#views[0];
            case "todo":
                return this.#views[1];
        }
    }
}