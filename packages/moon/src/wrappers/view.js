import event from "moon/src/event";

/**
 * Caches for performance
 */
Node.prototype.MoonChildren = null;
Node.prototype.MoonReferenceEvents = null;

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
