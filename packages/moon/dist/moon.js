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

	var attributeRE = /\s*([\w\d-_]*)(?:=(?:("[^"]*"|'[^']*')|{([^{}]*)}))?/g;
	/**
	 * Convert a token into a string, accounting for `<text/>` components.
	 *
	 * @param {Object} token
	 * @returns {String} Token converted into a string
	 */

	function tokenString(token) {
		if (token.type === "tagOpen") {
			if (token.value === "text") {
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
	 * text into `<text/>` components.
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
				} // Append the expression as a `<text/>` element with the appropriate
				// text content attribute.


				tokens.push({
					type: "tagOpen",
					value: "text",
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
				} // Append the text as a `<text/>` element with the appropriate text
				// content attribute.


				tokens.push({
					type: "tagOpen",
					value: "text",
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

	/**
	 * Generates code for an object.
	 *
	 * @param {Object} obj
	 * @returns {string} Code for object
	 */
	function generateObject(obj) {
		var output = "{";

		for (var key in obj) {
			output += "\"" + key + "\":" + obj[key] + ",";
		}

		return output + "}";
	}

	/**
	 * Set of instructions that the compiler can output.
	 */
	var instructions = {
		createElement: 0 | 3 << 4,
		// storage, type, attributes
		updateElement: 1 | 2 << 4,
		// element, attributes
		createText: 2 | 2 << 4,
		// storage, content
		updateText: 3 | 2 << 4,
		// element, content
		destroyElement: 4 | 1 << 4,
		// element
		appendElement: 5 | 2 << 4,
		// element, parent element
		createComponent: 6 | 3 << 4,
		// storage, component name, data
		updateComponent: 7 | 2 << 4,
		// component instance, data
		destroyComponent: 8 | 1 << 4,
		// component instance
		"return": 9 | 0 << 4,
		returnVar: 10 | 1 << 4 // var

	};
	/**
	 * Returns an instruction from the given type and arguments.
	 */

	function instruction(type, args) {
		var code = String.fromCharCode(type);

		for (var i = 0; i < args.length; i++) {
			code += String.fromCharCode(args[i]);
		}

		return code;
	}

	/**
	 * Generates code for an element.
	 *
	 * @param {Object} element
	 * @param {Object} data
	 * @param {number} total
	 */

	function generateElement(element, data, total) {
		var elementType = "\"" + element.type + "\"";
		var elementAttributes = generateObject(element.attributes);
		var elementVar = total++;
		var elementNameVar = data[elementType];
		var elementAttributesVar = data[elementAttributes];

		if (elementNameVar === undefined) {
			elementNameVar = data[elementType] = total++;
		}

		if (elementAttributesVar === undefined) {
			elementAttributesVar = data[elementAttributes] = total++;
		}

		var childrenCreate = "";
		var childrenUpdate = "";
		var childrenDestroy = "";

		for (var i = 0; i < element.children.length; i++) {
			var child = element.children[i];
			var childCode = generateAll(child, data, total);
			childrenCreate += childCode.create;
			childrenCreate += instruction(instructions.appendElement, [childCode.createVar, elementVar]);
			childrenUpdate += childCode.update;
			childrenDestroy += childCode.destroy;
			total = childCode.total;
		}

		return {
			create: instruction(instructions.createElement, [elementVar, elementNameVar, elementAttributesVar]) + childrenCreate,
			createVar: elementVar,
			update: instruction(instructions.updateElement, [elementVar]) + childrenUpdate,
			destroy: instruction(instructions.destroyElement, [elementVar]) + childrenDestroy,
			total: total
		};
	}

	/**
	 * Generates code for a text element.
	 *
	 * @param {Object} text
	 * @param {Object} data
	 * @param {number} total
	 */

	function generateText(text, data, total) {
		var textVar = total++;
		var textContent = text.attributes[""];
		var textContentVar = data[textContent];

		if (textContentVar === undefined) {
			textContentVar = data[textContent] = total++;
		}

		return {
			create: instruction(instructions.createText, [textVar, textContentVar]),
			createVar: textVar,
			update: instruction(instructions.updateText, [textContentVar]),
			destroy: instruction(instructions.destroyElement, [textVar]),
			total: total
		};
	}

	/**
	 * Generates instructions for creating, updating, and destroying the given
	 * tree. Updates the data object with a mapping from expression to variable.
	 * The `total` argument represents the total number of data mappings.
	 *
	 * @param {Object} tree
	 * @param {Object} data
	 * @param {number} total
	 * @return {Object} Data, create, update, and destroy functions
	 */

	function generateAll(tree, data, total) {
		var type = tree.type;

		if (type === "text") {
			return generateText(tree, data, total);
		} else if (type[0] === type[0].toLowerCase()) {
			// Tags that start with a lowercase letter are normal HTML elements. This
			// could be implemented as a user-defined component but is implemented
			// here for efficiency.
			return generateElement(tree, data, total);
		}
	}
	/**
	 * Generator
	 *
	 * The generator is responsible for generating instructions that create a view.
	 * These instructions create, update, and destroy components. For efficiency,
	 * they also handle elements to remove a layer of abstraction. The instructions
	 * are ran across multiple frames to allow the browser to handle other events.
	 *
	 * @param {Object} tree
	 * @returns {Object} Data, create, update, and destroy functions
	 */

	function generate(tree) {
		var data = {};

		var _generateAll = generateAll(tree, data, 0),
				create = _generateAll.create,
				createVar = _generateAll.createVar,
				update = _generateAll.update,
				destroy = _generateAll.destroy;

		var dataCode = "";

		for (var key in data) {
			dataCode += "this.m" + data[key] + "=" + key + ";";
		}

		create += instruction(instructions.returnVar, [createVar]);
		return {
			data: new Function(dataCode),
			create: create,
			update: update,
			destroy: destroy
		};
	}

	function compile(input) {
		return generate(parse(lex(input)));
	}

	/**
	 * Gets a value from the executor data given a variable index.
	 *
	 * @param {number} index
	 * @param {Object} data
	 * @returns Value from data
	 */

	function executeGet(index, data) {
		return data["m" + index];
	}
	/**
	 * Sets a value from the executor data given a variable index.
	 *
	 * @param {number} index
	 * @param value
	 * @param {Object} data
	 * @returns Value from data
	 */


	function executeSet(index, value, data) {
		data["m" + index] = value;
	}
	/**
	 * Executor
	 *
	 * The executor is responsible for executing instructions passed to it. It
	 * starts at the given start index and calls the `next` callback when it's
	 * done. It runs the instructions over multiple frames to allow the browser to
	 * handle other high-priority events.
	 *
	 * @param {number} index
	 * @param {number} start
	 * @param {Object} data
	 * @param {string} code
	 * @param {Function} next
	 */


	function execute(index, start, data, code, next) {
		var i = index;

		while (i < code.length) {
			switch (code.charCodeAt(i)) {
				case instructions.createElement:
					{
						var storage = code.charCodeAt(++i);
						var element = document.createElement(executeGet(code.charCodeAt(++i), data));
						var attributes = executeGet(code.charCodeAt(++i), data);

						for (var attribute in attributes) {
							element.setAttribute(attribute, attributes[attribute]);
						}

						executeSet(storage, element, data);
						i += 1;
						break;
					}

				case instructions.updateElement:
					{
						var _element = executeGet(code.charCodeAt(++i), data);

						var _attributes = executeGet(code.charCodeAt(++i), data);

						for (var _attribute in _attributes) {
							_element.setAttribute(_attribute, _attributes[_attribute]);
						}

						i += 1;
						break;
					}

				case instructions.createText:
					{
						executeSet(code.charCodeAt(++i), document.createTextNode(executeGet(code.charCodeAt(++i), data)), data);
						i += 1;
						break;
					}

				case instructions.updateText:
					{
						var text = executeGet(code.charCodeAt(++i), data);
						var content = executeGet(code.charCodeAt(++i), data);
						text.textContent = content;
						i += 1;
						break;
					}

				case instructions.destroyElement:
					{
						var _element2 = executeGet(code.charCodeAt(++i), data);

						_element2.parentNode.destroyChild(_element2);

						i += 1;
						break;
					}

				case instructions.appendElement:
					{
						var _element3 = executeGet(code.charCodeAt(++i), data);

						var parent = executeGet(code.charCodeAt(++i), data);
						parent.appendChild(_element3);
						i += 1;
						break;
					}

				case instructions.returnVar:
					{
						next(executeGet(code.charCodeAt(++i), data));
						return;
					}
			}

			if (performance.now() - start >= 8) {
				requestAnimationFrame(function () {
					execute(i, performance.now(), data, code, next);
				});
				break;
			}
		}
	}

	/**
	 * Global component store.
	 */

	var components = {};
	/**
	 * Creates a view element over multiple frames and calls the given function
	 * with the new element.
	 *
	 * @param {Function} [next]
	 * @param {number} [start]
	 */

	function create(next, start) {
		var _this = this;

		this.view.data();
		execute(0, start === undefined ? performance.now() : start, this, this.view.create, function (element) {
			_this.emit("create", element);

			if (next !== undefined) {
				next(element);
			}
		});
	}
	/**
	 * Updates data and the view over multiple frames and calls the given function.
	 *
	 * @param {Object} data
	 * @param {Function} [next]
	 * @param {number} [start]
	 */


	function update(data, next, start) {
		var _this2 = this;

		for (var key in data) {
			this[key] = data[key];
		}

		execute(0, start === undefined ? performance.now() : start, this, this.view.update, function () {
			_this2.emit("update");

			if (next !== undefined) {
				next();
			}
		});
	}
	/**
	 * Destroys the view over multiple frames and calls the given function.
	 *
	 * @param {Function} [next]
	 * @param {number} [start]
	 */


	function destroy(next, start) {
		var _this3 = this;

		execute(0, start === undefined ? performance.now() : start, this, this.view.destroy, function () {
			_this3.emit("destroy");

			if (next !== undefined) {
				next();
			}
		});
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
	 * Optional `onCreate`, `onUpdate`, and `onDestroy` hooks can be
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
	 * @param {Object|string} data.view
	 * @param {Function} [data.onCreate]
	 * @param {Function} [data.onUpdate]
	 * @param {Function} [data.onDestroy]
	 * @returns {MoonComponent} Moon constructor or instance
	 */


	function Moon(data) {
		// Handle the optional `name` parameter.
		data.name = data.name === undefined ? "Root" : data.name; // Ensure the view is defined, and compile it if needed.

		var view = data.view;

		if ("development" === "development" && view === undefined) {
			error("The " + data.name + " component requires a \"view\" property.");
		}

		if (typeof view === "string") {
			data.view = compile(view);
		} // Create default events at the beginning so that checks before calling them
		// aren't required.


		var onCreate = data.onCreate;
		var onUpdate = data.onUpdate;
		var onDestroy = data.onDestroy;
		delete data.onCreate;
		delete data.onUpdate;
		delete data.onDestroy;
		data.events = {
			create: [],
			update: [],
			destroy: []
		};

		if (onCreate !== undefined) {
			data.events.create.push(onCreate);
		}

		if (onUpdate !== undefined) {
			data.events.update.push(onUpdate);
		}

		if (onDestroy !== undefined) {
			data.events.destroy.push(onDestroy);
		} // Initialize the component constructor with the given data, given view, and
		// default methods.


		function MoonComponent(data) {
			this.view.data = this.view.data.bind(this);

			for (var key in data) {
				this[key] = data[key];
			}
		}

		MoonComponent.prototype = data;
		MoonComponent.prototype.m = [];
		MoonComponent.prototype.create = create;
		MoonComponent.prototype.update = update;
		MoonComponent.prototype.destroy = destroy;
		MoonComponent.prototype.on = on;
		MoonComponent.prototype.off = off;
		MoonComponent.prototype.emit = emit; // If a `root` option is given, create a new instance and mount it, or else
		// just return the constructor.

		var root = data.root;
		delete data.root;

		if (typeof root === "string") {
			root = document.querySelector(root);
		}

		if (root === undefined) {
			components[name] = MoonComponent;
			return MoonComponent;
		} else {
			var instance = new MoonComponent();
			instance.create(function (instanceElement) {
				root.appendChild(instanceElement);
			});
			return instance;
		}
	}
	Moon.lex = lex;
	Moon.parse = parse;
	Moon.generate = generate;
	Moon.compile = compile;
	Moon.execute = execute;
	Moon.components = components;

	return Moon;
}));
