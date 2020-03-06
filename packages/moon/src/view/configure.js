import ViewNode from "moon/src/view/ViewNode";
import { viewOldUpdate, viewOldElement, viewOldElementUpdate } from "moon/src/view/state";

/**
 * Configure the old view node and element.
 *
 * @param {object} options
 */
export default function configure(options) {
	if ("root" in options) {
		viewOldElementUpdate(options.root);

		// Capture old data from the element's attributes.
		const viewOldElementAttributes = viewOldElement.attributes;
		const viewOldData = {};

		for (let i = 0; i < viewOldElementAttributes.length; i++) {
			const viewOldElementAttribute = viewOldElementAttributes[i];
			viewOldData[viewOldElementAttribute.name] = viewOldElementAttribute.value;
		}

		// Create a node from the root element.
		viewOldUpdate(new ViewNode(viewOldElement.tagName.toLowerCase(), viewOldData));
	}
}
