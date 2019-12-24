import run from "moon/src/run";
import ViewNode from "moon/src/view/ViewNode";
import { removeDataProperty } from "moon/src/view/util";

/**
 * Current view event data
 */
let viewEvent = null;

/**
 * Current view node
 */
let viewOld;

/**
 * Current view element
 */
let viewOldElement;

/**
 * Moon event
 *
 * This is used as a global event handler for any event type, and it runs the
 * corresponding handler with the event data as view driver input.
 */
function MoonEvent() {}

MoonEvent.prototype.handleEvent = function(viewEventNew) {
	viewEvent = viewEventNew;
	run(this["@" + viewEvent.type]);
};

/**
 * Modify the prototype of a node to include special Moon view properties.
 */
Node.prototype.MoonChildren = null;
Node.prototype.MoonEvent = null;

/**
 * Creates an element from a node.
 *
 * @param {object} node
 * @returns {object} element
 */
function viewCreate(node) {
	const nodeName = node.name;

	if (nodeName === "text") {
		// Create a text node using the text content from the default key.
		return document.createTextNode(node.data.data);
	} else {
		// Create a DOM element.
		const element = document.createElement(nodeName);

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
					case "attributes": {
						// Set attributes.
						for (const valueKey in value) {
							element.setAttribute(valueKey, value[valueKey]);
						}

						break;
					}
					case "style": {
						// Set style properties.
						const elementStyle = element.style;

						for (const valueKey in value) {
							elementStyle[valueKey] = value[valueKey];
						}

						break;
					}
					case "focus": {
						// Set focus if needed. Blur isn't set because it's the
						// default.
						if (value) {
							element.focus();
						}

						break;
					}
					case "class": {
						// Set a className property.
						element.className = value;

						break;
					}
					case "for": {
						// Set an htmlFor property.
						element.htmlFor = value;

						break;
					}
					case "children": {
						// Recursively append children.
						const elementMoonChildren = element.MoonChildren = [];

						for (let i = 0; i < value.length; i++) {
							const elementChild = viewCreate(value[i]);

							elementMoonChildren.push(elementChild);
							element.appendChild(elementChild);
						}

						break;
					}
					default: {
						// Set a DOM property.
						element[key] = value;
					}
				}
			}
		}

		return element;
	}
}

/**
 * Patches an old element's data to match a new node, using an old node as
 * reference.
 *
 * @param {object} nodeOld
 * @param {object} nodeOldElement
 * @param {object} nodeNew
 */
function viewPatch(nodeOld, nodeOldElement, nodeNew) {
	const nodeOldData = nodeOld.data;
	const nodeNewData = nodeNew.data;

	// First, go through all new data and update all of the existing data to
	// match.
	for (const keyNew in nodeNewData) {
		const valueOld = nodeOldData[keyNew];
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
					case "attributes": {
						// Update attributes.
						if (valueOld === undefined) {
							for (const valueNewKey in valueNew) {
								nodeOldElement.setAttribute(valueNewKey, valueNew[valueNewKey]);
							}
						} else {
							for (const valueNewKey in valueNew) {
								const valueNewValue = valueNew[valueNewKey];

								if (valueOld[valueNewKey] !== valueNewValue) {
									nodeOldElement.setAttribute(valueNewKey, valueNewValue);
								}
							}

							// Remove attributes from the old value that are not in
							// the new value.
							for (const valueOldKey in valueOld) {
								if (!(valueOldKey in valueNew)) {
									nodeOldElement.removeAttribute(valueOldKey);
								}
							}
						}

						break;
					}
					case "style": {
						// Update style properties.
						const nodeOldElementStyle = nodeOldElement.style;

						if (valueOld === undefined) {
							for (const valueNewKey in valueNew) {
								nodeOldElementStyle[valueNewKey] = valueNew[valueNewKey];
							}
						} else {
							for (const valueNewKey in valueNew) {
								const valueNewValue = valueNew[valueNewKey];

								if (valueOld[valueNewKey] !== valueNewValue) {
									nodeOldElementStyle[valueNewKey] = valueNewValue;
								}
							}

							// Remove style properties from the old value that are not
							// in the new value.
							for (const valueOldKey in valueOld) {
								if (!(valueOldKey in valueNew)) {
									nodeOldElementStyle[valueOldKey] = "";
								}
							}
						}

						break;
					}
					case "focus": {
						// Update focus/blur.
						if (valueNew) {
							nodeOldElement.focus();
						} else {
							nodeOldElement.blur();
						}

						break;
					}
					case "class": {
						// Update a className property.
						nodeOldElement.className = valueNew;

						break;
					}
					case "for": {
						// Update an htmlFor property.
						nodeOldElement.htmlFor = valueNew;

						break;
					}
					case "children": {
						// Update children.
						const valueNewLength = valueNew.length;

						if (valueOld === undefined) {
							// If there were no old children, create new children.
							const nodeOldElementMoonChildren = nodeOldElement.MoonChildren = [];

							for (let i = 0; i < valueNewLength; i++) {
								const nodeOldElementChild = viewCreate(valueNew[i]);

								nodeOldElementMoonChildren.push(nodeOldElementChild);
								nodeOldElement.appendChild(nodeOldElementChild);
							}
						} else {
							const valueOldLength = valueOld.length;

							if (valueOldLength === valueNewLength) {
								// If the children have the same length then update
								// both as usual.
								const nodeOldElementMoonChildren = nodeOldElement.MoonChildren;

								for (let i = 0; i < valueOldLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementMoonChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = viewCreate(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[i]);

											nodeOldElementMoonChildren[i] = valueOldElementNew;
										}
									}
								}
							} else if (valueOldLength > valueNewLength) {
								// If there are more old children than new children,
								// update the corresponding ones and remove the extra
								// old children.
								const nodeOldElementMoonChildren = nodeOldElement.MoonChildren;

								for (let i = 0; i < valueNewLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementMoonChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = viewCreate(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[i]);

											nodeOldElementMoonChildren[i] = valueOldElementNew;
										}
									}
								}

								for (let i = valueNewLength; i < valueOldLength; i++) {
									nodeOldElement.removeChild(nodeOldElementMoonChildren.pop());
								}
							} else {
								// If there are more new children than old children,
								// update the corresponding ones and append the extra
								// new children.
								const nodeOldElementMoonChildren = nodeOldElement.MoonChildren;

								for (let i = 0; i < valueOldLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementMoonChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = viewCreate(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[i]);

											nodeOldElementMoonChildren[i] = valueOldElementNew;
										}
									}
								}

								for (let i = valueOldLength; i < valueNewLength; i++) {
									const nodeOldElementChild = viewCreate(valueNew[i]);

									nodeOldElementMoonChildren.push(nodeOldElementChild);
									nodeOldElement.appendChild(nodeOldElementChild);
								}
							}
						}

						break;
					}
					default: {
						// Update a DOM property.
						nodeOldElement[keyNew] = valueNew;
					}
				}
			}
		}
	}

	// Next, go through all of the old data and remove data that isn't in the
	// new data.
	const nodeOldName = nodeOld.name;

	for (const keyOld in nodeOldData) {
		if (!(keyOld in nodeNewData)) {
			if (keyOld.charCodeAt(0) === 64) {
				// Remove an event.
				const nodeOldElementMoonEvent = nodeOldElement.MoonEvent;

				delete nodeOldElementMoonEvent[keyOld];
				nodeOldElement.removeEventListener(keyOld.slice(1), nodeOldElementMoonEvent);
			} else {
				switch (keyOld) {
					case "attributes": {
						// Remove attributes.
						const valueOld = nodeOldData.attributes;

						for (const valueOldKey in valueOld) {
							nodeOldElement.removeAttribute(valueOldKey);
						}

						break;
					}
					case "focus": {
						// Remove focus.
						nodeOldElement.blur();

						break;
					}
					case "class": {
						// Remove a className property.
						nodeOldElement.className = "";

						break;
					}
					case "for": {
						// Remove an htmlFor property.
						nodeOldElement.htmlFor = "";

						break;
					}
					case "children": {
						// Remove children.
						const valueOldLength = nodeOldData.children.length;
						const nodeOldElementMoonChildren = nodeOldElement.MoonChildren;

						for (let i = 0; i < valueOldLength; i++) {
							nodeOldElement.removeChild(nodeOldElementMoonChildren.pop());
						}

						break;
					}
					default: {
						// Remove a DOM property.
						removeDataProperty(nodeOldElement, nodeOldName, keyOld);
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
 * the trees. The old tree is used to compare values for performance. The DOM
 * is updated to reflect these changes as well. Ideally, the DOM would provide
 * an API for creating lightweight elements and render directly from a virtual
 * DOM, but Moon uses the imperative API for updating it instead.
 *
 * Since views can easily be cached, Moon skips over patches if the old and new
 * nodes are equal. This is also why views should be pure and immutable. They
 * are created every render and stored, so if they are ever mutated, Moon will
 * skip them anyway because they have the same reference. It can use a little
 * more memory, but Moon nodes are heavily optimized to work well with
 * JavaScript engines, and immutability opens up the opportunity to use
 * standard functional techniques for caching.
 */
export default function driver(viewOldElementNew) {
	// Accept query strings as well as DOM elements.
	if (typeof viewOldElementNew === "string") {
		viewOldElement = document.querySelector(viewOldElementNew);
	} else {
		viewOldElement = viewOldElementNew;
	}

	// Capture old data from the root element's attributes.
	const viewOldElementAttributes = viewOldElement.attributes;
	const viewOldData = {};

	for (let i = 0; i < viewOldElementAttributes.length; i++) {
		const viewOldElementAttribute = viewOldElementAttributes[i];
		viewOldData[viewOldElementAttribute.name] = viewOldElementAttribute.value;
	}

	// Create a node from the root element.
	viewOld = new ViewNode(viewOldElement.tagName.toLowerCase(), viewOldData);

	return {
		input() {
			// Return the current event data as input.
			return viewEvent;
		},
		output(viewNew) {
			// When given a new view, patch the old element to match the new node
			// using the old node as reference.
			if (viewOld.name === viewNew.name) {
				// If the root views have the same name, patch their data.
				viewPatch(viewOld, viewOldElement, viewNew);
			} else {
				// If they have different names, create a new old view element.
				const viewOldElementNew = viewCreate(viewNew);

				// Manipulate the DOM to replace the old view.
				viewOldElement.parentNode.replaceChild(viewOldElementNew, viewOldElement);

				// Update the reference to the old view element.
				viewOldElement = viewOldElementNew;
			}

			// Store the new view as the old view to be used as reference during a
			// patch.
			viewOld = viewNew;
		}
	};
}
