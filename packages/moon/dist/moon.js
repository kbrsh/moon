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
	 * Caches for performance
	 */
	Node.prototype.MoonName = null;
	Node.prototype.MoonData = null;
	Node.prototype.MoonReferenceEvents = null;
	/**
	 * Root element
	 */

	var root = document.getElementById("moon-root");
	root.MoonName = "div";
	root.MoonData = {
		id: "moon-root"
	};
	/**
	 * View driver
	 */

	var view = {
		get: function get() {
			return root;
		},
		set: function set(view) {
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

			mSet(component(m));
			mSet(componentMain(m));

			for (var _driver in drivers) {
				drivers[_driver].set(m[_driver]);
			}
		};
	}

	/**
	 * Reference bind events
	 */

	var references = {
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

	var viewEmpty = document.createTextNode("");
	viewEmpty.MoonName = "";
	viewEmpty.MoonData = {};
	/**
	 * View Data Property Defaults
	 */

	var viewDataDefaults = {};

	function viewDataDefault(name, key) {
		return (name in viewDataDefaults ? viewDataDefaults[name] : viewDataDefaults[name] = name === "text" ? document.createTextNode("") : document.createElement(name))[key];
	}
	/**
	 * Reference event manager
	 */


	function MoonReferenceEvents() {}

	MoonReferenceEvents.prototype.handleEvent = function (event) {
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
		return event(function (m) {
			return set(m, view[key]);
		});
	}
	/**
	 * Element component
	 */


	var element = (function (name) {
		return function (data) {
			return function (m) {
				var view = m.view;
				var viewName = view.MoonName;
				var viewData = view.MoonData;

				if (name !== viewName) {
					// If there is no view or the name changed, create a new view from
					// scratch.
					if (name === "text") {
						view = document.createTextNode("");
					} else {
						view = document.createElement(name);
					} // Create data properties.


					for (var key in data) {
						var value = data[key];
						var keyFirst = key[0];

						if (keyFirst === "*") {
							var reference = references[name][key];
							var referenceKey = reference.key;
							var referenceEvent = reference.event;
							var viewReferenceEvents = view.MoonReferenceEvents;

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
								case "attributes":
									{
										for (var keyAttribute in value) {
											view.setAttribute(keyAttribute, value[keyAttribute]);
										}

										break;
									}

								case "style":
									{
										var viewStyle = view.style;

										for (var keyStyle in value) {
											viewStyle[keyStyle] = value[keyStyle];
										}

										break;
									}

								case "class":
									{
										view.className = value;
										break;
									}

								case "for":
									{
										view.htmlFor = value;
										break;
									}

								case "children":
									{
										for (var i = 0; i < value.length; i++) {
											m.view = viewEmpty;
											m = value[i](m);
											view.appendChild(m.view);
										}

										break;
									}

								default:
									{
										view[key] = value;
									}
							}
						}
					} // Store name and data in cache for faster operations.


					view.MoonName = name;
					view.MoonData = data;
				} else if (data === viewData) {
					// If nothing changed, only run any children to transform the state. They
					// can't be skipped because they are functions of `m`, so them being the
					// same as last time doesn't imply they will have the same output.
					if ("children" in data) {
						var children = data.children;
						var viewChild = m.view = view.firstChild;

						for (var _i = 0; _i < children; _i++) {
							m = children[_i](m);
							var viewChildNew = m.view;

							if (viewChildNew !== viewChild) {
								view.replaceChild(viewChildNew, viewChild);
							}

							viewChild = m.view = viewChildNew.nextSibling;
						}
					}
				} else {
					// If the data doesn't match, update the view data and its cache.
					view.MoonData = data;

					for (var _key in data) {
						var _value = data[_key];

						if (_key in viewData) {
							// Update data property.
							var viewValue = viewData[_key];

							if (_key === "children") {
								// Children are updated even if they are the same as last time.
								var valueLength = _value.length;
								var viewValueLength = viewValue.length;

								var _viewChild = m.view = view.firstChild;

								var _i2 = 0;

								if (valueLength === viewValueLength) {
									for (; _i2 < valueLength; _i2++) {
										m = _value[_i2](m);
										var _viewChildNew = m.view;

										if (_viewChildNew !== _viewChild) {
											view.replaceChild(_viewChildNew, _viewChild);
										}

										_viewChild = m.view = _viewChildNew.nextSibling;
									}
								} else if (valueLength < viewValueLength) {
									for (; _i2 < valueLength; _i2++) {
										m = _value[_i2](m);
										var _viewChildNew2 = m.view;

										if (_viewChild !== _viewChildNew2) {
											view.replaceChild(_viewChildNew2, _viewChild);
										}

										_viewChild = m.view = _viewChildNew2.nextSibling;
									}

									for (; _i2 < viewValueLength; _i2++) {
										view.removeChild(view.lastChild);
									}
								} else {
									for (; _i2 < viewValueLength; _i2++) {
										m = _value[_i2](m);
										var _viewChildNew3 = m.view;

										if (_viewChild !== _viewChildNew3) {
											view.replaceChild(_viewChildNew3, _viewChild);
										}

										_viewChild = m.view = _viewChildNew3.nextSibling;
									}

									for (; _i2 < valueLength; _i2++) {
										m.view = viewEmpty;
										m = _value[_i2](m);
										view.appendChild(m.view);
									}
								}
							} else if (_value !== viewValue) {
								// Other properties are updated if they haven't changed.
								var _keyFirst = _key[0];

								if (_keyFirst === "*") {
									var _reference = references[name][_key];
									var _referenceKey = _reference.key;
									view[_referenceKey] = _value.get(m);

									if (_value.value !== viewValue.value) {
										view.MoonReferenceEvents[_reference.event] = referenceHandler(_value.set, view, _referenceKey);
									}
								} else if (_keyFirst === "o" && _key[1] === "n") {
									view[_key.toLowerCase()] = event(_value);
								} else {
									switch (_key) {
										case "attributes":
											{
												for (var _keyAttribute in _value) {
													var valueAttribute = _value[_keyAttribute];

													if (!(_keyAttribute in viewValue) || valueAttribute !== viewValue[_keyAttribute]) {
														view.setAttribute(_keyAttribute, valueAttribute);
													}
												}

												for (var _keyAttribute2 in viewValue) {
													if (!(_keyAttribute2 in _value)) {
														view.removeAttribute(_keyAttribute2);
													}
												}

												break;
											}

										case "style":
											{
												var _viewStyle = view.style;

												for (var _keyStyle in _value) {
													var valueStyle = _value[_keyStyle];

													if (!(_keyStyle in viewValue) || valueStyle !== viewValue[_keyStyle]) {
														_viewStyle[_keyStyle] = valueStyle;
													}
												}

												for (var _keyStyle2 in viewValue) {
													if (!(_keyStyle2 in _value)) {
														_viewStyle[_keyStyle2] = "";
													}
												}

												break;
											}

										case "class":
											{
												view.className = _value;
												break;
											}

										case "for":
											{
												view.htmlFor = _value;
												break;
											}

										default:
											{
												view[_key] = _value;
											}
									}
								}
							}
						} else {
							// Create data property.
							var _keyFirst2 = _key[0];

							if (_keyFirst2 === "*") {
								var _reference2 = references[name][_key];
								var _referenceKey2 = _reference2.key;
								var _referenceEvent = _reference2.event;
								var _viewReferenceEvents = view.MoonReferenceEvents;

								if (_viewReferenceEvents === null) {
									_viewReferenceEvents = view.MoonReferenceEvents = new MoonReferenceEvents();
								}

								view[_referenceKey2] = _value.get(m);
								_viewReferenceEvents[_referenceEvent] = referenceHandler(_value.set, view, _referenceKey2);
								view.addEventListener(_referenceEvent, _viewReferenceEvents);
							} else if (_keyFirst2 === "o" && _key[1] === "n") {
								view[_key.toLowerCase()] = event(_value);
							} else {
								switch (_key) {
									case "attributes":
										{
											for (var _keyAttribute3 in _value) {
												view.setAttribute(_keyAttribute3, _value[_keyAttribute3]);
											}

											break;
										}

									case "style":
										{
											var _viewStyle2 = view.style;

											for (var _keyStyle3 in _value) {
												_viewStyle2[_keyStyle3] = _value[_keyStyle3];
											}

											break;
										}

									case "class":
										{
											view.className = _value;
											break;
										}

									case "for":
										{
											view.htmlFor = _value;
											break;
										}

									case "children":
										{
											for (var _i3 = 0; _i3 < _value.length; _i3++) {
												m.view = viewEmpty;
												m = _value[_i3](m);
												view.appendChild(m.view);
											}

											break;
										}

									default:
										{
											view[_key] = _value;
										}
								}
							}
						}
					} // Remove data properties.


					for (var _key2 in viewData) {
						if (!(_key2 in data)) {
							var _keyFirst3 = _key2[0];

							if (_keyFirst3 === "*") {
								var _reference3 = references[name][_key2];
								var _referenceKey3 = _reference3.key;
								var _referenceEvent2 = _reference3.event;
								var _viewReferenceEvents2 = view.MoonReferenceEvents;
								view[_referenceKey3] = viewDataDefault(name, _referenceKey3);
								_viewReferenceEvents2[_referenceEvent2] = null;
								view.removeEventListener(_referenceEvent2, _viewReferenceEvents2);
							} else if (_keyFirst3 === "o" && _key2[1] === "n") {
								view[_key2.toLowerCase()] = null;
							} else {
								switch (_key2) {
									case "attributes":
										{
											for (var _keyAttribute4 in viewData.attributes) {
												view.removeAttribute(_keyAttribute4);
											}

											break;
										}

									case "class":
										{
											view.className = "";
											break;
										}

									case "for":
										{
											view.htmlFor = "";
											break;
										}

									case "children":
										{
											var viewChildrenLength = viewData.children.length;

											for (var _i4 = 0; _i4 < viewChildrenLength; _i4++) {
												view.removeChild(view.lastChild);
											}

											break;
										}

									default:
										{
											view[_key2] = viewDataDefault(name, _key2);
										}
								}
							}
						}
					}
				}

				m.view = view;
				return m;
			};
		};
	});

	var elementDiv = element("div");
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

			return elementDiv(data)(m);
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
	 * HTML tag names
	 */
	var names = ["root", "element", "router", "timer", "httper", "a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "image", "img", "input", "ins", "isindex", "kbd", "keygen", "label", "legend", "li", "link", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meta", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "text", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr", "xmp"];

	var components = {};

	for (var i = 0; i < names.length; i++) {
		var name = names[i];

		switch (name) {
			case "root":
				{
					components.root = root$2;
					break;
				}

			case "element":
				{
					components.element = element;
					break;
				}

			case "router":
				{
					components.router = router;
					break;
				}

			case "timer":
				{
					components.timer = timer;
					break;
				}

			case "httper":
				{
					components.httper = httper;
					break;
				}

			default:
				{
					components[name] = element(name);
				}
		}
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
		components: components,
		event: event,
		run: run,
		version: "1.0.0-beta.7"
	};

	return index;
}));
