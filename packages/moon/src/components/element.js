import event from "moon/src/event";

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

/**
 * View Data Property Defaults
 */
const viewDataDefaults = {};

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
 * Element component
 */
export default name => data => m => {
	let view = m.view;
	const viewName = view.MoonName;
	const viewData = view.MoonData;

	if (name !== viewName) {
		// If there is no view or the name changed, create a new view from
		// scratch.
		if (name === "text") {
			view = document.createTextNode("");
		} else {
			view = document.createElement(name);
		}

		// Create data properties.
		for (const key in data) {
			const value = data[key];
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
					case "children": {
						for (let i = 0; i < value.length; i++) {
							m.view = viewEmpty;
							m = value[i](m);

							view.appendChild(m.view);
						}

						break;
					}
					default: {
						view[key] = value;
					}
				}
			}
		}

		// Store name and data in cache for faster operations.
		view.MoonName = name;
		view.MoonData = data;
	} else if (data === viewData) {
		// If nothing changed, only run any children to transform the state. They
		// can't be skipped because they are functions of `m`, so them being the
		// same as last time doesn't imply they will have the same output.
		if ("children" in data) {
			const children = data.children;
			let viewChild = m.view = view.firstChild;

			for (let i = 0; i < children; i++) {
				m = children[i](m);
				const viewChildNew = m.view;

				if (viewChildNew !== viewChild) {
					view.replaceChild(viewChildNew, viewChild);
				}

				viewChild = m.view = viewChildNew.nextSibling;
			}
		}
	} else {
		// If the data doesn't match, update the view data and its cache.
		view.MoonData = data;

		for (const key in data) {
			const value = data[key];

			if (key in viewData) {
				// Update data property.
				const viewValue = viewData[key];

				if (key === "children") {
					// Children are updated even if they are the same as last time.
					const valueLength = value.length;
					const viewValueLength = viewValue.length;
					let viewChild = m.view = view.firstChild;
					let i = 0;

					if (valueLength === viewValueLength) {
						for (; i < valueLength; i++) {
							m = value[i](m);
							const viewChildNew = m.view;

							if (viewChildNew !== viewChild) {
								view.replaceChild(viewChildNew, viewChild);
							}

							viewChild = m.view = viewChildNew.nextSibling;
						}
					} else if (valueLength < viewValueLength) {
						for (; i < valueLength; i++) {
							m = value[i](m);
							const viewChildNew = m.view;

							if (viewChild !== viewChildNew) {
								view.replaceChild(viewChildNew, viewChild);
							}

							viewChild = m.view = viewChildNew.nextSibling;
						}

						for (; i < viewValueLength; i++) {
							view.removeChild(view.lastChild);
						}
					} else {
						for (; i < viewValueLength; i++) {
							m = value[i](m);
							const viewChildNew = m.view;

							if (viewChild !== viewChildNew) {
								view.replaceChild(viewChildNew, viewChild);
							}

							viewChild = m.view = viewChildNew.nextSibling;
						}

						for (; i < valueLength; i++) {
							m.view = viewEmpty;
							m = value[i](m);

							view.appendChild(m.view);
						}
					}
				} else if (value !== viewValue) {
					// Other properties are updated if they haven't changed.
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
								view[key] = value;
							}
						}
					}
				}
			} else {
				// Create data property.
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
						case "children": {
							for (let i = 0; i < value.length; i++) {
								m.view = viewEmpty;
								m = value[i](m);

								view.appendChild(m.view);
							}

							break;
						}
						default: {
							view[key] = value;
						}
					}
				}
			}
		}

		// Remove data properties.
		for (const key in viewData) {
			if (!(key in data)) {
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
						case "children": {
							const viewChildrenLength = viewData.children.length;

							for (let i = 0; i < viewChildrenLength; i++) {
								view.removeChild(view.lastChild);
							}

							break;
						}
						default: {
							view[key] = viewDataDefault(name, key);
						}
					}
				}
			}
		}
	}

	m.view = view;

	return m;
};
