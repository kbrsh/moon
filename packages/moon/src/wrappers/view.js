import event from "moon/src/event";

/**
 * Caches for performance
 */
Node.prototype.MoonChildren = null;
Node.prototype.MoonReferenceEvents = null;

/**
 * Reference event manager
 */
function MoonReferenceEvents() {}

MoonReferenceEvents.prototype.handleEvent = function(event) {
	this[event.type]();
};

/**
 * Create a reference event handler.
 *
 * @param {function} set
 * @param {object} viewNode
 * @param {string} key
 * @returns {function} event handler
 */
function referenceHandler(set, viewNode, key) {
	return event(m => set(m, viewNode[key]));
}

/**
 * View Data Property Defaults
 */
const viewDataDefaults = {};

/**
 * View constructor
 */
export function View(name, data, children) {
	this.name = name;
	this.data = data;
	this.children = children;
}

/**
 * Create a view node.
 *
 * @param {object} view
 */
export function viewNodeCreate(view) {
	const viewName = view.name;
	let viewNode;

	if (viewName === "text") {
		viewNode = document.createTextNode(view.data.data);
		viewNode.MoonChildren = [];
	} else {
		const viewData = view.data;
		const viewChildren = view.children;
		viewNode = document.createElement(viewName);
		const viewNodeChildren = viewNode.MoonChildren = [];

		for (const key in viewData) {
			viewDataCreate(viewNode, key, viewData[key]);
		}

		for (let i = 0; i < viewChildren.length; i++) {
			viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewChildren[i])));
		}
	}

	return viewNode;
}

/**
 * Create a data property.
 *
 * @param {object} viewNode
 * @param {string} key
 * @param {any} value
 */
export function viewDataCreate(viewNode, key, value) {
	switch (key) {
		case "attributes": {
			for (const keyAttribute in value) {
				viewNode.setAttribute(keyAttribute, value[keyAttribute]);
			}

			break;
		}
		case "style": {
			const viewNodeStyle = viewNode.style;

			for (const keyStyle in value) {
				viewNodeStyle[keyStyle] = value[keyStyle];
			}

			break;
		}
		case "class": {
			viewNode.className = value;

			break;
		}
		case "for": {
			viewNode.htmlFor = value;

			break;
		}
		case "children": break;
		default: {
			if (key[0] === "o" && key[1] === "n") {
				viewNode[key.toLowerCase()] = event(value);
			} else {
				viewNode[key] = value;
			}
		}
	}
}

/**
 * Update a data property.
 *
 * @param {object} viewNode
 * @param {string} key
 * @param {any} valueOld
 * @param {any} valueNew
 */
export function viewDataUpdate(viewNode, key, valueOld, valueNew) {
	switch (key) {
		case "attributes": {
			for (const keyAttribute in valueNew) {
				const valueAttributeNew = valueNew[keyAttribute];

				if (!(keyAttribute in valueOld) || valueAttributeNew !== valueOld[keyAttribute]) {
					viewNode.setAttribute(keyAttribute, valueAttributeNew);
				}
			}

			for (const keyAttribute in valueOld) {
				if (!(keyAttribute in valueNew)) {
					viewNode.removeAttribute(keyAttribute);
				}
			}

			break;
		}
		case "style": {
			const viewNodeStyle = viewNode.style;

			for (const keyStyle in valueNew) {
				const valueStyleNew = valueNew[keyStyle];

				if (!(keyStyle in valueOld) || valueStyleNew !== valueOld[keyStyle]) {
					viewNodeStyle[keyStyle] = valueStyleNew;
				}
			}

			for (const keyStyle in valueOld) {
				if (!(keyStyle in valueNew)) {
					viewNodeStyle[keyStyle] = "";
				}
			}

			break;
		}
		case "class": {
			viewNode.className = valueNew;

			break;
		}
		case "for": {
			viewNode.htmlFor = valueNew;

			break;
		}
		case "children": break;
		default: {
			if (key[0] === "o" && key[1] === "n") {
				viewNode[key.toLowerCase()] = event(valueNew);
			} else {
				viewNode[key] = valueNew;
			}
		}
	}
}

/**
 * Remove a data property.
 *
 * @param {object} viewNode
 * @param {string} viewName
 * @param {object} viewData
 * @param {string} key
 */
export function viewDataRemove(viewNode, viewName, viewData, key) {
	switch (key) {
		case "attributes": {
			for (const keyAttribute in viewData.attributes) {
				viewNode.removeAttribute(keyAttribute);
			}

			break;
		}
		case "class": {
			viewNode.className = "";

			break;
		}
		case "for": {
			viewNode.htmlFor = "";

			break;
		}
		case "children": break;
		default: {
			if (key[0] === "o" && key[1] === "n") {
				viewNode[key.toLowerCase()] = null;
			} else {
				viewNode[key] = (
					viewName in viewDataDefaults ?
						viewDataDefaults[viewName] :
						(
							viewDataDefaults[viewName] =
								viewName === "text" ?
									document.createTextNode("") :
									document.createElement(viewName)
						)
				)[key];
			}
		}
	}
}

/**
 * Patch a view node into a new view, using an old view as a reference.
 *
 * @param {object} viewNode
 * @param {object} viewOld
 * @param {object} viewNew
 */
export function viewPatch(viewNode, viewOld, viewNew) {
	if (viewOld !== viewNew) {
		const viewNewName = viewNew.name;

		if (viewOld.name !== viewNewName) {
			viewNode.parentNode.replaceChild(viewNodeCreate(viewNew), viewNode);
		} else {
			const viewOldData = viewOld.data;
			const viewOldChildren = viewOld.children;
			const viewNewData = viewNew.data;
			const viewNewChildren = viewNew.children;

			if (viewOldData !== viewNewData) {
				for (const key in viewNewData) {
					if (key in viewOldData) {
						const valueOld = viewOldData[key];
						const valueNew = viewNewData[key];

						if (valueOld !== valueNew) {
							viewDataUpdate(viewNode, key, valueOld, valueNew);
						}
					} else {
						viewDataCreate(viewNode, key, viewNewData[key]);
					}
				}

				for (const key in viewOldData) {
					if (!(key in viewNewData)) {
						viewDataRemove(viewNode, viewNewName, viewOldData, key);
					}
				}
			}

			if (viewOldChildren !== viewNewChildren) {
				const viewNodeChildren = viewNode.MoonChildren;
				const viewOldChildrenLength = viewOldChildren.length;
				const viewNewChildrenLength = viewNewChildren.length;
				let i = 0;

				if (viewOldChildrenLength === viewNewChildrenLength) {
					for (; i < viewOldChildrenLength; i++) {
						viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i]);
					}
				} else if (viewOldChildrenLength < viewNewChildrenLength) {
					for (; i < viewOldChildrenLength; i++) {
						viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i]);
					}

					for (; i < viewNewChildrenLength; i++) {
						viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewNewChildren[i])));
					}
				} else {
					for (; i < viewNewChildrenLength; i++) {
						viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i]);
					}

					for (; i < viewOldChildrenLength; i++) {
						viewNode.removeChild(viewNodeChildren.pop());
					}
				}
			}
		}
	}
}
