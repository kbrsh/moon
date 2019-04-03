/**
 * Moon v1.0.0-beta.2
 * Copyright 2016-2018 Kabir Shah
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

	function _typeof(obj) {
		if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
			_typeof = function (obj) {
				return typeof obj;
			};
		} else {
			_typeof = function (obj) {
				return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
			};
		}

		return _typeof(obj);
	}

	function _toConsumableArray(arr) {
		return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
	}

	function _arrayWithoutHoles(arr) {
		if (Array.isArray(arr)) {
			for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

			return arr2;
		}
	}

	function _iterableToArray(iter) {
		if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _nonIterableSpread() {
		throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function parseElements(start, end, tokens) {
		var length = end - start;

		if (length === 0) {
			return [];
		} else {
			for (var elementEnd = start + 1; elementEnd <= end; elementEnd++) {
				var element = parse(start, elementEnd, tokens);

				if (element !== null) {
					var elements = parseElements(elementEnd, end, tokens);

					if (elements !== null) {
						return [element].concat(_toConsumableArray(elements));
					}
				}
			}

			return null;
		}
	}

	function parse(start, end, tokens) {
		var firstToken = tokens[start];
		var lastToken = tokens[end - 1];
		var length = end - start;

		if (length === 0) {
			return null;
		} else if (length === 1) {
			if (firstToken.type === "tagOpen" && firstToken.closed === true) {
				return {
					type: firstToken.value,
					attributes: firstToken.attributes,
					children: []
				};
			} else {
				return null;
			}
		} else {
			if (firstToken.type === "tagOpen" && lastToken.type === "tagClose" && firstToken.value === lastToken.value) {
				var children = parseElements(start + 1, end - 1, tokens);

				if (children === null) {
					return null;
				} else {
					return {
						type: firstToken.value,
						attributes: firstToken.attributes,
						children: children
					};
				}
			} else {
				return null;
			}
		}
	}

	var getElement = function getElement(element) {
		return "m".concat(element);
	};
	var setElement = function setElement(element, code) {
		return "".concat(getElement(element), "=").concat(code);
	};
	var createElement = function createElement(type) {
		return "m.ce(\"".concat(type, "\");");
	};
	var createTextNode = function createTextNode(content) {
		return "m.ctn(".concat(content, ");");
	};
	var createComment = function createComment() {
		return "m.cc();";
	};
	var attributeValue = function attributeValue(attribute) {
		return attribute.expression ? attribute.value : "\"".concat(attribute.value, "\"");
	};
	var setAttribute = function setAttribute(element, attribute) {
		return "m.sa(".concat(getElement(element), ",\"").concat(attribute.key, "\",").concat(attributeValue(attribute), ");");
	};
	var addEventListener = function addEventListener(element, type, handler) {
		return "m.ael(".concat(getElement(element), ",\"").concat(type, "\",").concat(handler, ");");
	};
	var setTextContent = function setTextContent(element, content) {
		return "m.stc(".concat(getElement(element), ",").concat(content, ");");
	};
	var appendChild = function appendChild(element, parent) {
		return "m.ac(".concat(getElement(element), ",").concat(getElement(parent), ");");
	};
	var removeChild = function removeChild(element, parent) {
		return "m.rc(".concat(getElement(element), ",").concat(getElement(parent), ");");
	};
	var insertBefore = function insertBefore(element, reference, parent) {
		return "m.ib(".concat(getElement(element), ",").concat(getElement(reference), ",").concat(getElement(parent), ");");
	};
	var directiveIf = function directiveIf(ifState, ifConditions, ifPortions, ifParent) {
		return "m.di(".concat(getElement(ifState), ",").concat(getElement(ifConditions), ",").concat(getElement(ifPortions), ",").concat(getElement(ifParent), ");");
	};
	var directiveFor = function directiveFor(forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) {
		return "m.df(".concat(forIdentifiers, ",").concat(getElement(forLocals), ",").concat(forValue, ",").concat(getElement(forPortion), ",").concat(getElement(forPortions), ",").concat(getElement(forParent), ");");
	};

	var isComponentType = function isComponentType(type) {
		return type[0] === type[0].toUpperCase() && type[0] !== type[0].toLowerCase();
	};

	var generateMount = function generateMount(element, parent, reference) {
		return reference === null ? appendChild(element, parent) : insertBefore(element, reference, parent);
	};

	var generateAll = function generateAll(element, parent, root, reference) {
		switch (element.type) {
			case "If":
				{
					var ifState = root.nextElement++;
					var ifReference = root.nextElement++;
					var ifConditions = root.nextElement++;
					var ifPortions = root.nextElement++;
					var ifConditionsCode = "[";
					var ifPortionsCode = "[";
					var separator = "";
					var siblings = parent.children;

					for (var i = siblings.indexOf(element); i < siblings.length; i++) {
						var sibling = siblings[i];

						if (sibling.type === "If" || sibling.type === "ElseIf" || sibling.type === "Else") {
							ifConditionsCode += separator + (sibling.type === "Else" ? "true" : attributeValue(sibling.attributes[0]));
							ifPortionsCode += separator + "function(locals){" + generate({
								element: root.nextElement,
								nextElement: root.nextElement + 1,
								type: "Root",
								attributes: [],
								children: sibling.children
							}, ifReference) + "}({})";
							separator = ",";
						} else {
							break;
						}
					}

					return [setElement(ifReference, createComment()) + generateMount(ifReference, parent.element, reference) + setElement(ifPortions, ifPortionsCode + "];"), setElement(ifConditions, ifConditionsCode + "];") + setElement(ifState, directiveIf(ifState, ifConditions, ifPortions, parent.element)), getElement(ifState) + "[2]();"];
				}

			case "ElseIf":
			case "Else":
				{
					return ["", "", ""];
				}

			case "For":
				{
					var forAttribute = attributeValue(element.attributes[0]);
					var forIdentifiers = "[";
					var forValue = "";
					var forReference = root.nextElement++;
					var forPortion = root.nextElement++;
					var forPortions = root.nextElement++;
					var forLocals = root.nextElement++;
					var forIdentifier = "",
							_separator = "";

					for (var _i = 0; _i < forAttribute.length; _i++) {
						var _char = forAttribute[_i];

						if (_char === "," || _char === " " && forAttribute[_i + 1] === "i" && forAttribute[_i + 2] === "n" && forAttribute[_i + 3] === " " && (_i += 3)) {
							forIdentifiers += _separator + "\"" + forIdentifier.substring(7) + "\"";
							forIdentifier = "";
							_separator = ",";
						} else {
							forIdentifier += _char;
						}
					}

					forIdentifiers += "]";
					forValue += forIdentifier;
					return [setElement(forReference, createComment()) + generateMount(forReference, parent.element, reference) + setElement(forPortion, "function(locals){" + generate({
						element: root.nextElement,
						nextElement: root.nextElement + 1,
						type: "Root",
						attributes: [],
						children: element.children
					}, forReference) + "};") + setElement(forPortions, "[];") + setElement(forLocals, "[];"), directiveFor(forIdentifiers, forLocals, forValue, forPortion, forPortions, parent.element), directiveFor(forIdentifiers, forLocals, "[]", forPortion, forPortions, parent.element)];
				}

			case "Text":
				{
					var textAttribute = element.attributes[0];
					var textElement = root.nextElement++;
					var textCode = setTextContent(textElement, attributeValue(textAttribute));
					var createCode = setElement(textElement, createTextNode("\"\""));
					var updateCode = "";

					if (textAttribute.dynamic) {
						updateCode += textCode;
					} else {
						createCode += textCode;
					}

					return [createCode + generateMount(textElement, parent.element, reference), updateCode, removeChild(textElement, parent.element)];
				}

			default:
				{
					var attributes = element.attributes;
					var children = element.children;

					if (isComponentType(element.type)) {
						element.component = root.nextElement++;

						var _createCode = setElement(element.component, "new m.c.".concat(element.type, "();"));

						var _updateCode = "";
						var dynamic = false;

						for (var _i2 = 0; _i2 < attributes.length; _i2++) {
							var attribute = attributes[_i2];

							if (attribute.key[0] === "@") {
								_createCode += "".concat(getElement(element.component), ".on(\"").concat(attribute.key.substring(1), "\",function($event){locals.$event=$event;").concat(attributeValue(attribute), ";});");
							} else {
								var attributeCode = "".concat(getElement(element.component), ".").concat(attribute.key, "=").concat(attributeValue(attribute), ";");

								if (attribute.dynamic) {
									dynamic = true;
									_updateCode += attributeCode;
								} else {
									_createCode += attributeCode;
								}
							}
						}

						_createCode += "".concat(getElement(element.component), ".create(").concat(getElement(parent.element), ");");

						if (dynamic) {
							_updateCode += "".concat(getElement(element.component), ".update();");
						} else {
							_createCode += "".concat(getElement(element.component), ".update();");
						}

						return [_createCode, _updateCode, "".concat(getElement(element.component), ".destroy();")];
					} else {
						element.element = root.nextElement++;

						var _createCode2 = setElement(element.element, createElement(element.type));

						var _updateCode2 = "";

						for (var _i3 = 0; _i3 < attributes.length; _i3++) {
							var _attribute = attributes[_i3];

							var _attributeCode = void 0;

							if (_attribute.key[0] === "@") {
								var eventType = void 0,
										eventHandler = void 0;

								if (_attribute.key === "@bind") {
									var bindVariable = attributeValue(_attribute);
									_attributeCode = "".concat(getElement(element.element), ".value=").concat(bindVariable, ";");
									eventType = "input";
									eventHandler = "".concat(bindVariable, "=$event.target.value;instance.update();");
								} else {
									_attributeCode = "";
									eventType = _attribute.key.substring(1);
									eventHandler = "locals.$event=$event;".concat(attributeValue(_attribute), ";");
								}

								_createCode2 += addEventListener(element.element, eventType, "function($event){".concat(eventHandler, "}"));
							} else {
								_attributeCode = setAttribute(element.element, _attribute);
							}

							if (_attribute.dynamic) {
								_updateCode2 += _attributeCode;
							} else {
								_createCode2 += _attributeCode;
							}
						}

						for (var _i4 = 0; _i4 < children.length; _i4++) {
							var childCode = generateAll(children[_i4], element, root, null);
							_createCode2 += childCode[0];
							_updateCode2 += childCode[1];
						}

						return [_createCode2 + generateMount(element.element, parent.element, reference), _updateCode2, removeChild(element.element, parent.element)];
					}
				}
		}
	};
	var generate = function generate(root, reference) {
		var children = root.children;
		var create = "";
		var update = "";
		var destroy = "";

		for (var i = 0; i < children.length; i++) {
			var generated = generateAll(children[i], root, root, reference);
			create += generated[0];
			update += generated[1];
			destroy += generated[2];
		}

		var prelude = "var ".concat(getElement(root.element));

		for (var _i5 = root.element + 1; _i5 < root.nextElement; _i5++) {
			prelude += "," + getElement(_i5);
		}

		return "".concat(prelude, ";return [function(_0){").concat(setElement(root.element, "_0;")).concat(create, "},function(){").concat(update, "},function(){").concat(destroy, "}];");
	};

	var typeRE = /<([\w\d-_]+)([^>]*?)(\/?)>/g;
	var attributeRE = /\s*([\w\d-_]*)(?:=(?:("[\w\d-_]*"|'[\w\d-_]*')|{([\w\d-_]*)}))?/g;
	function lex(input) {
		input = input.trim();
		var tokens = [];

		for (var i = 0; i < input.length;) {
			var _char = input[i];

			if (_char === "<") {
				var nextChar = input[i + 1];

				if (nextChar === "/") {
					var closeIndex = input.indexOf(">", i + 2);

					var _type = input.slice(i + 2, closeIndex);

					tokens.push({
						type: "tagClose",
						value: _type
					});
					i = closeIndex + 1;
					continue;
				} else if (nextChar === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
					i = input.indexOf("-->", i + 4) + 3;
					continue;
				}

				typeRE.lastIndex = i;
				var typeExec = typeRE.exec(input);
				var typeMatch = typeExec[0];
				var type = typeExec[1];
				var attributesText = typeExec[2];
				var closingSlash = typeExec[3];
				var attributes = {};
				var attributeExec = void 0;

				while ((attributeExec = attributeRE.exec(attributesText)) !== null) {
					var attributeMatch = attributeExec[0];
					var attributeKey = attributeExec[1];
					var attributeValue = attributeExec[2];
					var attributeExpression = attributeExec[3];

					if (attributeMatch.length === 0) {
						attributeRE.lastIndex += 1;
					} else {
						attributes[attributeKey] = attributeExpression === undefined ? attributeValue : attributeExpression;
					}
				}

				tokens.push({
					type: "tagOpen",
					value: type,
					attributes: attributes,
					closed: closingSlash === "/"
				});
				i += typeMatch.length;
			} else if (_char === "{") {
				var expression = "";

				for (i += 1; i < input.length; i++) {
					var _char2 = input[i];

					if (_char2 === "}") {
						break;
					} else {
						expression += _char2;
					}
				}

				tokens.push({
					type: "tagOpen",
					value: "Text",
					attributes: {
						"": expression
					},
					closed: true
				});
				i += 1;
			} else {
				var text = "";

				for (; i < input.length; i++) {
					var _char3 = input[i];

					if (_char3 === "<") {
						break;
					} else {
						text += _char3;
					}
				}

				tokens.push({
					type: "tagOpen",
					value: "Text",
					attributes: {
						"": "\"".concat(text, "\"")
					},
					closed: true
				});
			}
		}

		return tokens;
	}

	function compile(input) {
		var tokens = lex(input);
		return parse(0, tokens.length, tokens);
	}

	var components = {};

	var createElement$1 = function createElement(type) {
		return document.createElement(type);
	};

	var createTextNode$1 = function createTextNode(content) {
		return document.createTextNode(content);
	};

	var createComment$1 = function createComment() {
		return document.createComment("");
	};

	var setAttribute$1 = function setAttribute(element, key, value) {
		element.setAttribute(key, value);
	};

	var addEventListener$1 = function addEventListener(element, type, handler) {
		element.addEventListener(type, handler);
	};

	var setTextContent$1 = function setTextContent(element, content) {
		element.textContent = content;
	};

	var appendChild$1 = function appendChild(element, parent) {
		parent.appendChild(element);
	};

	var removeChild$1 = function removeChild(element, parent) {
		parent.removeChild(element);
	};

	var insertBefore$1 = function insertBefore(element, reference, parent) {
		parent.insertBefore(element, reference);
	};

	var directiveIf$1 = function directiveIf(ifState, ifConditions, ifPortions, ifParent) {
		for (var i = 0; i < ifConditions.length; i++) {
			if (ifConditions[i]) {
				var ifPortion = ifPortions[i];

				if (ifState === ifPortion) {
					ifPortion[1]();
				} else {
					if (ifState) {
						ifState[2]();
					}

					ifPortion[0](ifParent);
					ifPortion[1]();
					ifState = ifPortion;
				}

				return ifState;
			}
		}
	};

	var directiveFor$1 = function directiveFor(forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) {
		var previousLength = forPortions.length;
		var nextLength = forValue.length;
		var maxLength = previousLength > nextLength ? previousLength : nextLength;
		var keyIdentifier = forIdentifiers[1];
		var valueIdentifier = forIdentifiers[0];

		for (var i = 0; i < maxLength; i++) {
			if (i >= previousLength) {
				var forLocal = {};
				forLocal[keyIdentifier] = i;
				forLocal[valueIdentifier] = forValue[i];
				forLocals[i] = forLocal;
				var newForPortion = forPortion(forLocal);
				forPortions.push(newForPortion);
				newForPortion[0](forParent);
				newForPortion[1]();
			} else if (i >= nextLength) {
				forPortions.pop()[2]();
			} else {
				var _forLocal = forLocals[i];
				_forLocal[keyIdentifier] = i;
				_forLocal[valueIdentifier] = forValue[i];
				forPortions[i][1]();
			}
		}
	};

	var m = {
		c: components,
		ce: createElement$1,
		ctn: createTextNode$1,
		cc: createComment$1,
		sa: setAttribute$1,
		ael: addEventListener$1,
		stc: setTextContent$1,
		ac: appendChild$1,
		rc: removeChild$1,
		ib: insertBefore$1,
		di: directiveIf$1,
		df: directiveFor$1
	};

	var create = function create(root) {
		this._view[0](root);

		this.emit("create");
	};

	var update = function update(key, value) {
		if (key !== undefined) {
			if (_typeof(key) === "object") {
				for (var childKey in key) {
					this[childKey] = key[childKey];
				}
			} else {
				this[key] = value;
			}
		}

		if (this._queued === false) {
			this._queued = true;
			var instance = this;
			setTimeout(function () {
				instance._view[1]();

				instance._queued = false;
				instance.emit("update");
			}, 0);
		}
	};

	var destroy = function destroy() {
		this._view[2]();

		this.emit("destroy");
	};

	var on = function on(type, handler) {
		var events = this._events;
		var handlers = events[type];

		if (handlers === undefined) {
			events[type] = [handler.bind(this)];
		} else {
			handlers.push(handler.bind(this));
		}
	};

	var off = function off(type, handler) {
		if (type === undefined) {
			this._events = {};
		} else if (handler === undefined) {
			this._events[type] = [];
		} else {
			var handlers = this._events[type];
			handlers.splice(handlers.indexOf(handler), 1);
		}
	};

	var emit = function emit(type, data) {
		var handlers = this._events[type];

		if (handlers !== undefined) {
			for (var i = 0; i < handlers.length; i++) {
				handlers[i](data);
			}
		}
	};

	var component = function component(name, data) {
		// View
		var view = data.view;

		if (typeof view === "string") {
			view = new Function("m", "instance", "locals", compile(view));
		}

		delete data.view; // Events

		var onCreate = data.onCreate;
		var onUpdate = data.onUpdate;
		var onDestroy = data.onDestroy;
		delete data.onCreate;
		delete data.onUpdate;
		delete data.onDestroy; // Constructor

		function MoonComponent() {
			this._view = view(m, this, {});
			this._events = {};

			if (onCreate !== undefined) {
				this.on("create", onCreate);
			}

			if (onUpdate !== undefined) {
				this.on("update", onUpdate);
			}

			if (onDestroy !== undefined) {
				this.on("destroy", onDestroy);
			}
		} // Initialize


		MoonComponent.prototype = data; // Properties

		data._name = name;
		data._queued = false; // Methods

		data.create = create;
		data.update = update;
		data.destroy = destroy;
		data.on = on;
		data.off = off;
		data.emit = emit;
		return MoonComponent;
	};

	var config = {
		silent: "development" === "production" || typeof console === "undefined"
	};

	function Moon(data) {
		var root = data.root;
		delete data.root;

		if (typeof root === "string") {
			root = document.querySelector(root);
		}

		var instanceComponent = component("", data);
		var instance = new instanceComponent();
		instance.create(root);
		instance.update();
		return instance;
	}

	Moon.extend = function (name, data) {
		components[name] = component(name, data);
	};

	Moon.parse = parse;
	Moon.generate = generate;
	Moon.compile = compile;
	Moon.config = config;

	return Moon;
}));
