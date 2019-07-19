/**
 * Moon v1.0.0-beta.3
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
(function(root, factory) {
	if (typeof module === "undefined") {
		root.Moon = factory();
	} else {
		module.exports = factory();
	}
}(this, function() {
	"use strict";

	/**
	 * Data driver
	 *
	 * The application components are usually a function of data. This data holds
	 * application state. Every time an application is executed, it is passed new
	 * data and returns driver outputs that correspond to it. These driver outputs
	 * should be fast, pure, functions that are cheap to call and easy to optimize
	 * through caching and memoization.
	 */
	function driver(data) {
		return {
			input: function input() {
				// Return the stored data as input.
				return data;
			},
			output: function output(dataNew) {
				// Update the stored data when it is an output.
				data = dataNew;
			}
		};
	}

	var data = {
		driver: driver
	};

	/**
	 * View node types.
	 */
	var types = {
		element: 0,
		text: 1
	};
	/**
	 * Logs an error message to the console.
	 * @param {string} message
	 */

	function error(message) {
		console.error("[Moon] ERROR: " + message);
	}

	/**
	 * Application drivers
	 */

	var drivers;
	/**
	 * Sets the application drivers to new drivers.
	 *
	 * @param {Object} driversNew
	 */

	function use(driversNew) {
		// Handle invalid drivers type.
		if ("development" === "development" && typeof driversNew !== "object") {
			error("Drivers parameter with an invalid type.\n\nAttempted to store the \"drivers\" parameter for use during execution.\n\nReceived an invalid drivers argument:\n\t" + driversNew + "\n\n\tThe given drivers have an invalid type:\n\t\t" + typeof driversNew + "\n\nExpected the drivers to be an object with keys as driver names and values as drivers.");
		}

		drivers = driversNew;
	}

	/**
	 * Run
	 *
	 * Creates a new Moon application based on a root application and drivers. A
	 * Moon application takes inputs and returns outputs -- it's just a function.
	 * The input and output effects are created by drivers, individual modules
	 * responsible for controlling the outside world. Ideally, these would be
	 * standard and implemented by the browser, operating system, and computer
	 * itself.
	 *
	 * Drivers control things like state data, the DOM view, timing events,
	 * animation frames, HTTP requests, dates, audio, etc. They are all implemented
	 * separately from Moon, but Moon comes with some drivers by default. A driver
	 * is an object with input and output functions. The input function reads data
	 * from the outside world and returns it, while the output function takes the
	 * driver output returned by the application and performs effects on the
	 * outside world.
	 *
	 * Instead of components, Moon views are just functions. They usually take a
	 * `data` object as a parameter and return Moon elements, but can technically
	 * be implemented with any structure.
	 *
	 * When events occur, they are detected by the application, and it returns the
	 * value of an event handler instead. These happen with events from any driver.
	 * Event handlers are applications as well, but since everything is a function,
	 * they can use the root application within their own implementation.
	 *
	 * Essentially, Moon aims to remove unnecessary abstractions like local state,
	 * imperative event handlers, or reactive state subscriptions. Instead, it
	 * embraces a purely functional approach with support for drivers to interact
	 * with the imperative API often offered by the containing environment.
	 *
	 * The application runs on the Moon while drivers update the Earth.
	 *
	 * @param {Function} root
	 * @param {Object} drivers
	 */

	function run(root) {
		// Handle invalid root type.
		if ("development" === "development" && typeof root !== "function") {
			error("Root parameter with an invalid type.\n\nAttempted to execute the \"root\" parameter as an application.\n\nReceived an invalid root argument:\n\t" + root + "\n\n\tThe given root has an invalid type:\n\t\t" + typeof root + "\n\nExpected the root to be a function that takes driver inputs as parameters and returns driver outputs.");
		} // Get inputs from all drivers.


		var input = {};

		for (var driver in drivers) {
			if ("development" === "development" && !("input" in drivers[driver])) {
				error("Use of a driver without an \"input\" function.\n\nAttempted to execute a driver to receive inputs:\n\t" + driver + "\n\nReceived a driver without an \"input\" function:\n\t" + drivers[driver] + "\n\nExpected the driver to be an object with \"input\" and \"output\" functions.");
			}

			input[driver] = drivers[driver].input();
		} // Get the application output.


		var output = root(input); // Execute drivers with the outputs.

		for (var _driver in output) {
			if ("development" === "development" && !(_driver in drivers)) {
				error("Use of an unknown driver.\n\nAttempted to execute an application function:\n\t" + root.name + "\n\n\tThe function attempted to output to a driver:\n\t\t" + _driver + ": " + drivers[_driver] + "\n\nReceived an undefined value when fetching the driver from the given drivers.\n\nExpected the driver to be defined.");
			}

			if ("development" === "development" && !("output" in drivers[_driver])) {
				error("Use of a driver without an \"output\" function.\n\nAttempted to execute a driver to receive outputs:\n\t" + _driver + "\n\nReceived a driver without an \"output\" function:\n\t" + drivers[_driver] + "\n\nExpected the driver to be an object with \"input\" and \"output\" functions.");
			}

			drivers[_driver].output(output[_driver]);
		}
	}

	/**
	 * Old Node Constructor
	 */
	function NodeOld(node, element, children) {
		this.node = node;
		this.element = element;
		this.children = children;
	}

	/**
	 * New Node Constructor
	 */
	function NodeNew(type, name, data, children) {
		this.type = type;
		this.name = name;
		this.data = data;
		this.children = children;
	}

	/**
	 * Cache for default property values
	 */
	var removeDataPropertyCache = {};
	/**
	 * Update an ariaset, dataset, or style property.
	 *
	 * @param {Object} element
	 * @param {string} key
	 * @param {Object} value
	 */

	function updateDataSet(element, key, value) {
		if (key === "ariaset") {
			// Set aria-* attributes.
			for (var setKey in value) {
				element.setAttribute("aria-" + setKey, value[setKey]);
			}
		} else {
			// Set data-* and style attributes.
			var set = element[key];

			for (var _setKey in value) {
				set[_setKey] = value[_setKey];
			}
		}
	}
	/**
	 * Remove a data property.
	 *
	 * @param {Object} element
	 * @param {string} key
	 */

	function removeDataProperty(element, name, key) {
		element[key] = name in removeDataPropertyCache ? removeDataPropertyCache[name][key] : (removeDataPropertyCache[name] = document.createElement(name))[key];
	}
	/**
	 * Remove all the keys from an ariaset, dataset, or style property that aren't
	 * in `exclude`.
	 *
	 * @param {Object} element
	 * @param {string} key
	 * @param {string} value
	 * @param {Object} exclude
	 */

	function removeDataSet(element, key, value, exclude) {
		for (var setKey in value) {
			if (!(setKey in exclude)) {
				switch (key) {
					case "ariaset":
						element.removeAttribute("aria-" + setKey);
						break;

					case "dataset":
						delete element.dataset[setKey];
						break;

					default:
						element.style[setKey] = "";
				}
			}
		}
	}

	/**
	 * Current view event data
	 */

	var viewEvent;
	/**
	 * Moon event
	 *
	 * This is used as a global event handler for any event type, and it calls the
	 * corresponding handler with the event, data, and children.
	 */

	function MoonEvent() {}

	MoonEvent.prototype.handleEvent = function (viewEventNew) {
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
		var children = [];
		var element;

		if (node.type === types.text) {
			// Create a text node using the text content from the default key.
			element = document.createTextNode(node.data[""]);
		} else {
			// Create a DOM element.
			element = document.createElement(node.name); // Recursively append children.

			var nodeChildren = node.children;

			for (var i = 0; i < nodeChildren.length; i++) {
				var childOld = viewCreate(nodeChildren[i]);
				children.push(childOld);
				element.appendChild(childOld.element);
			} // Set data.


			var nodeData = node.data;

			for (var key in nodeData) {
				var value = nodeData[key];

				if (key.charCodeAt(0) === 64) {
					// Set an event listener.
					var elementMoonEvent = element.MoonEvent;

					if (elementMoonEvent === null) {
						elementMoonEvent = element.MoonEvent = new MoonEvent();
					}

					elementMoonEvent[key] = value;
					element.addEventListener(key.slice(1), elementMoonEvent);
				} else if (key === "ariaset" || key === "dataset" || key === "style") {
					// Set aria-*, data-*, and style attributes.
					updateDataSet(element, key, value);
				} else {
					// Set an attribute.
					element[key] = value;
				}
			}
		} // Return an old node with a reference to the immutable node and mutable
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
		var nodeOldNode = nodeOld.node;

		if (nodeOldNode !== nodeNew) {
			var nodeOldNodeType = nodeOldNode.type;
			var nodeOldNodeName = nodeOldNode.name; // Update the old node reference. This doesn't affect the rest of the
			// patch because it uses `nodeOldNode` instead of direct property access.

			nodeOld.node = nodeNew;

			if (nodeOldNodeType !== nodeNew.type || nodeOldNodeName !== nodeNew.name) {
				// If the types or name aren't the same, then replace the old node
				// with the new one.
				var nodeOldElement = nodeOld.element;
				var nodeOldNew = viewCreate(nodeNew);
				var nodeOldNewElement = nodeOldNew.element;
				nodeOld.element = nodeOldNewElement;
				nodeOld.children = nodeOldNew.children;
				nodeOldElement.parentNode.replaceChild(nodeOldNewElement, nodeOldElement);
			} else if (nodeOldNodeType === types.text) {
				// If they both are text, then update the text content.
				var nodeNewText = nodeNew.data[""];

				if (nodeOldNode.data[""] !== nodeNewText) {
					nodeOld.element.data = nodeNewText;
				}
			} else {
				// If they are both elements, then update the data.
				var nodeOldNodeData = nodeOldNode.data;
				var nodeNewData = nodeNew.data;

				if (nodeOldNodeData !== nodeNewData) {
					// First, go through all new data and update all of the existing data
					// to match.
					var _nodeOldElement = nodeOld.element;

					for (var keyNew in nodeNewData) {
						var valueOld = nodeOldNodeData[keyNew];
						var valueNew = nodeNewData[keyNew];

						if (valueOld !== valueNew) {
							if (keyNew.charCodeAt(0) === 64) {
								// Update an event.
								var nodeOldElementMoonEvent = _nodeOldElement.MoonEvent;

								if (nodeOldElementMoonEvent === null) {
									nodeOldElementMoonEvent = _nodeOldElement.MoonEvent = new MoonEvent();
								}

								if (keyNew in nodeOldElementMoonEvent) {
									// If the event exists, update the existing event handler.
									nodeOldElementMoonEvent[keyNew] = valueNew;
								} else {
									// If the event doesn't exist, add a new event listener.
									nodeOldElementMoonEvent[keyNew] = valueNew;

									_nodeOldElement.addEventListener(keyNew.slice(1), nodeOldElementMoonEvent);
								}
							} else if (keyNew === "ariaset" || keyNew === "dataset" || keyNew === "style") {
								// If it is a set attribute, update all values in the set.
								updateDataSet(_nodeOldElement, keyNew, valueNew);

								if (valueOld !== undefined) {
									// If there was an old set, remove all old set attributes
									// while excluding any new ones that still exist.
									removeDataSet(_nodeOldElement, keyNew, valueOld, valueNew);
								}
							} else {
								// Update a DOM property.
								_nodeOldElement[keyNew] = valueNew;
							}
						}
					} // Next, go through all of the old data and remove data that isn't in
					// the new data.


					for (var keyOld in nodeOldNodeData) {
						if (!(keyOld in nodeNewData)) {
							if (keyOld.charCodeAt(0) === 64) {
								// Remove an event.
								var _nodeOldElementMoonEvent = _nodeOldElement.MoonEvent;
								delete _nodeOldElementMoonEvent[keyOld];

								_nodeOldElement.removeEventListener(keyOld.slice(1), _nodeOldElementMoonEvent);
							} else if (keyOld === "ariaset" || keyOld === "dataset" || keyOld === "style") {
								// If it is a set attribute, remove all old values from the
								// set and exclude nothing.
								removeDataSet(_nodeOldElement, keyOld, nodeOldNodeData[keyOld], {});
							} else {
								// Remove a DOM property.
								removeDataProperty(_nodeOldElement, nodeOldNodeName, keyOld);
							}
						}
					}
				} // Diff children.


				var childrenNew = nodeNew.children;

				if (nodeOldNode.children !== childrenNew) {
					var childrenOld = nodeOld.children;
					var childrenOldLength = childrenOld.length;
					var childrenNewLength = childrenNew.length;

					if (childrenOldLength === childrenNewLength) {
						// If the children have the same length then update both as
						// usual.
						for (var i = 0; i < childrenOldLength; i++) {
							viewPatch(childrenOld[i], childrenNew[i]);
						}
					} else {
						var _nodeOldElement2 = nodeOld.element;

						if (childrenOldLength > childrenNewLength) {
							// If there are more old children than new children, update the
							// corresponding ones and remove the extra old children.
							for (var _i = 0; _i < childrenNewLength; _i++) {
								viewPatch(childrenOld[_i], childrenNew[_i]);
							}

							for (var _i2 = childrenNewLength; _i2 < childrenOldLength; _i2++) {
								_nodeOldElement2.removeChild(childrenOld.pop().element);
							}
						} else {
							// If there are more new children than old children, update the
							// corresponding ones and append the extra new children.
							for (var _i3 = 0; _i3 < childrenOldLength; _i3++) {
								viewPatch(childrenOld[_i3], childrenNew[_i3]);
							}

							for (var _i4 = childrenOldLength; _i4 < childrenNewLength; _i4++) {
								var _nodeOldNew = viewCreate(childrenNew[_i4]);

								childrenOld.push(_nodeOldNew);

								_nodeOldElement2.appendChild(_nodeOldNew.element);
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


	function driver$1(root) {
		// Accept query strings as well as DOM elements.
		if (typeof root === "string") {
			root = document.querySelector(root);
		} // Capture old data from the root element's attributes.


		var rootAttributes = root.attributes;
		var dataOld = {};

		for (var i = 0; i < rootAttributes.length; i++) {
			var rootAttribute = rootAttributes[i];
			dataOld[rootAttribute.name] = rootAttribute.value;
		} // Create an old node from the root element.


		var viewOld = new NodeOld(new NodeNew(types.element, root.tagName.toLowerCase(), dataOld, []), root, []);
		return {
			input: function input() {
				// Return the current event data as input.
				return viewEvent;
			},
			output: function output(viewNew) {
				// When given a new view, patch the old view into the new one,
				// updating the DOM in the process.
				viewPatch(viewOld, viewNew);
			}
		};
	}

	/**
	 * Returns a new node.
	 *
	 * @param {number} type
	 * @param {string} name
	 * @param {Object} data
	 * @param {Array} children
	 */

	function m(type, name, data, children) {
		return new NodeNew(type, name, data, children);
	}

	var view = {
		driver: driver$1,
		m: m
	};

	var index = {
		data: data,
		run: run,
		use: use,
		view: view
	};

	return index;
}));
