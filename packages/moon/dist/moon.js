/**
 * Moon v1.0.0-beta.2
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
	 * Checks if a given character is a quote.
	 *
	 * @param {string} char
	 * @returns {boolean} True if the character is a quote
	 */
	function isQuote(_char) {
		return _char === "\"" || _char === "'";
	}
	/**
	 * Logs an error message to the console.
	 * @param {string} message
	 */

	function error(message) {
		console.error("[Moon] ERROR: " + message);
	}

	/**
	 * Capture the tag name, attribute text, and closing slash from an opening tag.
	 */

	var typeRE = /<([\w\d-_]+)([^>]*?)(\/?)>/g;
	/**
	 * Capture a key, value, and expression from a list of whitespace-separated
	 * attributes. There cannot be a value and an expression, but both are captured
	 * due to the limits of regular expressions. One or both of them can be
	 * undefined.
	 */

	var attributeRE = /\s*([\w\d-_]*)(?:=(?:("[\w\d-_]*"|'[\w\d-_]*')|{([\w\d-_]*)}))?/g;
	/**
	 * Convert a token into a string, accounting for `<Text/>` components.
	 *
	 * @param {Object} token
	 * @returns {String} Token converted into a string
	 */

	function tokenString(token) {
		if (token.type === "tagOpen") {
			if (token.value === "Text") {
				var content = token.attributes[""]; // If the text content is surrounded with quotes, it was normal text
				// and doesn't need the quotes. If not, it was an expression and
				// needs to be formatted with curly braces.

				if (isQuote(content[0])) {
					return content.slice(1, -1);
				} else {
					return "{" + content + "}";
				}
			} else {
				var tag = "<" + token.value;

				for (var attributeKey in token.attributes) {
					var attributeValue = token.attributes[attributeKey];
					tag += " " + attributeKey + "=" + (isQuote(attributeValue[0]) ? attributeValue : "{" + attributeValue + "}");
				}

				if (token.closed) {
					tag += "/";
				}

				return tag + ">";
			}
		} else {
			return "</" + token.value + ">";
		}
	}
	/**
	 * Logs a lexer error message to the console along with the surrounding
	 * characters.
	 *
	 * @param {string} message
	 * @param {string} input
	 * @param {number} index
	 */

	function lexError(message, input, index) {
		var lexMessage = message + "\n\n"; // Show input characters surrounding the source of the error.

		for (var i = Math.max(0, index - 16); i < Math.min(index + 16, input.length); i++) {
			lexMessage += input[i];
		}

		error(lexMessage);
	}
	/**
	 * Lexer
	 *
	 * The lexer is responsible for taking an input view template and converting it
	 * into a list of tokens. To make the parser's job easier, it does some extra
	 * processing and handles tag names, attribute key/value pairs, and converting
	 * text into `<Text/>` components.
	 *
	 * It works by running through the input text and checking for specific initial
	 * characters such as "<", "{", or any text. After identifying the type of
	 * token, it processes each part individually until the end of the token. The
	 * lexer appends the new token to a cumulative list and eventually returns it.
	 *
	 * @param {string} input
	 * @returns {Object[]} List of tokens
	 */


	function lex(input) {
		// Remove leading and trailing whitespace because the lexer should only
		// accept one element as an input, and whitespace counts as text.
		input = input.trim();
		var tokens = [];

		for (var i = 0; i < input.length;) {
			var _char = input[i];

			if (_char === "<") {
				var charNext = input[i + 1];

				if ("development" === "development" && charNext === undefined) {
					lexError("Lexer expected a character after \"<\".", input, i);
					break;
				}

				if (charNext === "/") {
					// Append a closing tag token if a sequence of characters begins
					// with "</".
					var closeIndex = input.indexOf(">", i + 2);

					var _type = input.slice(i + 2, closeIndex);

					if ("development" === "development" && closeIndex === -1) {
						lexError("Lexer expected a closing \">\" after \"</\".", input, i);
						break;
					}

					tokens.push({
						type: "tagClose",
						value: _type
					});
					i = closeIndex + 1;
					continue;
				} else if (charNext === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
					// Ignore input if a sequence of characters begins with "<!--".
					var _closeIndex = input.indexOf("-->", i + 4);

					if ("development" === "development" && _closeIndex === -1) {
						lexError("Lexer expected a closing \"-->\" after \"<!--\".", input, i);
						break;
					}

					i = _closeIndex + 3;
					continue;
				} // Set the last searched index of the tag type regular expression to
				// the index of the character currently being processed. Since it is
				// being executed on the whole input, this is required for getting the
				// correct match and having better performance.


				typeRE.lastIndex = i; // Execute the tag type regular expression on the input and store
				// the match and captured groups.

				var typeExec = typeRE.exec(input);

				if ("development" === "development" && typeExec === null) {
					lexError("Lexer expected a valid opening or self-closing tag.", input, i);
				}

				var typeMatch = typeExec[0];
				var type = typeExec[1];
				var attributesText = typeExec[2];
				var closeSlash = typeExec[3];
				var attributes = {};
				var attributeExec = void 0; // Keep matching for new attribute key/value pairs until there are no
				// more in the attribute text.

				while ((attributeExec = attributeRE.exec(attributesText)) !== null) {
					// Store the match and captured groups.
					var attributeMatch = attributeExec[0];
					var attributeKey = attributeExec[1];
					var attributeValue = attributeExec[2];
					var attributeExpression = attributeExec[3];

					if (attributeMatch.length === 0) {
						// If nothing is matched, continue searching from the next
						// character. This is required because the attribute regular
						// expression can have empty matches and create an infinite
						// loop.
						attributeRE.lastIndex += 1;
					} else {
						// Store the key/value pair using the matched value or
						// expression.
						attributes[attributeKey] = attributeExpression === undefined ? attributeValue : attributeExpression;
					}
				} // Append an opening tag token with the type, attributes, and optional
				// self-closing slash.


				tokens.push({
					type: "tagOpen",
					value: type,
					attributes: attributes,
					closed: closeSlash === "/"
				});
				i += typeMatch.length;
			} else if (_char === "{") {
				// If a sequence of characters begins with "{", process it as an
				// expression token.
				var expression = ""; // Consume the input until the end of the expression.

				for (i += 1; i < input.length; i++) {
					var _char2 = input[i];

					if (_char2 === "}") {
						break;
					} else {
						expression += _char2;
					}
				} // Append the expression as a `<Text/>` element with the appropriate
				// text content attribute.


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
				// If nothing has matched at this point, process the input as text.
				var text = ""; // Consume the input until the start of a new tag or expression.

				for (; i < input.length; i++) {
					var _char3 = input[i];

					if (_char3 === "<" || _char3 === "{") {
						break;
					} else {
						text += _char3;
					}
				} // Append the text as a `<Text/>` element with the appropriate text
				// content attribute.


				tokens.push({
					type: "tagOpen",
					value: "Text",
					attributes: {
						"": "\"" + text + "\""
					},
					closed: true
				});
			}
		}

		return tokens;
	}

	/**
	 * Stores an error message, a slice of tokens associated with the error, and a
	 * related error for later reporting.
	 */

	function ParseError(message, start, end, next) {
		this.message = message;
		this.start = start;
		this.end = end;
		this.next = next;
	}
	/**
	 * Returns a full parse error message only if Moon is in development mode.
	 *
	 * @param {string} message
	 * @returns {string} Conditional error message
	 */


	function parseErrorMessage(message) {
		/* istanbul ignore next */
		return "development" === "development" ? message : "";
	}
	/**
	 * Given a start index, end index, and a list of tokens, return a tree after
	 * matching against the following grammar:
	 *
	 * Elements -> Empty | Element Elements
	 *
	 * The parsing algorithm is explained in more detail in the `parse` function.
	 *
	 * @param {number} start
	 * @param {number} end
	 * @param {Object[]} tokens
	 * @returns {Object} Abstract syntax tree or ParseError
	 */


	function parseElements(start, end, tokens) {
		var length = end - start;
		var error;

		if (length === 0) {
			return [];
		} else {
			for (var elementEnd = start + 1; elementEnd <= end; elementEnd++) {
				var element = parseElement(start, elementEnd, tokens);

				if (element instanceof ParseError) {
					// Store the latest error in parsing an element. This will be the
					// error with the largest possible match if all of the input tokens
					// fail to match.
					error = element;
				} else {
					var elements = parseElements(elementEnd, end, tokens);

					if (!(elements instanceof ParseError)) {
						// Combine the first element with the rest of the elements.
						var elementsAll = [element];

						for (var i = 0; i < elements.length; i++) {
							elementsAll.push(elements[i]);
						}

						return elementsAll;
					}
				}
			}

			return new ParseError(parseErrorMessage("Parser expected valid elements but encountered an error."), start, end, error);
		}
	}
	/**
	 * Given a start index, end index, and a list of tokens, return a tree after
	 * matching against the following grammar:
	 *
	 * Element -> TagSelfClosing | TagOpen Elements TagClose
	 *
	 * The parsing algorithm is explained in more detail in the `parse` function.
	 *
	 * @param {number} start
	 * @param {number} end
	 * @param {Object[]} tokens
	 * @returns {Object} Abstract syntax tree or ParseError
	 */


	function parseElement(start, end, tokens) {
		var tokenFirst = tokens[start];
		var tokenLast = tokens[end - 1];
		var length = end - start;

		if (length === 0) {
			// Return an error because this parser does not accept empty inputs.
			return new ParseError(parseErrorMessage("Parser expected an element but received nothing."), start, end);
		} else if (length === 1) {
			// The next alternate only matches on inputs with one token.
			if (tokenFirst.type === "tagOpen" && tokenFirst.closed === true) {
				// Verify that the single token is a self-closing tag, and return a
				// new element without children.
				return {
					type: tokenFirst.value,
					attributes: tokenFirst.attributes,
					children: []
				};
			} else {
				return new ParseError(parseErrorMessage("Parser expected a self-closing tag or text."), start, end);
			}
		} else {
			// If the input size is greater than one, it must be a full element with
			// both opening and closing tags that match.
			if (tokenFirst.type === "tagOpen" && tokenLast.type === "tagClose" && tokenFirst.value === tokenLast.value) {
				// Attempt to parse the inner contents as children. They must be valid
				// for the element parse to succeed.
				var children = parseElements(start + 1, end - 1, tokens);

				if (children instanceof ParseError) {
					return new ParseError(parseErrorMessage("Parser expected valid child elements but encountered an error."), start, end, children);
				} else {
					return {
						type: tokenFirst.value,
						attributes: tokenFirst.attributes,
						children: children
					};
				}
			} else {
				return new ParseError(parseErrorMessage("Parser expected an element with matching opening and closing tags."), start, end);
			}
		}
	}
	/**
	 * Parser
	 *
	 * The parser is responsible for taking a list of tokens to return an abstract
	 * syntax tree of a view template. The start and end index are passed around
	 * because it is a recursive function that is called on various sections of the
	 * tokens. Instead of passing down slices of the tokens, it is much more
	 * efficient to keep the same reference and pass new ranges. The start index is
	 * inclusive, and the end index is exclusive.
	 *
	 * The parser is built up of other parsers, including `parseElement()` and
	 * `parseElements()`. Each parser is responsible for taking an input with a
	 * length within a certain range. A parser has a set of alternates that are
	 * matched *exactly* to the input. Each alternate distributes the input in
	 * various ways across other parsers in every possible way. If an alternate
	 * matches, it is returned as a new node in the tree. If it doesn't, and any
	 * other alternates don't match either, then it returns an error.
	 *
	 * The simplest possible parser takes an input and ensures that it matches a
	 * certain sequence of tokens. This parser is built from the following
	 * structure:
	 *
	 * Element -> TagSelfClosing | TagOpen Elements TagClose
	 * Elements -> Empty | Element Elements
	 *
	 * In this case, `TagSelfClosing`, `TagOpen`, and `TagClose` are primitive
	 * parsers that ensure that the input token matches their respective token
	 * type.
	 *
	 * @param {Object[]} tokens
	 * @returns {Object} Abstract syntax tree or ParseError
	 */


	function parse(tokens) {
		var tree = parseElement(0, tokens.length, tokens);

		if ("development" === "development" && tree instanceof ParseError) {
			// Append error messages and print all of them with their corresponding
			// locations in the source.
			var parseErrors = "";
			var parseError = tree;

			do {
				parseErrors += "\n\n" + parseError.message + "\n"; // Collect the tokens responsible for the error as well as the
				// surrounding tokens.

				for (var i = Math.max(0, parseError.start - 2); i < Math.min(parseError.end + 2, tokens.length); i++) {
					parseErrors += tokenString(tokens[i]);
				}
			} while ((parseError = parseError.next) !== undefined);

			error("Parser failed to process the view." + parseErrors);
		}

		return tree;
	}

	var getElement = function getElement(element) {
		return "m" + element;
	};
	var setElement = function setElement(element, code) {
		return getElement(element) + "=" + code;
	};
	var createElement = function createElement(type) {
		return "m.ce(\"" + type + "\");";
	};
	var createTextNode = function createTextNode(content) {
		return "m.ctn(" + content + ");";
	};
	var createComment = function createComment() {
		return "m.cc();";
	};
	var attributeValue = function attributeValue(attribute) {
		return attribute.expression ? attribute.value : "\"" + attribute.value + "\"";
	};
	var setAttribute = function setAttribute(element, attribute) {
		return "m.sa(" + getElement(element) + ",\"" + attribute.key + "\"," + attributeValue(attribute) + ");";
	};
	var addEventListener = function addEventListener(element, type, handler) {
		return "m.ael(" + getElement(element) + ",\"" + type + "\"," + handler + ");";
	};
	var setTextContent = function setTextContent(element, content) {
		return "m.stc(" + getElement(element) + "," + content + ");";
	};
	var appendChild = function appendChild(element, parent) {
		return "m.ac(" + getElement(element) + "," + getElement(parent) + ");";
	};
	var removeChild = function removeChild(element, parent) {
		return "m.rc(" + getElement(element) + "," + getElement(parent) + ");";
	};
	var insertBefore = function insertBefore(element, reference, parent) {
		return "m.ib(" + getElement(element) + "," + getElement(reference) + "," + getElement(parent) + ");";
	};
	var directiveIf = function directiveIf(ifState, ifConditions, ifPortions, ifParent) {
		return "m.di(" + getElement(ifState) + "," + getElement(ifConditions) + "," + getElement(ifPortions) + "," + getElement(ifParent) + ");";
	};
	var directiveFor = function directiveFor(forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) {
		return "m.df(" + forIdentifiers + "," + getElement(forLocals) + "," + forValue + "," + getElement(forPortion) + "," + getElement(forPortions) + "," + getElement(forParent) + ");";
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

						var _createCode = setElement(element.component, "new m.c." + element.type + "();");

						var _updateCode = "";
						var dynamic = false;

						for (var _i2 = 0; _i2 < attributes.length; _i2++) {
							var attribute = attributes[_i2];

							if (attribute.key[0] === "@") {
								_createCode += getElement(element.component) + ".on(\"" + attribute.key.substring(1) + "\",function($event){locals.$event=$event;" + attributeValue(attribute) + ";});";
							} else {
								var attributeCode = getElement(element.component) + "." + attribute.key + "=" + attributeValue(attribute) + ";";

								if (attribute.dynamic) {
									dynamic = true;
									_updateCode += attributeCode;
								} else {
									_createCode += attributeCode;
								}
							}
						}

						_createCode += getElement(element.component) + ".create(" + getElement(parent.element) + ");";

						if (dynamic) {
							_updateCode += getElement(element.component) + ".update();";
						} else {
							_createCode += getElement(element.component) + ".update();";
						}

						return [_createCode, _updateCode, getElement(element.component) + ".destroy();"];
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
									_attributeCode = getElement(element.element) + ".value=" + bindVariable + ";";
									eventType = "input";
									eventHandler = bindVariable + "=$event.target.value;instance.update();";
								} else {
									_attributeCode = "";
									eventType = _attribute.key.substring(1);
									eventHandler = "locals.$event=$event;" + attributeValue(_attribute) + ";";
								}

								_createCode2 += addEventListener(element.element, eventType, "function($event){" + eventHandler + "}");
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

		var prelude = "var " + getElement(root.element);

		for (var _i5 = root.element + 1; _i5 < root.nextElement; _i5++) {
			prelude += "," + getElement(_i5);
		}

		return prelude + ";return [function(_0){" + setElement(root.element, "_0;") + create + "},function(){" + update + "},function(){" + destroy + "}];";
	};

	function compile(input) {
		return parse(lex(input));
	}

	/**
	 * Transforms data to the required data for the view. The required data
	 * consists of the expressions inside of a view that are enclosed in curly
	 * braces. These transforms are done over multiple frames to give the browser
	 * time to process other events.
	 */

	function transform() {
		this.emit("transform");
	}
	/**
	 * Creates a view mounted on the given root element.
	 *
	 * @param {Node} root
	 */


	function create(root) {
		this.view.create(root);
		this.emit("create");
	}
	/**
	 * Updates data, transforms it, and then updates the view.
	 *
	 * @param {Object} data
	 */


	function update(data) {
		for (var key in data) {
			this[key] = data[key];
		}

		this.transform(function () {
			this.view.update();
			this.emit("update");
		});
	}
	/**
	 * Destroys the view.
	 */


	function destroy() {
		this.view.destroy();
		this.emit("destroy");
	}
	/**
	 * Add an event handler to listen to a given event type.
	 *
	 * @param {string} type
	 * @param {Function} handler
	 */


	function on(type, handler) {
		var handlers = this.events[type];

		if (handlers === undefined) {
			this.events[type] = [handler.bind(this)];
		} else {
			handlers.push(handler.bind(this));
		}
	}
	/**
	 * Remove an event handler from a given event type. If no type or handler are
	 * given, all event handlers are removed. If only a type is given, all event
	 * handlers for that type are removed. If both a type and handler are given,
	 * the handler stops listening to that event type.
	 *
	 * @param {string} [type]
	 * @param {Function} [handler]
	 */


	function off(type, handler) {
		if (type === undefined) {
			this.events = {};
		} else if (handler === undefined) {
			this.events[type] = [];
		} else {
			var handlers = this.events[type];
			handlers.splice(handlers.indexOf(handler), 1);
		}
	}
	/**
	 * Emits an event and calls any handlers listening to it with the given data.
	 *
	 * @param {string} type
	 * @param data
	 */


	function emit(type, data) {
		var handlers = this.events[type];

		for (var i = 0; i < handlers.length; i++) {
			handlers[i](data);
		}
	}
	/**
	 * Moon
	 *
	 * Creates a new Moon constructor based on given data. Each Moon component is
	 * independent and has no knowledge of the parent. A component has the sole
	 * function of mapping data to a view. A component starts by creating a view
	 * with data. Every time data is set to a new object, the component updates
	 * with the new data. Each of these methods are created from compiling the view
	 * into vanilla JavaScript running on a lightweight Moon runtime. The built-in
	 * components can all be implemented in user space, but some are optimized and
	 * implemented in the compiler.
	 *
	 * The data can have a `name` property with a string representing the name of
	 * the component, "Root" by default.
	 *
	 * The data can have a `root` property with an element. Moon will automatically
	 * create a new instance and mount it to the root element provided.
	 *
	 * The data must have a `view` property with a string template or precompiled
	 * functions.
	 *
	 * Optional `onTransform`, `onCreate`, `onUpdate`, and `onDestroy` hooks can be
	 * in the data and are called when their corresponding event occurs.
	 *
	 * The rest of the data is custom starting state that will be modified as the
	 * component is passed different values. It can contain properties and methods
	 * of any type, and will have access to various utilities for creating a new
	 * state.
	 *
	 * @param {Object} data
	 * @param {string} [data.name="Root"]
	 * @param {Node|string} [data.root]
	 * @param {Function|string} data.view
	 * @param {Function} [data.onCreate]
	 * @param {Function} [data.onUpdate]
	 * @param {Function} [data.onDestroy]
	 * @returns {MoonComponent} Moon constructor or instance
	 */


	function Moon(data) {
		// Initialize the component constructor with the given data.
		function MoonComponent() {}

		MoonComponent.prototype = data;
		MoonComponent.prototype.transform = transform;
		MoonComponent.prototype.create = create;
		MoonComponent.prototype.update = update;
		MoonComponent.prototype.destroy = destroy;
		MoonComponent.prototype.on = on;
		MoonComponent.prototype.off = off;
		MoonComponent.prototype.emit = emit; // Handle the optional `name` parameter.

		data.name = data.name === undefined ? "Root" : data.name; // Ensure the view is defined, and compile it if needed.

		var view = data.view;

		if ("development" === "development" && view === undefined) {
			error("The " + data.name + " component requires a \"view\" property.");
		}

		if (typeof view === "string") {
			view = compile(view);
		}

		data.view = view; // Create default events at the beginning so that checks before calling them
		// aren't required.

		var onTransform = data.onTransform;
		var onCreate = data.onCreate;
		var onUpdate = data.onUpdate;
		var onDestroy = data.onDestroy;
		delete data.onTransform;
		delete data.onCreate;
		delete data.onUpdate;
		delete data.onDestroy;
		this.events = {};

		if (onTransform !== undefined) {
			this.events.transform = [onTransform];
		}

		if (onCreate !== undefined) {
			this.events.create = [onCreate];
		}

		if (onUpdate !== undefined) {
			this.events.update = [onUpdate];
		}

		if (onDestroy !== undefined) {
			this.events.destroy = [onDestroy];
		} // If a `root` option is given, create a new instance and mount it, or else
		// just return the constructor.


		var root = data.root;
		delete data.root;

		if (typeof root === "string") {
			root = document.querySelector(root);
		}

		if (root === undefined) {
			return MoonComponent;
		} else {
			var instance = new MoonComponent();
			instance.create(root);
			return instance;
		}
	}
	Moon.lex = lex;
	Moon.parse = parse;
	Moon.generate = generate;
	Moon.compile = compile;

	return Moon;
}));
