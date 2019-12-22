/**
 * Moon v1.0.0-beta.4
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
	 * @param {object} driversNew
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
	 * @param {function} root
	 * @param {object} drivers
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

	/*
	 * Current global data
	 */
	var data;
	/**
	 * Data driver
	 *
	 * The application components are usually a function of data. This data holds
	 * application state. Every time an application is executed, it is passed new
	 * data and returns driver outputs that correspond to it. These driver outputs
	 * should be fast, pure, functions that are cheap to call and easy to optimize
	 * through caching and memoization.
	 */

	var driver = {
		input: function input() {
			// Return the stored data as input.
			return data;
		},
		output: function output(dataNew) {
			// Update the stored data when it is an output.
			data = dataNew;
		}
	};

	var data$1 = {
		driver: driver
	};

	/**
	 * View Node Constructor
	 *
	 * @param {string} name
	 * @param {object} data
	 */
	function ViewNode(name, data) {
		this.name = name;
		this.data = data;
	}

	/**
	 * Cache for default property values
	 */
	var removeDataPropertyCache = {};
	/**
	 * Remove a data property.
	 *
	 * @param {object} element
	 * @param {string} key
	 */

	function removeDataProperty(element, name, key) {
		element[key] = name in removeDataPropertyCache ? removeDataPropertyCache[name][key] : (removeDataPropertyCache[name] = document.createElement(name))[key];
	}

	/**
	 * Current view event data
	 */

	var viewEvent = null;
	/**
	 * Current view node
	 */

	var viewOld;
	/**
	 * Current view element
	 */

	var viewOldElement;
	/**
	 * Moon event
	 *
	 * This is used as a global event handler for any event type, and it runs the
	 * corresponding handler with the event data as view driver input.
	 */

	function MoonEvent() {}

	MoonEvent.prototype.handleEvent = function (viewEventNew) {
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
		var nodeName = node.name;

		if (nodeName === "text") {
			// Create a text node using the text content from the default key.
			return document.createTextNode(node.data.data);
		} else {
			// Create a DOM element.
			var element = document.createElement(nodeName); // Set data.

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
				} else {
					switch (key) {
						case "ariaset":
							{
								// Set aria-* attributes.
								for (var valueKey in value) {
									element.setAttribute("aria-" + valueKey, value[valueKey]);
								}

								break;
							}

						case "dataset":
							{
								// Set data-* attributes.
								var elementDataset = element.dataset;

								for (var _valueKey in value) {
									elementDataset[_valueKey] = value[_valueKey];
								}

								break;
							}

						case "style":
							{
								// Set style properties.
								var elementStyle = element.style;

								for (var _valueKey2 in value) {
									elementStyle[_valueKey2] = value[_valueKey2];
								}

								break;
							}

						case "focus":
							{
								// Set focus if needed. Blur isn't set because it's the
								// default.
								if (value) {
									element.focus();
								}

								break;
							}

						case "class":
							{
								// Set a className property.
								element.className = value;
								break;
							}

						case "for":
							{
								// Set an htmlFor property.
								element.htmlFor = value;
								break;
							}

						case "children":
							{
								// Recursively append children.
								var elementMoonChildren = element.MoonChildren = [];

								for (var i = 0; i < value.length; i++) {
									var elementChild = viewCreate(value[i]);
									elementMoonChildren.push(elementChild);
									element.appendChild(elementChild);
								}

								break;
							}

						default:
							{
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
		var nodeOldData = nodeOld.data;
		var nodeNewData = nodeNew.data; // First, go through all new data and update all of the existing data to
		// match.

		for (var keyNew in nodeNewData) {
			var valueOld = nodeOldData[keyNew];
			var valueNew = nodeNewData[keyNew];

			if (valueOld !== valueNew) {
				if (keyNew.charCodeAt(0) === 64) {
					// Update an event.
					var nodeOldElementMoonEvent = nodeOldElement.MoonEvent;

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
							{
								// Update aria-* attributes.
								if (valueOld === undefined) {
									for (var valueNewKey in valueNew) {
										nodeOldElement.setAttribute("aria-" + valueNewKey, valueNew[valueNewKey]);
									}
								} else {
									for (var _valueNewKey in valueNew) {
										var valueNewValue = valueNew[_valueNewKey];

										if (valueOld[_valueNewKey] !== valueNewValue) {
											nodeOldElement.setAttribute("aria-" + _valueNewKey, valueNewValue);
										}
									} // Remove aria-* attributes from the old value that are
									// not in the new value.


									for (var valueOldKey in valueOld) {
										if (!(valueOldKey in valueNew)) {
											nodeOldElement.removeAttribute("aria-" + valueOldKey);
										}
									}
								}

								break;
							}

						case "dataset":
							{
								// Update data-* attributes.
								var nodeOldElementDataset = nodeOldElement.dataset;

								if (valueOld === undefined) {
									for (var _valueNewKey2 in valueNew) {
										nodeOldElementDataset[_valueNewKey2] = valueNew[_valueNewKey2];
									}
								} else {
									for (var _valueNewKey3 in valueNew) {
										var _valueNewValue = valueNew[_valueNewKey3];

										if (valueOld[_valueNewKey3] !== _valueNewValue) {
											nodeOldElementDataset[_valueNewKey3] = _valueNewValue;
										}
									} // Remove data-* attributes from the old value that are
									// not in the new value.


									for (var _valueOldKey in valueOld) {
										if (!(_valueOldKey in valueNew)) {
											delete nodeOldElementDataset[_valueOldKey];
										}
									}
								}

								break;
							}

						case "style":
							{
								// Update style properties.
								var nodeOldElementStyle = nodeOldElement.style;

								if (valueOld === undefined) {
									for (var _valueNewKey4 in valueNew) {
										nodeOldElementStyle[_valueNewKey4] = valueNew[_valueNewKey4];
									}
								} else {
									for (var _valueNewKey5 in valueNew) {
										var _valueNewValue2 = valueNew[_valueNewKey5];

										if (valueOld[_valueNewKey5] !== _valueNewValue2) {
											nodeOldElementStyle[_valueNewKey5] = _valueNewValue2;
										}
									} // Remove style properties from the old value that are not
									// in the new value.


									for (var _valueOldKey2 in valueOld) {
										if (!(_valueOldKey2 in valueNew)) {
											nodeOldElementStyle[_valueOldKey2] = "";
										}
									}
								}

								break;
							}

						case "focus":
							{
								// Update focus/blur.
								if (valueNew) {
									nodeOldElement.focus();
								} else {
									nodeOldElement.blur();
								}

								break;
							}

						case "class":
							{
								// Update a className property.
								nodeOldElement.className = valueNew;
								break;
							}

						case "for":
							{
								// Update an htmlFor property.
								nodeOldElement.htmlFor = valueNew;
								break;
							}

						case "children":
							{
								// Update children.
								var valueNewLength = valueNew.length;

								if (valueOld === undefined) {
									// If there were no old children, create new children.
									var nodeOldElementMoonChildren = nodeOldElement.MoonChildren = [];

									for (var i = 0; i < valueNewLength; i++) {
										var nodeOldElementChild = viewCreate(valueNew[i]);
										nodeOldElementMoonChildren.push(nodeOldElementChild);
										nodeOldElement.appendChild(nodeOldElementChild);
									}
								} else {
									var valueOldLength = valueOld.length;

									if (valueOldLength === valueNewLength) {
										// If the children have the same length then update
										// both as usual.
										var _nodeOldElementMoonChildren = nodeOldElement.MoonChildren;

										for (var _i = 0; _i < valueOldLength; _i++) {
											var valueOldNode = valueOld[_i];
											var valueNewNode = valueNew[_i];

											if (valueOldNode !== valueNewNode) {
												if (valueOldNode.name === valueNewNode.name) {
													viewPatch(valueOldNode, _nodeOldElementMoonChildren[_i], valueNewNode);
												} else {
													var valueOldElementNew = viewCreate(valueNewNode);
													nodeOldElement.replaceChild(valueOldElementNew, _nodeOldElementMoonChildren[_i]);
													_nodeOldElementMoonChildren[_i] = valueOldElementNew;
												}
											}
										}
									} else if (valueOldLength > valueNewLength) {
										// If there are more old children than new children,
										// update the corresponding ones and remove the extra
										// old children.
										var _nodeOldElementMoonChildren2 = nodeOldElement.MoonChildren;

										for (var _i2 = 0; _i2 < valueNewLength; _i2++) {
											var _valueOldNode = valueOld[_i2];
											var _valueNewNode = valueNew[_i2];

											if (_valueOldNode !== _valueNewNode) {
												if (_valueOldNode.name === _valueNewNode.name) {
													viewPatch(_valueOldNode, _nodeOldElementMoonChildren2[_i2], _valueNewNode);
												} else {
													var _valueOldElementNew = viewCreate(_valueNewNode);

													nodeOldElement.replaceChild(_valueOldElementNew, _nodeOldElementMoonChildren2[_i2]);
													_nodeOldElementMoonChildren2[_i2] = _valueOldElementNew;
												}
											}
										}

										for (var _i3 = valueNewLength; _i3 < valueOldLength; _i3++) {
											nodeOldElement.removeChild(_nodeOldElementMoonChildren2.pop());
										}
									} else {
										// If there are more new children than old children,
										// update the corresponding ones and append the extra
										// new children.
										var _nodeOldElementMoonChildren3 = nodeOldElement.MoonChildren;

										for (var _i4 = 0; _i4 < valueOldLength; _i4++) {
											var _valueOldNode2 = valueOld[_i4];
											var _valueNewNode2 = valueNew[_i4];

											if (_valueOldNode2 !== _valueNewNode2) {
												if (_valueOldNode2.name === _valueNewNode2.name) {
													viewPatch(_valueOldNode2, _nodeOldElementMoonChildren3[_i4], _valueNewNode2);
												} else {
													var _valueOldElementNew2 = viewCreate(_valueNewNode2);

													nodeOldElement.replaceChild(_valueOldElementNew2, _nodeOldElementMoonChildren3[_i4]);
													_nodeOldElementMoonChildren3[_i4] = _valueOldElementNew2;
												}
											}
										}

										for (var _i5 = valueOldLength; _i5 < valueNewLength; _i5++) {
											var _nodeOldElementChild = viewCreate(valueNew[_i5]);

											_nodeOldElementMoonChildren3.push(_nodeOldElementChild);

											nodeOldElement.appendChild(_nodeOldElementChild);
										}
									}
								}

								break;
							}

						default:
							{
								// Update a DOM property.
								nodeOldElement[keyNew] = valueNew;
							}
					}
				}
			}
		} // Next, go through all of the old data and remove data that isn't in the
		// new data.


		var nodeOldName = nodeOld.name;

		for (var keyOld in nodeOldData) {
			if (!(keyOld in nodeNewData)) {
				if (keyOld.charCodeAt(0) === 64) {
					// Remove an event.
					var _nodeOldElementMoonEvent = nodeOldElement.MoonEvent;
					delete _nodeOldElementMoonEvent[keyOld];
					nodeOldElement.removeEventListener(keyOld.slice(1), _nodeOldElementMoonEvent);
				} else {
					switch (keyOld) {
						case "ariaset":
							{
								// Remove aria-* attributes.
								var _valueOld = nodeOldData.ariaset;

								for (var _valueOldKey3 in _valueOld) {
									nodeOldElement.removeAttribute("aria-" + _valueOldKey3);
								}

								break;
							}

						case "dataset":
							{
								// Remove data-* attributes.
								var _valueOld2 = nodeOldData.dataset;
								var _nodeOldElementDataset = nodeOldElement.dataset;

								for (var _valueOldKey4 in _valueOld2) {
									delete _nodeOldElementDataset[_valueOldKey4];
								}

								break;
							}

						case "focus":
							{
								// Remove focus.
								nodeOldElement.blur();
								break;
							}

						case "class":
							{
								// Remove a className property.
								nodeOldElement.className = "";
								break;
							}

						case "for":
							{
								// Remove an htmlFor property.
								nodeOldElement.htmlFor = "";
								break;
							}

						case "children":
							{
								// Remove children.
								var _valueOldLength = nodeOldData.children.length;
								var _nodeOldElementMoonChildren4 = nodeOldElement.MoonChildren;

								for (var _i6 = 0; _i6 < _valueOldLength; _i6++) {
									nodeOldElement.removeChild(_nodeOldElementMoonChildren4.pop());
								}

								break;
							}

						default:
							{
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


	function driver$1(viewOldElementNew) {
		// Accept query strings as well as DOM elements.
		if (typeof viewOldElementNew === "string") {
			viewOldElement = document.querySelector(viewOldElementNew);
		} else {
			viewOldElement = viewOldElementNew;
		} // Capture old data from the root element's attributes.


		var viewOldElementAttributes = viewOldElement.attributes;
		var viewOldData = {};

		for (var i = 0; i < viewOldElementAttributes.length; i++) {
			var viewOldElementAttribute = viewOldElementAttributes[i];
			viewOldData[viewOldElementAttribute.name] = viewOldElementAttribute.value;
		} // Create a node from the root element.


		viewOld = new ViewNode(viewOldElement.tagName.toLowerCase(), viewOldData);
		return {
			input: function input() {
				// Return the current event data as input.
				return viewEvent;
			},
			output: function output(viewNew) {
				// When given a new view, patch the old element to match the new node
				// using the old node as reference.
				if (viewOld.name === viewNew.name) {
					// If the root views have the same name, patch their data.
					viewPatch(viewOld, viewOldElement, viewNew);
				} else {
					// If they have different names, create a new old view element.
					var _viewOldElementNew = viewCreate(viewNew); // Manipulate the DOM to replace the old view.


					viewOldElement.parentNode.replaceChild(_viewOldElementNew, viewOldElement); // Update the reference to the old view element.

					viewOldElement = _viewOldElementNew;
				} // Store the new view as the old view to be used as reference during a
				// patch.


				viewOld = viewNew;
			}
		};
	}

	/**
	 * HTML tag names
	 */

	var names = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "image", "img", "input", "ins", "isindex", "kbd", "keygen", "label", "legend", "li", "link", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meta", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "text", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr", "xmp"];
	/**
	 * Node creation functions.
	 */

	var m = {
		node: function node(name) {
			return function (data) {
				return new ViewNode(name, data);
			};
		}
	};

	var _loop = function _loop(i) {
		var name = names[i];

		m[name] = function (data) {
			return new ViewNode(name, data);
		};
	};

	for (var i = 0; i < names.length; i++) {
		_loop(i);
	}

	var view = {
		driver: driver$1,
		m: m
	};

	/**
	 * Time driver
	 *
	 * The time driver provides time information as input. For output, it takes an
	 * object mapping timeouts to functions, and runs those functions after those
	 * timeouts. This can be used to implement intervals through a recursive
	 * timeout function.
	 */

	var driver$2 = {
		input: function input() {
			// Return the time as input.
			return Date.now();
		},
		output: function output(timeouts) {
			var _loop = function _loop(delay) {
				setTimeout(function () {
					run(timeouts[delay]);
				}, delay);
			};

			// Set the given timeouts.
			for (var delay in timeouts) {
				_loop(delay);
			}
		}
	};

	var time = {
		driver: driver$2
	};

	/*
	 * Current global response
	 */

	var response = null;
	/*
	 * Match HTTP headers.
	 */

	var headerRE = /^([^:]+):\s*([^]*?)\s*$/gm;
	/**
	 * HTTP driver
	 *
	 * The HTTP driver provides HTTP response information as input. For output, it
	 * takes an array of requests. Multiple HTTP requests can be implemented with
	 * multiple request in the array, and subsequent HTTP requests can be
	 * implemented with another HTTP request once a response is received.
	 */

	var driver$3 = {
		input: function input() {
			// Return the response as output.
			return response;
		},
		output: function output(requests) {
			var _loop = function _loop(i) {
				var request = requests[i];
				var xhr = new XMLHttpRequest(); // Handle response types.

				xhr.responseType = "responseType" in request ? request.responseType : "text"; // Handle load event.

				xhr.onload = function () {
					var responseHeaders = {};
					var responseHeadersText = xhr.getAllResponseHeaders();
					var responseHeader; // Parse headers to object.

					while ((responseHeader = headerRE.exec(responseHeadersText)) !== null) {
						responseHeaders[responseHeader[1]] = responseHeader[2];
					} // Create response object.


					response = {
						status: xhr.status,
						headers: responseHeaders,
						body: xhr.response
					}; // Run load event handler if it exists.

					if ("onLoad" in request) {
						run(request.onLoad);
					}
				}; // Handle error event.


				xhr.onerror = function () {
					// Reset response to prevent older response from being available.
					response = null; // Run error event handler if it exists.

					if ("onError" in request) {
						run(request.onError);
					}
				}; // Open the request with the given method and URL.


				xhr.open("method" in request ? request.method : "GET", request.url); // Set request headers.

				if ("headers" in request) {
					var requestHeaders = request.headers;

					for (var requestHeader in requestHeaders) {
						xhr.setRequestHeader(requestHeader, requestHeaders[requestHeader]);
					}
				} // Send the request with the given body.


				xhr.send("body" in request ? request.body : null);
			};

			// Make the HTTP requests.
			for (var i = 0; i < requests.length; i++) {
				_loop(i);
			}
		}
	};

	var http = {
		driver: driver$3
	};

	/**
	 * Current route
	 */
	var route = location.pathname;
	/**
	 * Route driver
	 *
	 * The route driver provides current route path as input. For output, it takes
	 * a new route as a string and changes the route in the browser as a result. It
	 * also provides a router component that can be used to display different views
	 * based on the current route.
	 */

	var driver$4 = {
		input: function input() {
			// Return the current route as input.
			return route;
		},
		output: function output(routeNew) {
			// Change the browser route to the new route given as output.
			route = routeNew;
			history.pushState(null, "", route);
		}
	};

	/**
	 * Returns a view given routes that map to views and the current route.
	 *
	 * @param {object} data
	 * @returns {object} view
	 */
	function router(data) {
		var route = data.route;
		var routeSegment = "/";
		var routes = data.routes;

		for (var i = 1; i < route.length; i++) {
			var routeCharacter = route[i];

			if (routeCharacter === "/") {
				routes = (routeSegment in routes ? routes[routeSegment] : routes["/*"])[1];
				routeSegment = "/";
			} else {
				routeSegment += routeCharacter;
			}
		}

		return (routeSegment in routes ? routes[routeSegment] : routes["/*"])[0](data);
	}

	var route$1 = {
		driver: driver$4,
		router: router
	};

	var index = {
		data: data$1,
		http: http,
		route: route$1,
		run: run,
		time: time,
		use: use,
		view: view
	};

	return index;
}));
