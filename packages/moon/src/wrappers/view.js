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
 * Reference bind keys and events
 */
/*eslint-disable*/
const referenceProperties = {
	audio: {
		"*currentTime": {
			key: "currentTime",
			value: (get, viewNode, viewData) => get,
			event: "timeupdate",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.currentTime))
		},
		"*muted": {
			key: "muted",
			value: (get, viewNode, viewData) => get,
			event: "volumechange",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.muted))
		},
		"*paused": {
			key: "paused",
			value: (get, viewNode, viewData) => get,
			event: "pause",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.paused))
		},
		"*playbackRate": {
			key: "playbackRate",
			value: (get, viewNode, viewData) => get,
			event: "ratechange",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.playbackRate))
		},
		"*volume": {
			key: "volume",
			value: (get, viewNode, viewData) => get,
			event: "volumechange",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.volume))
		}
	},
	input: {
		"*checked": {
			key: "checked",
			value: (get, viewNode, viewData) => get,
			event: "change",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.checked))
		},
		"*radio": {
			key: "checked",
			value: (get, viewNode, viewData) => get === viewData.value,
			event: "change",
			handler: (set, viewNode, viewData) => event(m => set(m, viewData.value))
		},
		"*value": {
			key: "value",
			value: (get, viewNode, viewData) => get,
			event: "input",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.value))
		}
	},
	textarea: {
		"*value": {
			key: "value",
			value: (get, viewNode, viewData) => get,
			event: "input",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.value))
		}
	},
	video: {
		"*currentTime": {
			key: "currentTime",
			value: (get, viewNode, viewData) => get,
			event: "timeupdate",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.currentTime))
		},
		"*muted": {
			key: "muted",
			value: (get, viewNode, viewData) => get,
			event: "volumechange",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.muted))
		},
		"*paused": {
			key: "paused",
			value: (get, viewNode, viewData) => get,
			event: "pause",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.paused))
		},
		"*playbackRate": {
			key: "playbackRate",
			value: (get, viewNode, viewData) => get,
			event: "ratechange",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.playbackRate))
		},
		"*volume": {
			key: "volume",
			value: (get, viewNode, viewData) => get,
			event: "volumechange",
			handler: (set, viewNode, viewData) => event(m => set(m, viewNode.volume))
		}
	}
};
/*eslint-enable*/

/**
 * View Data Property Defaults
 */
const viewDataDefaults = {};

/**
 * View constructor
 */
export function View(name, data, children, references) {
	this.name = name;
	this.data = data;
	this.children = children;
	this.references = references;
}

/**
 * Root element
 */
export let viewRoot = new View("div", {id: "moon-root"}, [], {});
const viewRootNode = document.getElementById("moon-root");
viewRootNode.MoonChildren = [];

/**
 * Get the default data property value for a key of a view.
 *
 * @param {string} viewName
 * @param {string} key
 * @returns {any} default data property value
 */
function viewDataDefault(viewName, key) {
	return (
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

/**
 * Create a view node.
 *
 * @param {object} view
 * @returns {object} viewNode
 */
function viewNodeCreate(view) {
	const viewName = view.name;
	let viewNode;

	if (viewName === "text") {
		viewNode = document.createTextNode(view.data.data);
		viewNode.MoonChildren = [];
	} else {
		viewNode = document.createElement(viewName);
		const viewNodeChildren = viewNode.MoonChildren = [];
		const viewData = view.data;
		const viewChildren = view.children;
		const viewReferences = view.references;

		for (const key in viewData) {
			viewDataCreate(viewNode, key, viewData[key]);
		}

		for (let i = 0; i < viewChildren.length; i++) {
			viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewChildren[i])));
		}

		for (const key in viewReferences) {
			viewReferenceCreate(viewNode, viewName, viewData, key, viewReferences[key]);
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
function viewDataCreate(viewNode, key, value) {
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
			const keyFirst = key[0];

			if (keyFirst !== "*") {
				if (keyFirst === "o" && key[1] === "n") {
					viewNode[key.toLowerCase()] = event(value);
				} else {
					viewNode[key] = value;
				}
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
function viewDataUpdate(viewNode, key, valueOld, valueNew) {
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
			const keyFirst = key[0];

			if (keyFirst !== "*") {
				if (keyFirst === "o" && key[1] === "n") {
					viewNode[key.toLowerCase()] = event(valueNew);
				} else {
					viewNode[key] = valueNew;
				}
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
function viewDataRemove(viewNode, viewName, viewData, key) {
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
			const keyFirst = key[0];

			if (keyFirst !== "*") {
				if (keyFirst === "o" && key[1] === "n") {
					viewNode[key.toLowerCase()] = null;
				} else {
					viewNode[key] = viewDataDefault(viewName, key);
				}
			}
		}
	}
}

/**
 * Create a reference.
 *
 * @param {object} viewNode
 * @param {string} viewName
 * @param {object} viewData
 * @param {string} key
 * @param {object} reference
 */
function viewReferenceCreate(viewNode, viewName, viewData, key, reference) {
	const referenceProperty = referenceProperties[viewName][key];
	const referenceEvent = referenceProperty.event;
	let viewNodeReferenceEvents = viewNode.MoonReferenceEvents;

	if (viewNodeReferenceEvents === null) {
		viewNodeReferenceEvents = viewNode.MoonReferenceEvents = new MoonReferenceEvents();
	}

	viewNode[referenceProperty.key] = referenceProperty.value(reference.get, viewNode, viewData);
	viewNodeReferenceEvents[referenceEvent] = referenceProperty.handler(reference.set, viewNode, viewData);
	viewNode.addEventListener(referenceEvent, viewNodeReferenceEvents);
}

/**
 * Update a reference.
 *
 * @param {object} viewNode
 * @param {string} viewName
 * @param {object} viewData
 * @param {string} key
 * @param {object} referenceOld
 * @param {object} referenceNew
 */
function viewReferenceUpdate(viewNode, viewName, viewData, key, referenceOld, referenceNew) {
	const referenceProperty = referenceProperties[viewName][key];
	const referenceNewGet = referenceNew.get;

	if (referenceOld.get !== referenceNewGet) {
		viewNode[referenceProperty.key] = referenceProperty.value(referenceNewGet, viewNode, viewData);
	}

	if (referenceOld.value !== referenceNew.value) {
		viewNode.MoonReferenceEvents[referenceProperty.event] = referenceProperty.handler(referenceNew.set, viewNode, viewData);
	}
}

/**
 * Remove a reference.
 *
 * @param {object} viewNode
 * @param {string} viewName
 * @param {string} key
 */
function viewReferenceRemove(viewNode, viewName, key) {
	const referenceProperty = referenceProperties[viewName][key];
	const referenceKey = referenceProperty.key;
	const referenceEvent = referenceProperty.event;
	const viewNodeReferenceEvents = viewNode.MoonReferenceEvents;

	viewNode[referenceKey] = viewDataDefault(viewName, referenceKey);
	viewNodeReferenceEvents[referenceEvent] = null;
	viewNode.removeEventListener(referenceEvent, viewNodeReferenceEvents);
}

/**
 * Patch a view node into a new view, using an old view as a reference.
 *
 * @param {object} viewNode
 * @param {object} viewOld
 * @param {object} viewNew
 * @param {number} index
 */
function viewPatchChild(viewNode, viewOld, viewNew, index) {
	if (viewOld !== viewNew) {
		const viewNewName = viewNew.name;

		if (viewOld.name !== viewNewName) {
			const viewNodeParent = viewNode.parentNode;

			viewNodeParent.replaceChild(viewNodeParent.MoonChildren[index] = viewNodeCreate(viewNew), viewNode);
		} else {
			const viewOldData = viewOld.data;
			const viewOldChildren = viewOld.children;
			const viewOldReferences = viewOld.references;
			const viewNewData = viewNew.data;
			const viewNewChildren = viewNew.children;
			const viewNewReferences = viewNew.references;

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
						viewPatchChild(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
					}
				} else if (viewOldChildrenLength < viewNewChildrenLength) {
					for (; i < viewOldChildrenLength; i++) {
						viewPatchChild(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
					}

					for (; i < viewNewChildrenLength; i++) {
						viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewNewChildren[i])));
					}
				} else {
					for (; i < viewNewChildrenLength; i++) {
						viewPatchChild(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
					}

					for (; i < viewOldChildrenLength; i++) {
						viewNode.removeChild(viewNodeChildren.pop());
					}
				}
			}

			if (viewOldReferences !== viewNewReferences) {
				for (const key in viewNewReferences) {
					if (key in viewOldReferences) {
						const referenceOld = viewOldReferences[key];
						const referenceNew = viewNewReferences[key];

						if (referenceOld !== referenceNew) {
							viewReferenceUpdate(viewNode, viewNewName, viewNewData, key, referenceOld, referenceNew);
						}
					} else {
						viewReferenceCreate(viewNode, viewNewName, viewNewData, key, viewNewReferences[key]);
					}
				}

				for (const key in viewOldReferences) {
					if (!(key in viewNewReferences)) {
						viewReferenceRemove(viewNode, viewNewName, key);
					}
				}
			}
		}
	}
}

/**
 * Patch the root node into a new view, using an old view as a reference.
 *
 * @param {object} view
 */
export function viewPatch(view) {
	viewPatchChild(viewRootNode, viewRoot, view, 0);
	viewRoot = view;
}
