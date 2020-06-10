/**
 * Moon v1.0.0-beta.7
 * Copyright 2016-2020 Kabir Shah
 * Released under the MIT License
 * https://moonjs.org
 */
(function(root, factory) {
	if (typeof module === "undefined") {
		root.Moon = factory();
	} else {
		module.exports = factory();
	}
}(this, function() {
	"use strict";

	var m = {};
	function mSet(mNew) {
		m = mNew;
	}

	/**
	 * Global data state.
	 */
	var state = null;
	/**
	 * Data driver
	 */

	var data = {
		get: function get() {
			return state;
		},
		set: function set(data) {
			state = data;
		}
	};

	/**
	 * Return an event handler that runs a component transformer before running the
	 * main component.
	 *
	 * @param {function} component
	 * @returns {function} event handler
	 */

	function event(component) {
		return function () {
			for (var driver in drivers) {
				m[driver] = drivers[driver].get();
			}

			mSet(componentMain(component(m)));

			for (var _driver in drivers) {
				drivers[_driver].set(m[_driver]);
			}
		};
	}

	/**
	 * Caches for performance
	 */

	Node.prototype.MoonChildren = null;
	Node.prototype.MoonReferenceEvents = null;
	/**
	 * Reference event manager
	 */

	function MoonReferenceEvents() {}

	MoonReferenceEvents.prototype.handleEvent = function (event) {
		this[event.type]();
	};
	/**
	 * Reference bind keys and events
	 */

	/*eslint-disable*/


	var referenceProperties = {
		audio: {
			"*currentTime": {
				key: "currentTime",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "timeupdate",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.currentTime);
					});
				}
			},
			"*muted": {
				key: "muted",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "volumechange",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.muted);
					});
				}
			},
			"*paused": {
				key: "paused",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "pause",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.paused);
					});
				}
			},
			"*playbackRate": {
				key: "playbackRate",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "ratechange",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.playbackRate);
					});
				}
			},
			"*volume": {
				key: "volume",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "volumechange",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.volume);
					});
				}
			}
		},
		input: {
			"*checked": {
				key: "checked",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "change",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.checked);
					});
				}
			},
			"*radio": {
				key: "checked",
				value: function value(get, viewNode, viewData) {
					return get === viewData.value;
				},
				event: "change",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewData.value);
					});
				}
			},
			"*value": {
				key: "value",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "input",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.value);
					});
				}
			}
		},
		video: {
			"*currentTime": {
				key: "currentTime",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "timeupdate",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.currentTime);
					});
				}
			},
			"*muted": {
				key: "muted",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "volumechange",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.muted);
					});
				}
			},
			"*paused": {
				key: "paused",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "pause",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.paused);
					});
				}
			},
			"*playbackRate": {
				key: "playbackRate",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "ratechange",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.playbackRate);
					});
				}
			},
			"*volume": {
				key: "volume",
				value: function value(get, viewNode, viewData) {
					return get;
				},
				event: "volumechange",
				handler: function handler(set, viewNode, viewData) {
					return event(function (m) {
						return set(m, viewNode.volume);
					});
				}
			}
		}
	};
	/*eslint-enable*/

	/**
	 * View Data Property Defaults
	 */

	var viewDataDefaults = {};
	/**
	 * View constructor
	 */

	function View(name, data, children, references) {
		this.name = name;
		this.data = data;
		this.children = children;
		this.references = references;
	}
	/**
	 * Get the default data property value for a key of a view.
	 */

	function viewDataDefault(viewName, key) {
		return (viewName in viewDataDefaults ? viewDataDefaults[viewName] : viewDataDefaults[viewName] = viewName === "text" ? document.createTextNode("") : document.createElement(viewName))[key];
	}
	/**
	 * Create a view node.
	 *
	 * @param {object} view
	 */


	function viewNodeCreate(view) {
		var viewName = view.name;
		var viewNode;

		if (viewName === "text") {
			viewNode = document.createTextNode(view.data.data);
			viewNode.MoonChildren = [];
		} else {
			viewNode = document.createElement(viewName);
			var viewNodeChildren = viewNode.MoonChildren = [];
			var viewData = view.data;
			var viewChildren = view.children;
			var viewReferences = view.references;

			for (var key in viewData) {
				viewDataCreate(viewNode, viewName, viewData, viewReferences, key, viewData[key]);
			}

			for (var i = 0; i < viewChildren.length; i++) {
				viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewChildren[i])));
			}
		}

		return viewNode;
	}
	/**
	 * Create a data property.
	 *
	 * @param {object} viewNode
	 * @param {string} viewName
	 * @param {object} viewData
	 * @param {object} viewReferences
	 * @param {string} key
	 * @param {any} value
	 */

	function viewDataCreate(viewNode, viewName, viewData, viewReferences, key, value) {
		switch (key) {
			case "attributes":
				{
					for (var keyAttribute in value) {
						viewNode.setAttribute(keyAttribute, value[keyAttribute]);
					}

					break;
				}

			case "style":
				{
					var viewNodeStyle = viewNode.style;

					for (var keyStyle in value) {
						viewNodeStyle[keyStyle] = value[keyStyle];
					}

					break;
				}

			case "class":
				{
					viewNode.className = value;
					break;
				}

			case "for":
				{
					viewNode.htmlFor = value;
					break;
				}

			case "children":
				break;

			default:
				{
					var keyFirst = key[0];

					if (keyFirst === "*") {
						var reference = viewReferences[key];
						var referenceProperty = referenceProperties[viewName][key];
						var referenceEvent = referenceProperty.event;
						var viewNodeReferenceEvents = viewNode.MoonReferenceEvents;

						if (viewNodeReferenceEvents === null) {
							viewNodeReferenceEvents = viewNode.MoonReferenceEvents = new MoonReferenceEvents();
						}

						viewNode[referenceProperty.key] = referenceProperty.value(reference.get, viewNode, viewData);
						viewNodeReferenceEvents[referenceEvent] = referenceProperty.handler(reference.set, viewNode, viewData);
						viewNode.addEventListener(referenceEvent, viewNodeReferenceEvents);
					} else if (keyFirst === "o" && key[1] === "n") {
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
	 * @param {string} viewName
	 * @param {object} viewData
	 * @param {object} viewReferences
	 * @param {string} key
	 * @param {any} valueOld
	 * @param {any} valueNew
	 */

	function viewDataUpdate(viewNode, viewName, viewData, viewReferences, key, valueOld, valueNew) {
		switch (key) {
			case "attributes":
				{
					for (var keyAttribute in valueNew) {
						var valueAttributeNew = valueNew[keyAttribute];

						if (!(keyAttribute in valueOld) || valueAttributeNew !== valueOld[keyAttribute]) {
							viewNode.setAttribute(keyAttribute, valueAttributeNew);
						}
					}

					for (var _keyAttribute in valueOld) {
						if (!(_keyAttribute in valueNew)) {
							viewNode.removeAttribute(_keyAttribute);
						}
					}

					break;
				}

			case "style":
				{
					var viewNodeStyle = viewNode.style;

					for (var keyStyle in valueNew) {
						var valueStyleNew = valueNew[keyStyle];

						if (!(keyStyle in valueOld) || valueStyleNew !== valueOld[keyStyle]) {
							viewNodeStyle[keyStyle] = valueStyleNew;
						}
					}

					for (var _keyStyle in valueOld) {
						if (!(_keyStyle in valueNew)) {
							viewNodeStyle[_keyStyle] = "";
						}
					}

					break;
				}

			case "class":
				{
					viewNode.className = valueNew;
					break;
				}

			case "for":
				{
					viewNode.htmlFor = valueNew;
					break;
				}

			case "children":
				break;

			default:
				{
					var keyFirst = key[0];

					if (keyFirst === "*") {
						var reference = viewReferences[key];
						var referenceProperty = referenceProperties[viewName][key];
						viewNode[referenceProperty.key] = referenceProperty.value(reference.get, viewNode, viewData);

						if (valueOld.value !== valueNew.value) {
							viewNode.MoonReferenceEvents[referenceProperty.event] = referenceProperty.handler(reference.set, viewNode, viewData);
						}
					} else if (keyFirst === "o" && key[1] === "n") {
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

	function viewDataRemove(viewNode, viewName, viewData, key) {
		switch (key) {
			case "attributes":
				{
					for (var keyAttribute in viewData.attributes) {
						viewNode.removeAttribute(keyAttribute);
					}

					break;
				}

			case "class":
				{
					viewNode.className = "";
					break;
				}

			case "for":
				{
					viewNode.htmlFor = "";
					break;
				}

			case "children":
				break;

			default:
				{
					var keyFirst = key[0];

					if (keyFirst === "*") {
						var referenceProperty = referenceProperties[viewName][key];
						var referenceKey = referenceProperty.key;
						var referenceEvent = referenceProperty.event;
						var viewNodeReferenceEvents = viewNode.MoonReferenceEvents;
						viewNode[referenceKey] = viewDataDefault(viewName, referenceKey);
						viewNodeReferenceEvents[referenceEvent] = null;
						viewNode.removeEventListener(referenceEvent, viewNodeReferenceEvents);
					} else if (keyFirst === "o" && key[1] === "n") {
						viewNode[key.toLowerCase()] = null;
					} else {
						viewNode[key] = viewDataDefault(viewName, key);
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
	 * @param {number} index
	 */

	function viewPatch(viewNode, viewOld, viewNew, index) {
		if (viewOld !== viewNew) {
			var viewNewName = viewNew.name;

			if (viewOld.name !== viewNewName) {
				var viewNodeParent = viewNode.parentNode;
				viewNodeParent.replaceChild(viewNodeParent.MoonChildren[index] = viewNodeCreate(viewNew), viewNode);
			} else {
				var viewOldData = viewOld.data;
				var viewOldChildren = viewOld.children;
				var viewNewData = viewNew.data;
				var viewNewChildren = viewNew.children;

				if (viewOldData !== viewNewData) {
					var viewNewReferences = viewNew.references;

					for (var key in viewNewData) {
						if (key in viewOldData) {
							var valueOld = viewOldData[key];
							var valueNew = viewNewData[key];

							if (valueOld !== valueNew) {
								viewDataUpdate(viewNode, viewNewName, viewNewData, viewNewReferences, key, valueOld, valueNew);
							}
						} else {
							viewDataCreate(viewNode, viewNewName, viewNewData, viewNewReferences, key, viewNewData[key]);
						}
					}

					for (var _key in viewOldData) {
						if (!(_key in viewNewData)) {
							viewDataRemove(viewNode, viewNewName, viewOldData, _key);
						}
					}
				}

				if (viewOldChildren !== viewNewChildren) {
					var viewNodeChildren = viewNode.MoonChildren;
					var viewOldChildrenLength = viewOldChildren.length;
					var viewNewChildrenLength = viewNewChildren.length;
					var i = 0;

					if (viewOldChildrenLength === viewNewChildrenLength) {
						for (; i < viewOldChildrenLength; i++) {
							viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
						}
					} else if (viewOldChildrenLength < viewNewChildrenLength) {
						for (; i < viewOldChildrenLength; i++) {
							viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
						}

						for (; i < viewNewChildrenLength; i++) {
							viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewNewChildren[i])));
						}
					} else {
						for (; i < viewNewChildrenLength; i++) {
							viewPatch(viewNodeChildren[i], viewOldChildren[i], viewNewChildren[i], i);
						}

						for (; i < viewOldChildrenLength; i++) {
							viewNode.removeChild(viewNodeChildren.pop());
						}
					}
				}
			}
		}
	}

	/**
	 * Root element
	 */

	var root = new View("div", {
		id: "moon-root"
	}, [], {});
	var rootNode = document.getElementById("moon-root");
	rootNode.MoonChildren = [];
	/**
	 * View driver
	 */

	var view = {
		get: function get() {
			return root;
		},
		set: function set(view) {
			viewPatch(rootNode, root, view, 0);
			root = view;
		}
	};

	/**
	 * Time driver
	 */
	var time = {
		get: function get() {
			return Date.now();
		},
		set: function set() {}
	};

	/**
	 * Storage driver
	 */
	var storage = {
		get: function get() {
			return localStorage;
		},
		set: function set(storage) {
			for (var key in storage) {
				var value = storage[key];

				if (!(key in localStorage) || value !== localStorage[key]) {
					localStorage[key] = value;
				}
			}

			for (var _key in localStorage) {
				if (!(_key in storage)) {
					delete localStorage[_key];
				}
			}
		}
	};

	/**
	 * Match HTTP headers.
	 */
	var headerRE = /^([^:]+):\s*([^]*?)\s*$/gm;
	/**
	 * Load events
	 */

	var httpEventsLoad = {};
	/**
	 * Error events
	 */

	var httpEventsError = {};
	/**
	 * Make an HTTP request.
	 *
	 * This is a wrapper around the XMLHttpRequest API that allows access to events
	 * through a global object. Drivers usually access normal JavaScript APIs to
	 * access their data and normalize it, but the normal API doesn't allow hooking
	 * into load and error events, so they use this wrapper instead.
	 *
	 * @param {string} name
	 * @param {object} request
	 * @param {function} handler
	 */

	function httpRequest(name, request, handler) {
		var xhr = new XMLHttpRequest(); // Handle response types.

		xhr.responseType = "responseType" in request ? request.responseType : "text"; // Handle load event.

		xhr.onload = function () {
			var responseHeaders = {};
			var responseHeadersText = xhr.getAllResponseHeaders();
			var responseHeader; // Parse headers to object.

			while ((responseHeader = headerRE.exec(responseHeadersText)) !== null) {
				responseHeaders[responseHeader[1]] = responseHeader[2];
			}

			handler({
				status: xhr.status,
				headers: responseHeaders,
				body: xhr.response
			});

			if (name in httpEventsLoad) {
				httpEventsLoad[name]();
			}
		}; // Handle error event.


		xhr.onerror = function () {
			handler({
				status: 0,
				headers: null,
				body: null
			});

			if (name in httpEventsError) {
				httpEventsError[name]();
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
	}

	/**
	 * Global HTTP state
	 */

	var state$1 = {};
	/**
	 * Create event handler for http request.
	 *
	 * @param {object} data
	 * @returns {function} handler
	 */

	function httpHandler(data) {
		return function (response) {
			data.response = response;
		};
	}
	/**
	 * HTTP driver
	 */


	var http = {
		get: function get() {
			return state$1;
		},
		set: function set(http) {
			state$1 = http;

			for (var name in state$1) {
				var data = state$1[name];

				if (data.response.status === null) {
					httpRequest(name, data.request, httpHandler(data));
				}
			}
		}
	};

	/**
	 * Root state
	 *
	 * This includes the route. In theory, keys, scroll, and selection states would
	 * belong here, but they are made implicit in practice to prevent performance
	 * and accessibility issues.
	 */
	var state$2 = {
		route: location.pathname
	};
	var root$1 = {
		get: function get() {
			return state$2;
		},
		set: function set(root) {
			state$2 = root;
		}
	};

	var drivers = {
		data: data,
		http: http,
		root: root$1,
		storage: storage,
		time: time,
		view: view
	};

	function run() {
		for (var driver in drivers) {
			m[driver] = drivers[driver].get();
		}

		mSet(componentMain(m));

		for (var _driver in drivers) {
			drivers[_driver].set(m[_driver]);
		}
	}

	var componentMain;
	function main(component) {
		componentMain = component;
		run();
	}

	var wrappers = {
		view: {
			View: View,
			viewNodeCreate: viewNodeCreate,
			viewDataCreate: viewDataCreate,
			viewDataUpdate: viewDataUpdate,
			viewDataRemove: viewDataRemove,
			viewPatch: viewPatch
		},
		http: {
			httpEventsLoad: httpEventsLoad,
			httpEventsError: httpEventsError,
			httpRequest: httpRequest
		}
	};

	/**
	 * Empty children
	 */

	var childrenEmpty = [];
	/**
	 * Empty references
	 */

	var referencesEmpty = {};
	/**
	 * Element component
	 */

	function element(name) {
		return function (data) {
			return function (m) {
				var children;

				if ("children" in data) {
					var dataChildren = data.children;
					children = [];

					for (var i = 0; i < dataChildren.length; i++) {
						m = dataChildren[i](m);
						children.push(m.view);
					}
				} else {
					children = childrenEmpty;
				}

				m.view = new View(name, data, children, referencesEmpty);
				return m;
			};
		};
	}
	/**
	 * Empty element component
	 */

	function elementEmpty(name) {
		return function (data) {
			return function (m) {
				m.view = new View(name, data, childrenEmpty, referencesEmpty);
				return m;
			};
		};
	}
	/**
	 * References element component
	 */

	function elementReferences(name) {
		return function (data) {
			return function (m) {
				var references = {};

				for (var key in data) {
					if (key[0] === "*") {
						var value = data[key];
						references[key] = {
							value: value.value,
							get: value.get(m),
							set: value.set
						};
					}
				}

				m.view = new View(name, data, childrenEmpty, references);
				return m;
			};
		};
	}

	var rootElement = element("div");
	/**
	 * Root component
	 */

	var root$2 = (function (data) {
		return function (m) {
			// Update view using root.
			var route = m.root.route;

			if (route !== location.pathname) {
				history.pushState(null, "", route);
			}

			return rootElement(data)(m);
		};
	});

	/**
	 * Router component
	 */
	var router = (function (data) {
		return function (m) {
			var route = m.root.route;
			var routeSegment = "/";

			for (var i = 1; i < route.length; i++) {
				var routeCharacter = route[i];

				if (routeCharacter === "/") {
					data = (routeSegment in data ? data[routeSegment] : data["/*"])[1];
					routeSegment = "/";
				} else {
					routeSegment += routeCharacter;
				}
			}

			return (routeSegment in data ? data[routeSegment] : data["/*"])[0](m);
		};
	});

	/**
	 * Timer component
	 */

	var timer = (function (data) {
		return function (m) {
			for (var delay in data) {
				setTimeout(event(data[delay]), delay);
			}

			return m;
		};
	});

	/**
	 * HTTP component
	 */

	var httper = (function (data) {
		return function (m) {
			var http = m.http;

			for (var name in data) {
				var request = data[name];

				if ("onLoad" in request) {
					httpEventsLoad[name] = event(request.onLoad);
				}

				if ("onError" in request) {
					httpEventsError[name] = event(request.onError);
				}

				http[name] = {
					request: request,
					response: {
						status: null,
						headers: null,
						body: null
					}
				};
			}

			return m;
		};
	});

	/**
	 * Moon component names
	 */
	/**
	 * HTML element names
	 */

	var namesElement = ["a", "abbr", "acronym", "address", "applet", "article", "aside", "b", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "button", "canvas", "caption", "center", "cite", "code", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "html", "i", "iframe", "image", "ins", "isindex", "kbd", "label", "legend", "li", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "tt", "u", "ul", "var", "xmp"];
	/**
	 * Empty HTML element names
	 */

	var namesElementEmpty = ["area", "base", "br", "col", "embed", "hr", "img", "keygen", "link", "meta", "param", "source", "text", "track", "wbr"];
	/**
	 * HTML element with references names
	 */

	var namesElementReferences = ["audio", "input", "video"];

	var components = {
		root: root$2,
		router: router,
		timer: timer,
		httper: httper
	};

	for (var i = 0; i < namesElement.length; i++) {
		var name = namesElement[i];
		components[name] = element(name);
	}

	for (var _i = 0; _i < namesElementEmpty.length; _i++) {
		var _name = namesElementEmpty[_i];
		components[_name] = elementEmpty(_name);
	}

	for (var _i2 = 0; _i2 < namesElementReferences.length; _i2++) {
		var _name2 = namesElementReferences[_i2];
		components[_name2] = elementReferences(_name2);
	}

	/**
	 * Moon
	 *
	 * Moon works by having components to transform states which drivers access to
	 * transform and perform effects. For performance, the main component is ran on
	 * events instead of every tick. As a result, drivers are called only when
	 * needed.
	 *
	 * Drivers get data from builtin APIs and normalize it to store it in the
	 * state. They also set data using builtin APIs. This forms an isomorphism
	 * between the Moon state and the builtin state. This isn't always possible, so
	 * drivers can create global variables as a part of the builtin state to allow
	 * an isomorphism.
	 *
	 * Components transform the Moon state `m`, which is accessed by drivers to
	 * convert to builtin state, reflecting as effects in the real world. They are
	 * also responsible for detecting events. They do this by hooking into the
	 * event loop for global events, checking if it is relevant locally, and
	 * running the component in their handler before running the main component.
	 * Hooking into local events through global listeners isn't always practical or
	 * possible, so some APIs have wrapper implementations which create global
	 * event buses.
	 */

	var index = {
		main: main,
		drivers: drivers,
		wrappers: wrappers,
		components: components,
		event: event,
		run: run,
		version: "1.0.0-beta.7"
	};

	return index;
}));
