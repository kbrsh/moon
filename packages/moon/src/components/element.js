import event from "moon/src/event";
import { View } from "moon/src/wrappers/view";

/**
 * Reference bind events
 */
const references = {
	input: {
		"*value": {
			key: "value",
			event: "input"
		}
	}
};

/**
 * Empty view
 */
const viewEmpty = document.createTextNode("");
viewEmpty.MoonName = "";
viewEmpty.MoonData = {};
viewEmpty.MoonChildren = [];

/**
 * View Data Property Defaults
 */
const viewDataDefaults = {};

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
 * @param {object} view
 * @param {string} key
 * @returns {function} event handler
 */
function referenceHandler(set, view, key) {
	return event(m => set(m, view[key]));
}

/**
 * Get the default value of a data property of a view.
 *
 * @param {string} name
 * @param {string} key
 * @returns {any} default data value
 */
function viewDataDefault(name, key) {
	return (
		name in viewDataDefaults ?
			viewDataDefaults[name] :
			(
				viewDataDefaults[name] =
					name === "text" ?
						document.createTextNode("") :
						document.createElement(name)
			)
	)[key];
}

/**
 * Create a data property on a view.
 *
 * @param {object} view
 * @param {string} name
 * @param {string} key
 * @param {any} value
 * @param {object} m
 */
function viewDataCreate(view, name, key, value, m) {
	switch (key) {
		case "attributes": {
			for (const keyAttribute in value) {
				view.setAttribute(keyAttribute, value[keyAttribute]);
			}

			break;
		}
		case "style": {
			const viewStyle = view.style;

			for (const keyStyle in value) {
				viewStyle[keyStyle] = value[keyStyle];
			}

			break;
		}
		case "class": {
			view.className = value;

			break;
		}
		case "for": {
			view.htmlFor = value;

			break;
		}
		default: {
			const keyFirst = key[0];

			if (keyFirst === "*") {
				const reference = references[name][key];
				const referenceKey = reference.key;
				const referenceEvent = reference.event;
				let viewReferenceEvents = view.MoonReferenceEvents;

				if (viewReferenceEvents === null) {
					viewReferenceEvents = view.MoonReferenceEvents = new MoonReferenceEvents();
				}

				view[referenceKey] = value.get(m);
				viewReferenceEvents[referenceEvent] = referenceHandler(value.set, view, referenceKey);
				view.addEventListener(referenceEvent, viewReferenceEvents);
			} else if (keyFirst === "o" && key[1] === "n") {
				view[key.toLowerCase()] = event(value);
			} else {
				view[key] = value;
			}
		}
	}
}

function elementNameData(name, data, m) {
	let view = m.view;

	if (name !== view.MoonName) {
		view = m.view = document.createElement(name);
		view.MoonName = name;
		view.MoonData = data;

		for (const key in data) {
			viewDataCreate(view, name, key, data[key], m);
		}
	} else {
		const viewData = view.MoonData;

		if (data !== viewData) {
			view.MoonData = data;

			for (const key in data) {
				if (key in viewData) {
					const value = data[key];
					const viewValue = viewData[key];

					if (value !== viewValue) {
						switch (key) {
							case "attributes": {
								for (const keyAttribute in value) {
									const valueAttribute = value[keyAttribute];

									if (!(keyAttribute in viewValue) || valueAttribute !== viewValue[keyAttribute]) {
										view.setAttribute(keyAttribute, valueAttribute);
									}
								}

								for (const keyAttribute in viewValue) {
									if (!(keyAttribute in value)) {
										view.removeAttribute(keyAttribute);
									}
								}

								break;
							}
							case "style": {
								const viewStyle = view.style;

								for (const keyStyle in value) {
									const valueStyle = value[keyStyle];

									if (!(keyStyle in viewValue) || valueStyle !== viewValue[keyStyle]) {
										viewStyle[keyStyle] = valueStyle;
									}
								}

								for (const keyStyle in viewValue) {
									if (!(keyStyle in value)) {
										viewStyle[keyStyle] = "";
									}
								}

								break;
							}
							case "class": {
								view.className = value;

								break;
							}
							case "for": {
								view.htmlFor = value;

								break;
							}
							default: {
								const keyFirst = key[0];

								if (keyFirst === "*") {
									const reference = references[name][key];
									const referenceKey = reference.key;

									view[referenceKey] = value.get(m);

									if (value.value !== viewValue.value) {
										view.MoonReferenceEvents[reference.event] = referenceHandler(value.set, view, referenceKey);
									}
								} else if (keyFirst === "o" && key[1] === "n") {
									view[key.toLowerCase()] = event(value);
								} else {
									view[key] = value;
								}
							}
						}
					}
				} else {
					viewDataCreate(view, name, key, data[key], m);
				}
			}

			for (const key in viewData) {
				if (!(key in data)) {
					switch (key) {
						case "attributes": {
							for (const keyAttribute in viewData.attributes) {
								view.removeAttribute(keyAttribute);
							}

							break;
						}
						case "class": {
							view.className = "";

							break;
						}
						case "for": {
							view.htmlFor = "";

							break;
						}
						default: {
							const keyFirst = key[0];

							if (keyFirst === "*") {
								const reference = references[name][key];
								const referenceKey = reference.key;
								const referenceEvent = reference.event;
								const viewReferenceEvents = view.MoonReferenceEvents;

								view[referenceKey] = viewDataDefault(name, referenceKey);
								viewReferenceEvents[referenceEvent] = null;
								view.removeEventListener(referenceEvent, viewReferenceEvents);
							} else if (keyFirst === "o" && key[1] === "n") {
								view[key.toLowerCase()] = null;
							} else {
								view[key] = viewDataDefault(name, key);
							}
						}
					}
				}
			}
		}
	}

	return m;
}

function elementChildren(children, m) {
	const view = m.view;
	let viewChildren = view.MoonChildren;

	if (viewChildren === null) {
		viewChildren = view.MoonChildren = [];

		for (let i = 0; i < children.length; i++) {
			m.view = viewEmpty;
			m = children[i](m);
			viewChildren.push(view.appendChild(m.view));
		}
	} else {
		const childrenLength = children.length;
		const viewChildrenLength = viewChildren.length;
		let i = 0;

		if (childrenLength === viewChildrenLength) {
			for (; i < childrenLength; i++) {
				const viewChild = m.view = viewChildren[i];
				m = children[i](m);
				const viewChildNew = m.view;

				if (viewChildNew !== viewChild) {
					view.replaceChild(viewChildNew, viewChild);
					viewChildren[i] = viewChildNew;
				}
			}
		} else if (childrenLength < viewChildrenLength) {
			for (; i < childrenLength; i++) {
				const viewChild = m.view = viewChildren[i];
				m = children[i](m);
				const viewChildNew = m.view;

				if (viewChildNew !== viewChild) {
					view.replaceChild(viewChildNew, viewChild);
					viewChildren[i] = viewChildNew;
				}
			}

			for (; i < viewChildrenLength; i++) {
				view.removeChild(viewChildren.pop());
			}
		} else {
			for (; i < viewChildrenLength; i++) {
				const viewChild = m.view = viewChildren[i];
				m = children[i](m);
				const viewChildNew = m.view;

				if (viewChildNew !== viewChild) {
					view.replaceChild(viewChildNew, viewChild);
					viewChildren[i] = viewChildNew;
				}
			}

			for (; i < childrenLength; i++) {
				m.view = viewEmpty;
				m = children[i](m);
				viewChildren.push(view.appendChild(m.view));
			}
		}
	}

	m.view = view;

	return m;
}

function elementOld(name) {
	return data => children => m => elementChildren(children, elementNameData(name, data, m));
}

/**
 * Empty children
 */
const childrenEmpty = [];

/**
 * Element component
 */
export function element(name) {
	return data => m => {
		let children;

		if ("children" in data) {
			const dataChildren = data.children;
			children = [];

			for (let i = 0; i < dataChildren.length; i++) {
				m = dataChildren[i](m);
				children.push(m.view);
			}
		} else {
			children = childrenEmpty;
		}

		m.view = new View(name, data, children);

		return m;
	};
}

/**
 * Empty element component
 */
export function elementEmpty(name) {
	return data => m => {
		m.view = new View(name, data, childrenEmpty);

		return m;
	};
}

/**
 * Element component
 */
export function element2(name) {
	return data => m => {
		const view = m.view;

		if (view === viewEmpty) {
			m.view = viewCreate(name, data);
		} else if (name !== view.name) {
			const viewNew = viewCreate(name, data);
			const viewNode = view.node;
			view.name = name;
			view.data = data;
			view.children = viewNew.children;
			const node = view.node = viewNew.node;

			viewNode.parentNode.replaceChild(node, viewNode);
		} else {
			const viewData = view.data;

			if (data === viewData) {
				if ("children" in data) {
					const dataChildren = data.children;
					const viewChildren = view.children;

					for (let i = 0; i < dataChildren.length; i++) {
						m.view = viewChildren[i];
						m = dataChildren[i](m);
						viewChildren[i] = m.view;
					}

					m.view = view;
				}
			}
		}

		m.view = new View(name, data, childrenViews);

		return m;
	};
}
