import components from "moon/src/components";

/**
 * Global DOM.
 */
let dom = document.body;

/**
 * Global virtual DOM.
 */
let vdom = components.body({});

/**
 * Cache for default property values
 */
const removeDataPropertyCache = {};

/**
 * Modify the prototype of a node to provide fast access to child nodes.
 */
Node.prototype.MoonChildren = null;

/**
 * Creates a DOM element from a view.
 *
 * @param {object} view
 * @returns {object} dom
 */
function create(view) {
	const viewName = view.name;

	if (viewName === "text") {
		// Create a text node using the text content from the data key.
		return document.createTextNode(view.data.data);
	} else {
		// Create a DOM element.
		const dom = document.createElement(viewName);

		// Set data.
		const viewData = view.data;

		for (const key in viewData) {
			const value = viewData[key];

			if (key[0] === "o" && key[1] === "n") {
				// Set an event listener.
				dom[key.toLowerCase()] = () => {
					event(value);
				};
			} else {
				switch (key) {
					case "attributes": {
						// Set attributes.
						for (const valueKey in value) {
							dom.setAttribute(valueKey, value[valueKey]);
						}

						break;
					}
					case "style": {
						// Set style properties.
						const domStyle = dom.style;

						for (const valueKey in value) {
							domStyle[valueKey] = value[valueKey];
						}

						break;
					}
					case "focus": {
						// Set focus if needed. Blur isn't set because it's the
						// default.
						if (value) {
							dom.focus();
						}
					}
					case "class": {
						// Set a className property.
						dom.className = value;

						break;
					}
					case "for": {
						// Set an htmlFor property.
						dom.htmlFor = value;

						break;
					}
					case "children": {
						// Recursively append children.
						const domMoonChildren = dom.MoonChildren = [];

						for (let i = 0; i < value.length; i++) {
							const domChild = viewCreate(value[i]);

							domMoonChildren.push(domChild);
							dom.appendChild(domChild);
						}

						break;
					}
					default: {
						// Set a DOM property.
						dom[key] = value;
					}
				}
			}
		}

		return dom;
	}
}

/**
 * Patches a DOM element to match a view, using a virtual DOM as reference.
 *
 * @param {object} dom
 * @param {object} vdom
 * @param {object} view
 */
function viewPatch(dom, vdom, view) {
	const vdomData = vdom.data;
	const viewData = view.data;

	// First, go through all view data and update all of the existing data to
	// match.
	for (const key in viewData) {
		const vdomValue = vdomData[key];
		const viewValue = viewData[key];

		if (vdomValue !== viewValue) {
			if (key[0] === "o" && key[1] === "n") {
				// Update an event.
				dom[key.toLowerCase()] = () => {
					event(viewValue);
				};
			} else {
				switch (key) {
					case "attributes": {
						// Update attributes.
						if (vdomValue === undefined) {
							for (const key in viewValue) {
								dom.setAttribute(key, viewValue[key]);
							}
						} else {
							for (const key in viewValue) {
								const viewValueValue = valueNew[valueNewKey];

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
	for (const keyOld in nodeOldData) {
		if (!(keyOld in nodeNewData)) {
			if (keyOld[0] === "o" && keyOld[1] === "n") {
				// Remove an event.
				nodeOldElement[keyOld.toLowerCase()] = null;
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
						const nodeOldName = nodeOld.name;
						nodeOldElement[keyOld] = (
							nodeOldName in removeDataPropertyCache ?
								removeDataPropertyCache[nodeOldName] :
								(
									removeDataPropertyCache[nodeOldName] =
										nodeOldName === "text" ?
											document.createTextNode("") :
											document.createElement(nodeOldName)
								)
						)[keyOld];
					}
				}
			}
		}
	}
}

export default {
	get() {
		return vdom;
	},
	set(view) {
		// When given a new view, patch the old element to match the new node
		// using the old node as reference.
		if (vdom.name === view.name) {
			// If the root views have the same name, patch their data.
			viewPatch(dom, vdom, view);
		} else {
			// If they have different names, create a new old view element.
			const domNew = create(view);

			// Manipulate the DOM to replace the old view.
			dom.parentNode.replaceChild(domNew, dom);

			// Update the reference to the old view element.
			dom = domNew;
		}

		// Store the new view as the old view to be used as reference during a
		// patch.
		vdom = view;
	}
};
