import run from "moon/src/run";
import NodeOld from "moon/src/view/NodeOld";
import NodeNew from "moon/src/view/NodeNew";
import { removeDataProperty, removeDataSet, updateDataSet } from "moon/src/view/util";

/**
 * Current view event data
 */
let viewEvent;

/**
 * Moon event
 *
 * This is used as a global event handler for any event type, and it calls the
 * corresponding handler with the event, data, and children.
 */
function MoonEvent() {}

MoonEvent.prototype.handleEvent = function(viewEventNew) {
	viewEvent = viewEventNew;
	run(this["@" + viewEvent.type]);
};

Node.prototype.MoonEvent = null;

/**
 * Creates an old reference node from a view node.
 *
 * @param {Object} node
 * @returns {Object} node to be used as an old node
 */
function viewCreate(node) {
	const nodeName = node.name;
	const children = [];
	let element;

	if (nodeName === "text") {
		// Create a text node using the text content from the default key.
		element = document.createTextNode(node.data[""]);
	} else {
		// Create a DOM element.
		element = document.createElement(nodeName);

		// Recursively append children.
		const nodeChildren = node.children;

		for (let i = 0; i < nodeChildren.length; i++) {
			const childOld = viewCreate(nodeChildren[i]);

			children.push(childOld);
			element.appendChild(childOld.element);
		}

		// Set data.
		const nodeData = node.data;

		for (const key in nodeData) {
			const value = nodeData[key];

			if (key.charCodeAt(0) === 64) {
				// Set an event listener.
				let elementMoonEvent = element.MoonEvent;

				if (elementMoonEvent === null) {
					elementMoonEvent = element.MoonEvent = new MoonEvent();
				}

				elementMoonEvent[key] = value;
				element.addEventListener(key.slice(1), elementMoonEvent);
			} else {
				switch (key) {
					case "ariaset":
					case "dataset":
					case "style":
						// Set aria-*, data-*, and style attributes.
						updateDataSet(element, key, value);

						break;
					case "class":
						// Set a className property.
						element.className = value;

						break;
					case "for":
						// Set an htmlFor property.
						element.htmlFor = value;

						break;
					default:
						// Set a DOM property.
						element[key] = value;
				}
			}
		}
	}

	// Return an old node with a reference to the immutable node and mutable
	// element. This is to help performance and allow static nodes to be reused.
	return new NodeOld(node, element, children);
}

/**
 * Patches an old node into a new node finding differences and applying
 * changes to the DOM.
 *
 * @param {Object} nodeOld
 * @param {Object} nodeNew
 */
function viewPatch(nodeOld, nodeNew) {
	const nodeOldNode = nodeOld.node;

	if (nodeOldNode !== nodeNew) {
		const nodeOldNodeName = nodeOldNode.name;

		// Update the old node reference. This doesn't affect the rest of the
		// patch because it uses `nodeOldNode` instead of direct property access.
		nodeOld.node = nodeNew;

		if (nodeOldNodeName !== nodeNew.name) {
			// If the types or name aren't the same, then replace the old node
			// with the new one.
			const nodeOldElement = nodeOld.element;
			const nodeOldNew = viewCreate(nodeNew);
			const nodeOldNewElement = nodeOldNew.element;

			nodeOld.element = nodeOldNewElement;
			nodeOld.children = nodeOldNew.children;

			nodeOldElement.parentNode.replaceChild(nodeOldNewElement, nodeOldElement);
		} else if (nodeOldNodeName === "text") {
			// If they both are text, then update the text content.
			const nodeNewText = nodeNew.data[""];

			if (nodeOldNode.data[""] !== nodeNewText) {
				nodeOld.element.data = nodeNewText;
			}
		} else {
			// If they are both elements, then update the data.
			const nodeOldNodeData = nodeOldNode.data;
			const nodeNewData = nodeNew.data;

			if (nodeOldNodeData !== nodeNewData) {
				// First, go through all new data and update all of the existing data
				// to match.
				const nodeOldElement = nodeOld.element;

				for (const keyNew in nodeNewData) {
					const valueOld = nodeOldNodeData[keyNew];
					const valueNew = nodeNewData[keyNew];

					if (valueOld !== valueNew) {
						if (keyNew.charCodeAt(0) === 64) {
							// Update an event.
							let nodeOldElementMoonEvent = nodeOldElement.MoonEvent;

							if (nodeOldElementMoonEvent === null) {
								nodeOldElementMoonEvent = nodeOldElement.MoonEvent = new MoonEvent();
							}

							if (keyNew in nodeOldElementMoonEvent) {
								// If the event exists, update the existing event handler.
								nodeOldElementMoonEvent[keyNew] = valueNew;
							} else {
								// If the event doesn't exist, add a new event listener.
								nodeOldElementMoonEvent[keyNew] = valueNew;
								nodeOldElement.addEventListener(keyNew.slice(1), nodeOldElementMoonEvent);
							}
						} else {
							switch (keyNew) {
								case "ariaset":
								case "dataset":
								case "style":
									// If it is a set attribute, update all values in
									// the set.
									updateDataSet(nodeOldElement, keyNew, valueNew);

									if (valueOld !== undefined) {
										// If there was an old set, remove all old set
										// attributes while excluding any new ones that
										// still exist.
										removeDataSet(nodeOldElement, keyNew, valueOld, valueNew);
									}

									break;
								case "class":
									// Update a className property.
									nodeOldElement.className = valueNew;

									break;
								case "for":
									// Update an htmlFor property.
									nodeOldElement.htmlFor = valueNew;

									break;
								default:
									// Update a DOM property.
									nodeOldElement[keyNew] = valueNew;
							}
						}
					}
				}

				// Next, go through all of the old data and remove data that isn't in
				// the new data.
				for (const keyOld in nodeOldNodeData) {
					if (!(keyOld in nodeNewData)) {
						if (keyOld.charCodeAt(0) === 64) {
							// Remove an event.
							const nodeOldElementMoonEvent = nodeOldElement.MoonEvent;

							delete nodeOldElementMoonEvent[keyOld];
							nodeOldElement.removeEventListener(keyOld.slice(1), nodeOldElementMoonEvent);
						} else {
							switch (keyOld) {
								case "ariaset":
								case "dataset":
								case "style":
									// If it is a set attribute, remove all old values
									// from the set and exclude nothing.
									removeDataSet(nodeOldElement, keyOld, nodeOldNodeData[keyOld], {});

									break;
								case "class":
									// Remove a className property.
									nodeOldElement.className = "";

									break;
								case "for":
									// Remove an htmlFor property.
									nodeOldElement.htmlFor = "";

									break;
								default:
									// Remove a DOM property.
									removeDataProperty(nodeOldElement, nodeOldNodeName, keyOld);
							}
						}
					}
				}
			}

			// Diff children.
			const childrenNew = nodeNew.children;

			if (nodeOldNode.children !== childrenNew) {
				const childrenOld = nodeOld.children;
				const childrenOldLength = childrenOld.length;
				const childrenNewLength = childrenNew.length;

				if (childrenOldLength === childrenNewLength) {
					// If the children have the same length then update both as
					// usual.
					for (let i = 0; i < childrenOldLength; i++) {
						viewPatch(childrenOld[i], childrenNew[i]);
					}
				} else {
					const nodeOldElement = nodeOld.element;

					if (childrenOldLength > childrenNewLength) {
						// If there are more old children than new children, update the
						// corresponding ones and remove the extra old children.
						for (let i = 0; i < childrenNewLength; i++) {
							viewPatch(childrenOld[i], childrenNew[i]);
						}

						for (let i = childrenNewLength; i < childrenOldLength; i++) {
							nodeOldElement.removeChild(childrenOld.pop().element);
						}
					} else {
						// If there are more new children than old children, update the
						// corresponding ones and append the extra new children.
						for (let i = 0; i < childrenOldLength; i++) {
							viewPatch(childrenOld[i], childrenNew[i]);
						}

						for (let i = childrenOldLength; i < childrenNewLength; i++) {
							const nodeOldNew = viewCreate(childrenNew[i]);

							childrenOld.push(nodeOldNew);
							nodeOldElement.appendChild(nodeOldNew.element);
						}
					}
				}
			}
		}
	}
}

/**
 * View driver
 *
 * The view driver is responsible for updating the DOM and rendering views.
 * The patch consists of walking the new tree and finding differences between
 * the trees. At the same time, the old tree is changed to include references
 * to the new one. The DOM is updated to reflect these changes as well.
 * Ideally, the DOM would provide an API for creating lightweight elements and
 * render directly from a virtual DOM, but Moon uses the imperative API for
 * updating it instead.
 *
 * Since views can easily be cached, Moon skips over patches if the old and new
 * nodes are equal. This is also why views should be pure and immutable. They
 * are created every render and stored, so if they are ever mutated, Moon will
 * skip them anyway because they have the same reference. It can use a little
 * more memory, but Moon nodes are heavily optimized to work well with
 * JavaScript engines, and immutability opens up the opportunity to use
 * standard functional techniques for caching.
 */
export default function driver(root) {
	// Accept query strings as well as DOM elements.
	if (typeof root === "string") {
		root = document.querySelector(root);
	}

	// Capture old data from the root element's attributes.
	const rootAttributes = root.attributes;
	const dataOld = {};

	for (let i = 0; i < rootAttributes.length; i++) {
		const rootAttribute = rootAttributes[i];
		dataOld[rootAttribute.name] = rootAttribute.value;
	}

	// Create an old node from the root element.
	const viewOld = new NodeOld(
		new NodeNew(
			root.tagName.toLowerCase(),
			dataOld,
			[]
		),
		root,
		[]
	);

	return {
		input() {
			// Return the current event data as input.
			return viewEvent;
		},
		output(viewNew) {
			// When given a new view, patch the old view into the new one,
			// updating the DOM in the process.
			viewPatch(viewOld, viewNew);
		}
	};
}
