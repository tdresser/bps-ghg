import { State } from "../state";
import { View } from "./view";

export type Views = View[];

export class ViewManager {
    #views: Views;

    constructor(views: Views) {
        this.#views = views;
    }

    render(state: State) {
        console.log("RENDER");
        let currentView = this.activeView(state);

        if (!currentView) {
            throw("Couldn't find a view");
        }
        for (const view of this.#views) {
            view.setVisible(view == currentView);
        }
        currentView?.render(state);
    }

    activeView(state:State):View {
        for (const view of this.#views) {
            if (view.key() == state.focus().kind) {
                return view;
            }
        }
        throw("Failure to find view");
    }

    views(): Views {
        return this.#views;
    }
}