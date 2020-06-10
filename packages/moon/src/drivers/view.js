import { View, viewPatch } from "moon/src/wrappers/view";

/**
 * Root element
 */
let root = new View("div", {id: "moon-root"}, [], {});
const rootNode = document.getElementById("moon-root");
rootNode.MoonChildren = [];

/**
 * View driver
 */
export default {
	get() {
		return root;
	},
	set(view) {
		viewPatch(rootNode, root, view, 0);

		root = view;
	}
};
