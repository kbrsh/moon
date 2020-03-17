import ViewNode from "moon/src/view/ViewNode";
import { viewOldUpdate, viewOldElement, viewOldElementUpdate } from "moon/src/view/state";

/**
 * Mount to a DOM element.
 */
export default function mount(element) {
	viewOldElementUpdate(element);

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
