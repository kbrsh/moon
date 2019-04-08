import { generateElement } from "./components/element";
import { generateText } from "./components/text";

/**
 * Generator
 *
 * The generator is responsible for generating functions that create a view.
 * These functions create, update, and destroy components. For efficiency, they
 * also handle elements to remove a layer of abstraction. The functions are ran
 * across multiple frames to allow the browser to handle other events.
 *
 * @param {Object} tree
 * @returns {Object} Create, update, and destroy functions
 */
export function generate(tree) {
	const type = tree.type;

	if (type === "text") {
		return generateText(tree, data, total);
	} else if (type[0] === type[0].toLowerCase()) {
		// Tags that start with a lowercase letter are normal HTML elements. This
		// could be implemented as a user-defined component but is implemented
		// here for efficiency.
		return generateElement(tree, data, total);
	}
}
