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

	var expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
	var globals = ["NaN", "false", "in", "null", "this", "true", "typeof", "undefined"];

	var parseTemplate = function (expression) {
		var dynamic = false;

		expression = expression.replace(expressionRE, function(match, name) {
			if (name === undefined || globals.indexOf(name) !== -1) {
				return match;
			} else {
				dynamic = true;

				if (name[0] === "$") {
					return ("locals." + name);
				} else {
					return ("instance." + name);
				}
			}
		});

		return {
			expression: expression,
			dynamic: dynamic
		};
	};

	var config = {
		silent: ("development" === "production") || (typeof console === "undefined")
	};

	var error = function (message) {
		if (config.silent === false) {
			console.error("[Moon] ERROR: " + message);
		}
	};

	var whitespaceRE = /^\s+$/;

	var isComponentType = function (type) { return type[0] === type[0].toUpperCase() && type[0] !== type[0].toLowerCase(); };

	var valueEndRE = /[\s/>]/;

	var parseAttributes = function (index, input, length, attributes) {
		while (index < length) {
			var char = input[index];

			if (char === "/" || char === ">") {
				break;
			} else if (whitespaceRE.test(char)) {
				index += 1;
				continue;
			} else {
				var key = "";
				var value = (void 0);
				var expression = false;

				while (index < length) {
					char = input[index];

					if (char === "/" || char === ">" || whitespaceRE.test(char)) {
						value = "";
						break;
					} else if (char === "=") {
						index += 1;
						break;
					} else {
						key += char;
						index += 1;
					}
				}

				if (value === undefined) {
					var quote = (void 0);
					value = "";
					char = input[index];

					if (char === "\"" || char === "'") {
						quote = char;
						index += 1;
					} else if (char === "{") {
						quote = "}";
						expression = true;
						index += 1;
					} else {
						quote = valueEndRE;
					}

					while (index < length) {
						char = input[index];

						if ((typeof quote === "object" && quote.test(char)) || char === quote) {
							index += 1;
							break;
						} else {
							value += char;
							index += 1;
						}
					}
				}

				var dynamic = false;

				if (expression) {
					var template = parseTemplate(value);
					value = template.expression;
					dynamic = template.dynamic;
				}

				attributes.push({
					key: key,
					value: value,
					expression: expression,
					dynamic: dynamic
				});
			}
		}

		return index;
	};

	var parseOpeningTag = function (index, input, length, stack) {
		var element = {
			type: "",
			attributes: [],
			children: []
		};

		while (index < length) {
			var char = input[index];

			if (char === "/" || char === ">") {
				var attributes = element.attributes;
				var lastIndex = stack.length - 1;

				if (char === "/") {
					index += 1;
				} else {
					stack.push(element);
				}

				for (var i = 0; i < attributes.length;) {
					var attribute = attributes[i];

					if (isComponentType(attribute.key)) {
						element = {
							type: attribute.key,
							attributes: [{
								key: "",
								value: attribute.value,
								expression: attribute.expression,
								dynamic: attribute.dynamic
							}],
							children: [element]
						};
						attributes.splice(i, 1);
					} else {
						i += 1;
					}
				}

				stack[lastIndex].children.push(element);

				index += 1;
				break;
			} else if ((whitespaceRE.test(char) && (index += 1)) || char === "=") {
				index = parseAttributes(index, input, length, element.attributes);
			} else {
				element.type += char;
				index += 1;
			}
		}

		return index;
	};

	var parseClosingTag = function (index, input, length, stack) {
		var type = "";

		for(; index < length; index++) {
			var char = input[index];

			if (char === ">") {
				index += 1;
				break;
			} else {
				type += char;
			}
		}

		var lastElement = stack.pop();
		if (type !== lastElement.type && "development" === "development") {
			error(("Unclosed tag \"" + (lastElement.type) + "\""));
		}

		return index;
	};

	var parseComment = function (index, input, length) {
		while (index < length) {
			var char0 = input[index];
			var char1 = input[index + 1];
			var char2 = input[index + 2];

			if (char0 === "<" && char1 === "!" && char2 === "-" && input[index + 3] === "-") {
				index = parseComment(index + 4, input, length);
			} else if (char0 === "-" && char1 === "-" && char2 === ">") {
				index += 3;
				break;
			} else {
				index += 1;
			}
		}

		return index;
	};

	var escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
	var escapeMap = {
		"&amp;": '&',
		"&gt;": '>',
		"&lt;": '<',
		"&nbsp;": ' ',
		"&quot;": "\\\"",
		'\\': "\\\\",
		'"': "\\\"",
		'\n': "\\n"
	};

	var parseText = function (index, input, length, stack) {
		var content = "";

		for (; index < length; index++) {
			var char = input[index];

			if (char === "<" || char === "{") {
				break;
			} else {
				content += char;
			}
		}

		if (!whitespaceRE.test(content)) {
			stack[stack.length - 1].children.push({
				type: "Text",
				attributes: [{
					key: "",
					value: content.replace(escapeRE, function (match) { return escapeMap[match]; }),
					expression: false,
					dynamic: false
				}],
				children: []
			});
		}

		return index;
	};

	var parseExpression = function (index, input, length, stack) {
		var expression = "";

		for (; index < length; index++) {
			var char = input[index];

			if (char === "}") {
				index += 1;
				break;
			} else {
				expression += char;
			}
		}

		var template = parseTemplate(expression);
		stack[stack.length - 1].children.push({
			type: "Text",
			attributes: [{
				key: "",
				value: template.expression,
				expression: true,
				dynamic: template.dynamic
			}],
			children: []
		});

		return index;
	};

	var parse = function (input) {
		var length = input.length;

		var root = {
			element: 0,
			referenceElement: 1,
			nextElement: 2,
			type: "Root",
			attributes: [],
			children: []
		};

		var stack = [root];

		for (var i = 0; i < length;) {
			var char = input[i];

			if (char === "<") {
				if (input[i + 1] === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
					i = parseComment(i + 4, input, length);
				} else if (input[i + 1] === "/") {
					i = parseClosingTag(i + 2, input, length, stack);
				} else {
					i = parseOpeningTag(i + 1, input, length, stack);
				}
			} else if (char === "{") {
				i = parseExpression(i + 1, input, length, stack);
			} else {
				i = parseText(i, input, length, stack);
			}
		}

		return root;
	};

	var getElement = function (element) { return ("m" + element); };

	var setElement = function (element, code) { return ((getElement(element)) + "=" + code); };

	var createElement = function (type) { return ("m.ce(\"" + type + "\");"); };

	var createTextNode = function (content) { return ("m.ctn(" + content + ");"); };

	var createComment = function () { return "m.cc();"; };

	var attributeValue = function (attribute) { return attribute.expression ? attribute.value : ("\"" + (attribute.value) + "\""); };

	var setAttribute = function (element, attribute) { return ("m.sa(" + (getElement(element)) + ",\"" + (attribute.key) + "\"," + (attributeValue(attribute)) + ");"); };

	var addEventListener = function (element, type, handler) { return ("m.ael(" + (getElement(element)) + ",\"" + type + "\"," + handler + ");"); };

	var setTextContent = function (element, content) { return ("m.stc(" + (getElement(element)) + "," + content + ");"); };

	var appendChild = function (element, parent) { return ("m.ac(" + (getElement(element)) + "," + (getElement(parent)) + ");"); };

	var removeChild = function (element, parent) { return ("m.rc(" + (getElement(element)) + "," + (getElement(parent)) + ");"); };

	var insertBefore = function (element, reference, parent) { return ("m.ib(" + (getElement(element)) + "," + (getElement(reference)) + "," + (getElement(parent)) + ");"); };

	var directiveIf = function (ifState, ifConditions, ifPortions, ifParent) { return ("m.di(" + (getElement(ifState)) + "," + (getElement(ifConditions)) + "," + (getElement(ifPortions)) + "," + (getElement(ifParent)) + ");"); };

	var directiveFor = function (forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) { return ("m.df(" + forIdentifiers + "," + (getElement(forLocals)) + "," + forValue + "," + (getElement(forPortion)) + "," + (getElement(forPortions)) + "," + (getElement(forParent)) + ");"); };

	var generateMount = function (element, parent, reference) { return reference === null ? appendChild(element, parent) : insertBefore(element, reference, parent); };

	var generateAll = function (element, parent, root, reference) {
		switch (element.type) {
			case "If": {
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

				return [
					setElement(ifReference, createComment()) +
					generateMount(ifReference, parent.element, reference) +
					setElement(ifPortions, ifPortionsCode + "];"),

					setElement(ifConditions, ifConditionsCode + "];") +
					setElement(ifState, directiveIf(ifState, ifConditions, ifPortions, parent.element)),

					getElement(ifState) + "[2]();"
				];
			}
			case "ElseIf":
			case "Else": {
				return ["", "", ""];
			}
			case "For": {
				var forAttribute = attributeValue(element.attributes[0]);
				var forIdentifiers = "[";
				var forValue = "";

				var forReference = root.nextElement++;
				var forPortion = root.nextElement++;
				var forPortions = root.nextElement++;
				var forLocals = root.nextElement++;

				var forIdentifier = "", separator$1 = "";

				for (var i$1 = 0; i$1 < forAttribute.length; i$1++) {
					var char = forAttribute[i$1];

					if (char === "," || (char === " " && forAttribute[i$1 + 1] === "i" && forAttribute[i$1 + 2] === "n" && forAttribute[i$1 + 3] === " " && (i$1 += 3))) {
						forIdentifiers += separator$1 + "\"" + forIdentifier.substring(7) + "\"";
						forIdentifier = "";
						separator$1 = ",";
					} else {
						forIdentifier += char;
					}
				}

				forIdentifiers += "]";
				forValue += forIdentifier;

				return [
					setElement(forReference, createComment()) +
					generateMount(forReference, parent.element, reference) +
					setElement(forPortion, "function(locals){" + generate({
						element: root.nextElement,
						nextElement: root.nextElement + 1,
						type: "Root",
						attributes: [],
						children: element.children
					}, forReference) + "};") +
					setElement(forPortions, "[];") +
					setElement(forLocals, "[];"),

					directiveFor(forIdentifiers, forLocals, forValue, forPortion, forPortions, parent.element),

					directiveFor(forIdentifiers, forLocals, "[]", forPortion, forPortions, parent.element) ];
			}
			case "Text": {
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
			default: {
				var attributes = element.attributes;
				var children = element.children;

				if (isComponentType(element.type)) {
					element.component = root.nextElement++;

					var createCode$1 = setElement(element.component, ("new m.c." + (element.type) + "();"));
					var updateCode$1 = "";
					var dynamic = false;

					for (var i$2 = 0; i$2 < attributes.length; i$2++) {
						var attribute = attributes[i$2];

						if (attribute.key[0] === "@") {
							createCode$1 += (getElement(element.component)) + ".on(\"" + (attribute.key.substring(1)) + "\",function($event){locals.$event=$event;" + (attributeValue(attribute)) + ";});";
						} else {
							var attributeCode = (getElement(element.component)) + "." + (attribute.key) + "=" + (attributeValue(attribute)) + ";";

							if (attribute.dynamic) {
								dynamic = true;
								updateCode$1 += attributeCode;
							} else {
								createCode$1 += attributeCode;
							}
						}
					}

					createCode$1 += (getElement(element.component)) + ".create(" + (getElement(parent.element)) + ");";

					if (dynamic) {
						updateCode$1 += (getElement(element.component)) + ".update();";
					} else {
						createCode$1 += (getElement(element.component)) + ".update();";
					}

					return [
						createCode$1,
						updateCode$1,
						((getElement(element.component)) + ".destroy();")
					];
				} else {
					element.element = root.nextElement++;

					var createCode$2 = setElement(element.element, createElement(element.type));
					var updateCode$2 = "";

					for (var i$3 = 0; i$3 < attributes.length; i$3++) {
						var attribute$1 = attributes[i$3];
						var attributeCode$1 = (void 0);

						if (attribute$1.key[0] === "@") {
							var eventType = (void 0), eventHandler = (void 0);

							if (attribute$1.key === "@bind") {
								var bindVariable = attributeValue(attribute$1);
								attributeCode$1 = (getElement(element.element)) + ".value=" + bindVariable + ";";
								eventType = "input";
								eventHandler = bindVariable + "=$event.target.value;instance.update();";
							} else {
								attributeCode$1 = "";
								eventType = attribute$1.key.substring(1);
								eventHandler =	"locals.$event=$event;" + (attributeValue(attribute$1)) + ";";
							}

							createCode$2 += addEventListener(element.element, eventType, ("function($event){" + eventHandler + "}"));
						} else {
							attributeCode$1 = setAttribute(element.element, attribute$1);
						}

						if (attribute$1.dynamic) {
							updateCode$2 += attributeCode$1;
						} else {
							createCode$2 += attributeCode$1;
						}
					}

					for (var i$4 = 0; i$4 < children.length; i$4++) {
						var childCode = generateAll(children[i$4], element, root, null);
						createCode$2 += childCode[0];
						updateCode$2 += childCode[1];
					}

					return [createCode$2 + generateMount(element.element, parent.element, reference), updateCode$2, removeChild(element.element, parent.element)];
				}
			}
		}
	};

	var generate = function (root, reference) {
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

		var prelude = "var " + (getElement(root.element));
		for (var i$1 = root.element + 1; i$1 < root.nextElement; i$1++) {
			prelude += "," + getElement(i$1);
		}

		return (prelude + ";return [function(_0){" + (setElement(root.element, "_0;")) + create + "},function(){" + update + "},function(){" + destroy + "}];");
	};

	var compile = function (input) {
		return generate(parse(input), null);
	};

	var components = {};

	var createElement$1 = function (type) { return document.createElement(type); };

	var createTextNode$1 = function (content) { return document.createTextNode(content); };

	var createComment$1 = function () { return document.createComment(""); };

	var setAttribute$1 = function (element, key, value) {
		element.setAttribute(key, value);
	};

	var addEventListener$1 = function (element, type, handler) {
		element.addEventListener(type, handler);
	};

	var setTextContent$1 = function (element, content) {
		element.textContent = content;
	};

	var appendChild$1 = function (element, parent) {
		parent.appendChild(element);
	};

	var removeChild$1 = function (element, parent) {
		parent.removeChild(element);
	};

	var insertBefore$1 = function (element, reference, parent) {
		parent.insertBefore(element, reference);
	};

	var directiveIf$1 = function (ifState, ifConditions, ifPortions, ifParent) {
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

	var directiveFor$1 = function (forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) {
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
				var forLocal$1 = forLocals[i];
				forLocal$1[keyIdentifier] = i;
				forLocal$1[valueIdentifier] = forValue[i];

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

	var create = function(root) {
		this._view[0](root);
		this.emit("create");
	};

	var update = function(key, value) {
		var this$1 = this;

		if (key !== undefined) {
			if (typeof key === "object") {
				for (var childKey in key) {
					this$1[childKey] = key[childKey];
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

	var destroy = function() {
		this._view[2]();
		this.emit("destroy");
	};

	var on = function(type, handler) {
		var events = this._events;
		var handlers = events[type];

		if (handlers === undefined) {
			events[type] = [handler];
		} else {
			handlers.push(handler);
		}
	};

	var off = function(type, handler) {
		if (type === undefined) {
			this._events = {};
		} else if (handler === undefined) {
			this._events[type] = [];
		} else {
			var handlers = this._events[type];
			handlers.splice(handlers.indexOf(handler), 1);
		}
	};

	var emit = function(type, data) {
		var handlers = this._events[type];

		if (handlers !== undefined) {
			if (typeof handlers === "function") {
				handlers(data);
			} else {
				for (var i = 0; i < handlers.length; i++) {
					handlers[i](data);
				}
			}
		}
	};

	var component = function (name, options) {
		return function MoonComponent() {
			var this$1 = this;

			// Properties
			this._name = name;
			this._queued = false;

			// Options
			var data;
			if (options === undefined) {
				data = {};
			} else if (typeof options === "function") {
				data = options();
			} else {
				data = options;
			}

			// View
			if (typeof data.view === "string") {
				this._view = new Function("m", "instance", "locals", compile(data.view))(m, this, {});
			} else {
				this._view = data.view(m, this, {});
			}

			delete data.view;

			// Events
			var events = {};

			if (data.onCreate !== undefined) {
				events.create = data.onCreate.bind(this);
				delete data.onCreate;
			}

			if (data.onUpdate !== undefined) {
				events.update = data.onUpdate.bind(this);
				delete data.onUpdate;
			}

			if (data.onDestroy !== undefined) {
				events.destroy = data.onDestroy.bind(this);
				delete data.onDestroy;
			}

			this._events = events;

			// Data
			for (var key in data) {
				var value = data[key];
				if (typeof value === "function") {
					this$1[key] = value.bind(this$1);
				} else {
					this$1[key] = value;
				}
			}

			// Methods
			this.create = create;
			this.update = update;
			this.destroy = destroy;
			this.on = on;
			this.off = off;
			this.emit = emit;
		};
	};

	function Moon(options) {
		var root = options.root;
		delete options.root;

		if (typeof root === "string") {
			root = document.querySelector(root);
		}

		var instanceComponent = component("", options);
		var instance = new instanceComponent();

		instance.create(root);
		instance.update();

		return instance;
	}

	Moon.extend = function (name, options) {
		components[name] = component(name, options);
	};

	Moon.parse = parse;
	Moon.generate = generate;
	Moon.compile = compile;
	Moon.config = config;

	return Moon;
}));
