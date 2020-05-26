import event from "moon/src/event";

/**
 * Empty view
 */
const viewEmpty = document.createTextNode("");
viewEmpty.MoonName = "text";
viewEmpty.MoonData = {};

/**
 * View Data Property Defaults
 */
const viewDataDefault = {};

/**
 * Element component
 */
export default name => data => m => {
	let view = m.view;
	const viewName = view.MoonName;
	const viewData = view.MoonData;

	if (view === viewEmpty || name !== viewName) {
		// If there is no view or the name changed, create a new view from
		// scratch.
		if (name === "text") {
			view = document.createTextNode(data.data);
		} else {
			view = document.createElement(name);

			// Create data properties.
			for (const key in data) {
				const value = data[key];

				if (key[0] === "o" && key[1] === "n") {
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

				viewChild = m.view = viewChild.nextSibling;
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

							viewChild = m.view = viewChild.nextSibling;
						}
					} else if (valueLength < viewValueLength) {
						for (; i < valueLength; i++) {
							m = value[i](m);
							const viewChildNew = m.view;

							if (viewChild !== viewChildNew) {
								view.replaceChild(viewChildNew, viewChild);
							}

							viewChild = m.view = viewChild.nextSibling;
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

							viewChild = m.view = viewChild.nextSibling;
						}

						for (; i < valueLength; i++) {
							m = value[i](m);

							view.appendChild(m.view);

							m.view = viewEmpty;
						}
					}
				} else if (value !== viewValue) {
					// Other properties are updated if they haven't changed.
					if (key[0] === "o" && key[1] === "n") {
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
				if (key[0] === "o" && key[1] === "n") {
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
				if (key[0] === "o" && key[1] === "n") {
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
							view[key] = (
								viewName in viewDataDefault ?
									viewDataDefault[viewName] :
									(
										viewDataDefault[viewName] =
											viewName === "text" ?
												document.createTextNode("") :
												document.createElement(viewName)
									)
							)[key];
						}
					}
				}
			}
		}
	}

	m.view = view;

	return m;
};
