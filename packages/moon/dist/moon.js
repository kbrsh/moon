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
	 * View node types.
	 */
	var types = {
		element: 0,
		text: 1,
		component: 2
	};
	/**
	 * Logs an error message to the console.
	 * @param {string} message
	 */

	function error(message) {
		console.error("[Moon] ERROR: " + message);
	}
	/**
	 * Returns a value or a default fallback if the value is undefined.
	 *
	 * @param value
	 * @param fallback
	 * @returns Value or default fallback
	 */

	function defaultValue(value, fallback) {
		return value === undefined ? fallback : value;
	}

	/**
	 * Capture whitespace-only text.
	 */

	var whitespaceRE = /^\s+$/;
	/**
	 * Capture the tag name, attribute text, and closing slash from an opening tag.
	 */

	var nameRE = /<([\w\d-_]+)([^>]*?)(\/?)>/g;
	/**
	 * Capture the variables in expressions to scope them within the data
	 * parameter. This ignores property names and deep object accesses.
	 */

	var expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
	/**
	 * Capture special characters in text that need to be escaped.
	 */

	var textRE = /&amp;|&gt;|&lt;|&nbsp;|&quot;|\\|"|\n|\r/g;
	/**
	 * List of global variables to ignore in expression scoping
	 */

	var globals = ["NaN", "false", "in", "null", "this", "true", "typeof", "undefined", "window"];
	/*
	 * Map from attribute keys to equivalent DOM properties.
	 */

	var normalizeAttributeKeyMap = {
		"class": "className",
		"for": "htmlFor"
	};
	/**
	 * Map from special characters to a safe format for JavaScript string literals.
	 */

	var escapeTextMap = {
		"&amp;": "&",
		"&gt;": ">",
		"&lt;": "<",
		"&nbsp;": " ",
		"&quot;": "\\\"",
		"\\": "\\\\",
		"\"": "\\\"",
		"\n": "\\n",
		"\r": "\\r"
	};
	/**
	 * Scope an expression to use variables within the `data` object.
	 *
	 * @param {string} expression
	 * @returns {Object} Scoped expression and static status
	 */

	function scopeExpression(expression) {
		var isStatic = true;
		var value = expression.replace(expressionRE, function (match, name) {
			if (name === undefined || globals.indexOf(name) !== -1) {
				// Return a static match if there are no dynamic names or if it is a
				// global variable.
				return match;
			} else {
				// Return a dynamic match if there is a dynamic name or a local.
				isStatic = false;
				return name[0] === "$" ? name : "data." + name;
			}
		});
		return {
			value: value,
			isStatic: isStatic
		};
	}
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

				if (content.isStatic) {
					return content.value.slice(1, -1);
				} else {
					return "{" + content.value + "}";
				}
			} else {
				var tag = "<" + token.value;
				var attributes = token.attributes;

				for (var attributeKey in attributes) {
					var attributeValue = attributes[attributeKey];
					tag += " " + attributeKey + "=" + (attributeValue.isStatic ? attributeValue.value : "{" + attributeValue.value + "}");
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

					var _name = input.slice(i + 2, closeIndex);

					if ("development" === "development" && closeIndex === -1) {
						lexError("Lexer expected a closing \">\" after \"</\".", input, i);
						break;
					}

					tokens.push({
						type: "tagClose",
						value: _name
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
				} // Set the last searched index of the tag name regular expression to
				// the index of the character currently being processed. Since it is
				// being executed on the whole input, this is required for getting the
				// correct match and having better performance.


				nameRE.lastIndex = i; // Execute the tag name regular expression on the input and store the
				// match and captured groups.

				var nameExec = nameRE.exec(input);

				if ("development" === "development" && nameExec === null) {
					lexError("Lexer expected a valid opening or self-closing tag.", input, i);
				}

				var nameMatch = nameExec[0];
				var name = nameExec[1];
				var attributesText = nameExec[2];
				var closeSlash = nameExec[3];
				var attributes = {}; // Match attributes.

				for (var j = 0; j < attributesText.length; j++) {
					var charAttribute = attributesText[j];

					if (!whitespaceRE.test(charAttribute)) {
						var attributeKey = "";
						var attributeValue = "true"; // Match an attribute key.

						for (; j < attributesText.length; j++) {
							charAttribute = attributesText[j];

							if (whitespaceRE.test(charAttribute)) {
								break;
							} else if (charAttribute === "=") {
								attributeValue = "";
								break;
							} else {
								attributeKey += charAttribute;
							}
						} // Normalize the attribute key. Moon attribute keys should
						// follow camelCase by convention instead of using standard HTML
						// attribute keys.


						var attributeKeyNormalized = normalizeAttributeKeyMap[attributeKey];

						if (attributeKeyNormalized !== undefined) {
							attributeKey = attributeKeyNormalized;
						} // Match an attribute value if it exists.


						if (attributeValue.length === 0) {
							// Find a matching end quote.
							var quote = attributesText[++j];

							if (quote === "{") {
								// For expressions, ensure that the correct closing
								// delimiter is used.
								quote = "}";
							} else {
								// For strings, add the first quote to the value.
								attributeValue += quote;
							} // Skip over the first quote.


							j += 1; // Keep a stack of opened objects.

							var opened = 0; // Iterate through the value.

							for (; j < attributesText.length; j++) {
								charAttribute = attributesText[j];

								if (charAttribute === "{") {
									// Found an open object, keep track of it.
									opened += 1;
									attributeValue += charAttribute;
								} else if (charAttribute === quote) {
									// Found a potential ending quote.
									if (quote === "}") {
										// If the value is an expression, ensure that all
										// objects are closed.
										if (opened === 0) {
											if (attributeKey.charCodeAt(0) === 64) {
												// For events, pass the event handler and component data. Event
												// handlers are assumed to be dynamic because the component data
												// can change.
												attributes[attributeKey] = {
													value: "[" + scopeExpression(attributeValue).value + ",data]",
													isStatic: false
												};
											} else {
												// Set a potentially dynamic expression.
												attributes[attributeKey] = scopeExpression(attributeValue);
											} // Exit on the quote.


											break;
										} else {
											// If all objects aren't yet closed, mark one as closed.
											attributeValue += charAttribute;
											opened -= 1;
										}
									} else {
										// If the value is a string, add the closing quote.
										attributeValue += charAttribute; // Set a static key-value pair.

										attributes[attributeKey] = {
											value: attributeValue,
											isStatic: true
										}; // Exit on the quote.

										break;
									}
								} else {
									// Append characters to the value.
									attributeValue += charAttribute;
								}
							} // Skip over the closing quote.


							j += 1;
						} else {
							// When a value isn't provided, the attribute is considered a
							// Boolean value set to true.
							attributes[attributeKey] = {
								value: attributeValue,
								isStatic: true
							};
						}
					}
				} // Append an opening tag token with the name, attributes, and optional
				// self-closing slash.


				tokens.push({
					type: "tagOpen",
					value: name,
					attributes: attributes,
					closed: closeSlash === "/"
				});
				i += nameMatch.length;
			} else if (_char === "{") {
				// If a sequence of characters begins with "{", process it as an
				// expression token.
				var expression = ""; // Keep a stack of opened objects.

				var _opened = 0; // Consume the input until the end of the expression.

				for (i += 1; i < input.length; i++) {
					var _char2 = input[i];

					if (_char2 === "{") {
						_opened += 1;
						expression += _char2;
					} else if (_char2 === "}") {
						if (_opened === 0) {
							break;
						} else {
							_opened -= 1;
							expression += _char2;
						}
					} else {
						expression += _char2;
					}
				} // Append the expression as a `<text/>` element with the appropriate
				// text content attribute.


				tokens.push({
					type: "tagOpen",
					value: "text",
					attributes: {
						"": scopeExpression(expression)
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
				// content attribute if it isn't only whitespace.


				if (!whitespaceRE.test(text)) {
					tokens.push({
						type: "tagOpen",
						value: "text",
						attributes: {
							"": {
								value: "\"" + text.replace(textRE, function (match) {
									return escapeTextMap[match];
								}) + "\"",
								isStatic: true
							}
						},
						closed: true
					});
				}
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
					name: tokenFirst.value,
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
						name: tokenFirst.value,
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
	 * Global variable number
	 */
	var generateVariable;
	/**
	 * Set variable number to a new number.
	 *
	 * @param {number} newGenerateVariable
	 */

	function setGenerateVariable(newGenerateVariable) {
		generateVariable = newGenerateVariable;
	}

	/**
	 * Generates code for an `if`/`else-if`/`else` clause body.
	 *
	 * @param {number} variable
	 * @param {Object} element
	 * @param {Array} staticNodes
	 * @returns {string} clause body
	 */

	function generateClause(variable, element, staticNodes) {
		var generateBody = generateNode(element.children[0], element, 0, staticNodes);
		var clause;

		if (generateBody.isStatic) {
			// If the clause is static, then use a static node in place of it.
			clause = variable + "=m[" + staticNodes.length + "];";
			staticNodes.push(generateBody);
		} else {
			// If the clause is dynamic, then use the dynamic node.
			clause = "" + generateBody.prelude + variable + "=" + generateBody.node + ";";
		}

		return clause;
	}
	/**
	 * Generates code for a node from an `if` element.
	 *
	 * @param {Object} element
	 * @param {Object} parent
	 * @param {number} index
	 * @param {Array} staticNodes
	 * @returns {Object} Prelude code, view function code, and static status
	 */


	function generateNodeIf(element, parent, index, staticNodes) {
		var variable = "m" + generateVariable;
		var prelude = "";
		var emptyElseClause = true;
		setGenerateVariable(generateVariable + 1); // Generate the initial `if` clause.

		prelude += "var " + variable + ";if(" + element.attributes[""].value + "){" + generateClause(variable, element, staticNodes) + "}"; // Search for `else-if` and `else` clauses if there are siblings.

		if (parent !== null) {
			var siblings = parent.children;

			for (var i = index + 1; i < siblings.length;) {
				var sibling = siblings[i];

				if (sibling.name === "else-if") {
					// Generate the `else-if` clause.
					prelude += "else if(" + sibling.attributes[""].value + "){" + generateClause(variable, sibling, staticNodes) + "}"; // Remove the `else-if` clause so that it isn't generated
					// individually by the parent.

					siblings.splice(i, 1);
				} else if (sibling.name === "else") {
					// Generate the `else` clause.
					prelude += "else{" + generateClause(variable, sibling, staticNodes) + "}"; // Skip generating the empty `else` clause.

					emptyElseClause = false; // Remove the `else` clause so that it isn't generated
					// individually by the parent.

					siblings.splice(i, 1);
				} else {
					break;
				}
			}
		} // Generate an empty `else` clause represented by an empty text node.


		if (emptyElseClause) {
			prelude += "else{" + variable + "=m[" + staticNodes.length + "];}";
			staticNodes.push({
				prelude: "",
				node: "{type:" + types.text + ",name:\"text\",data:{\"\":\"\",children:[]}}",
				isStatic: true
			});
		}

		return {
			prelude: prelude,
			node: variable,
			isStatic: false
		};
	}

	/**
	 * Generates code for a node from a `for` element.
	 *
	 * @param {Object} element
	 * @param {Array} staticNodes
	 * @returns {Object} Prelude code, view function code, and static status
	 */

	function generateNodeFor(element, staticNodes) {
		var variable = "m" + generateVariable;
		var attributes = element.attributes;
		var dataLocals = attributes[""].value.split(",");
		var dataName = defaultValue(attributes.name, {
			value: "\"span\""
		}).value;
		var dataData = defaultValue(attributes.data, {
			value: "{}"
		}).value;
		var dataArray = attributes.of;
		var dataObject = attributes["in"];
		var dataKey;
		var dataValue;
		var prelude;
		setGenerateVariable(generateVariable + 1);
		var generateChild = generateNode(element.children[0], element, 0, staticNodes);
		var body;

		if (generateChild.isStatic) {
			// If the body is static, then use a static node in place of it.
			body = variable + ".children.push(m[" + staticNodes.length + "]);";
			staticNodes.push(generateChild);
		} else {
			// If the body is dynamic, then use the dynamic node in the loop body.
			body = "" + generateChild.prelude + variable + ".children.push(" + generateChild.node + ");";
		}

		if (dataArray === undefined) {
			// Generate a `for` loop over an object. The first local is the key and
			// the second is the value.
			var dataObjectValue;
			dataObject = dataObject.value;
			dataKey = dataLocals[0];

			if (dataLocals.length === 2) {
				dataValue = dataLocals[1];
				dataObjectValue = "var " + dataValue + "=" + dataObject + "[" + dataKey + "];";
			} else {
				dataObjectValue = "";
			}

			prelude = "for(var " + dataKey + " in " + dataObject + "){" + dataObjectValue + body + "}";
		} else {
			// Generate a `for` loop over an array. The first local is the value and
			// the second is the key (index).
			dataArray = dataArray.value;
			dataKey = dataLocals.length === 2 ? dataLocals[1] : "mi";
			dataValue = dataLocals[0];
			prelude = "for(var " + dataKey + "=0;" + dataKey + "<" + dataArray + ".length;" + dataKey + "++){var " + dataValue + "=" + dataArray + "[" + dataKey + "];" + body + "}";
		}

		return {
			prelude: "var " + variable + "=" + dataData + ";" + variable + ".children=[];" + prelude,
			node: "{type:" + types.element + ",name:" + dataName + ",data:" + variable + "}",
			isStatic: false
		};
	}

	/**
	 * Generates code for a node from an element.
	 *
	 * @param {Object} element
	 * @param {Object} parent
	 * @param {number} index
	 * @param {Array} staticNodes
	 * @returns {Object} Prelude code, view function code, and static status
	 */

	function generateNode(element, parent, index, staticNodes) {
		var name = element.name;
		var type;
		var isStatic = true; // Generate the correct type number for the given name.

		if (name === "if") {
			return generateNodeIf(element, parent, index, staticNodes);
		} else if (name === "for") {
			return generateNodeFor(element, staticNodes);
		} else if (name === "text") {
			type = types.text;
		} else if (name[0] === name[0].toLowerCase()) {
			type = types.element;
		} else {
			type = types.component;
		}

		var attributes = element.attributes;
		var prelude = "";
		var data = "{";
		var separator = "";

		for (var attribute in attributes) {
			var attributeValue = attributes[attribute]; // Mark the current node as dynamic if there are any events or dynamic
			// attributes.

			if (attribute[0] === "@" || !attributeValue.isStatic) {
				isStatic = false;
			}

			data += separator + "\"" + attribute + "\":" + attributeValue.value;
			separator = ",";
		}

		if (attributes.children === undefined) {
			// Generate children if they are not in the element data.
			var children = element.children;
			var generateChildren = [];
			data += separator + "children:[";
			separator = "";

			for (var i = 0; i < children.length; i++) {
				var generateChild = generateNode(children[i], element, i, staticNodes); // Mark the current node as dynamic if any child is dynamic.

				if (!generateChild.isStatic) {
					isStatic = false;
				}

				generateChildren.push(generateChild);
			}

			for (var _i = 0; _i < generateChildren.length; _i++) {
				var _generateChild = generateChildren[_i];

				if (isStatic || !_generateChild.isStatic) {
					// If the whole current node is static or the current node and
					// child node are dynamic, then append the child as a part of the
					// node as usual.
					prelude += _generateChild.prelude;
					data += separator + _generateChild.node;
				} else {
					// If the whole current node is dynamic and the child node is
					// static, then use a static node in place of the static child.
					data += separator + ("m[" + staticNodes.length + "]");
					staticNodes.push(_generateChild);
				}

				separator = ",";
			}

			data += "]";
		}

		return {
			prelude: prelude,
			node: "{type:" + type + ",name:\"" + name + "\",data:" + data + "}}",
			isStatic: isStatic
		};
	}
	/**
	 * Generator
	 *
	 * The generator is responsible for generating a function that creates a view.
	 * A view could be represented as a normal set of recursive function calls, but
	 * it uses lightweight objects to represent them instead. This allows the
	 * executor to execute the function over multiple frames with its own
	 * representation of the stack.
	 *
	 * @param {Object} element
	 * @returns {string} View function code
	 */

	function generate(element) {
		// Store static nodes.
		var staticNodes = []; // Reset generator variable.

		setGenerateVariable(0); // Generate the root node and get the prelude and node code.

		var _generateNode = generateNode(element, null, 0, staticNodes),
				prelude = _generateNode.prelude,
				node = _generateNode.node,
				isStatic = _generateNode.isStatic;

		if (isStatic) {
			// Account for a static root node.
			return "if(m[0]===undefined){" + prelude + "m[0]=" + node + ";}return m[0];";
		} else if (staticNodes.length === 0) {
			return prelude + "return " + node + ";";
		} else {
			// Generate static nodes only once at the start.
			var staticCode = "if(m[0]===undefined){";

			for (var i = 0; i < staticNodes.length; i++) {
				var staticNode = staticNodes[i];
				staticCode += staticNode.prelude + "m[" + i + "]=" + staticNode.node + ";";
			}

			staticCode += "}";
			return "" + staticCode + prelude + "return " + node + ";";
		}
	}

	function compile(input) {
		return generate(parse(lex(input)));
	}

	/**
	 * Update an ariaset, dataset, or style attribute.
	 *
	 * @param {string} key
	 * @param {Object} value
	 * @param {Object} element
	 */
	function updateAttributeSet(key, value, element) {
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
	 * Remove all the keys from an ariaset, dataset, or style attribute that aren't
	 * in `exclude`.
	 *
	 * @param {string} key
	 * @param {string} value
	 * @param {Object} exclude
	 * @param {Object} element
	 */

	function removeAttributeSet(key, value, exclude, element) {
		for (var setKey in value) {
			if (!(setKey in exclude)) {
				switch (key) {
					case "ariaset":
						element.removeAttribute("aria-" + setKey);
						break;

					case "dataset":
						delete element.dataset[key];
						break;

					default:
						element.style[key] = "";
				}
			}
		}
	}
	/**
	 * Set an event listener on an element.
	 *
	 * @param {string} type
	 * @param {Array} info
	 * @param {Object} MoonEvents
	 * @param {Object} MoonListeners
	 * @param {Object} element
	 */

	function setEvent(type, info, MoonEvents, MoonListeners, element) {
		MoonEvents[type] = info;
		element.addEventListener(type.slice(1), MoonListeners[type] = function (event) {
			var info = MoonEvents[type];
			info[0](event, info[1]);
		});
	}

	/**
	 * Global data
	 */
	var data = {};
	/**
	 * Global views
	 */

	var viewOld, viewCurrent;
	/**
	 * Global component store
	 */

	var components = {};
	/**
	 * Global static component views
	 */

	var m = {};
	/**
	 * Set old view to a new object.
	 *
	 * @param {Object} viewOld
	 */

	function setViewOld(viewOldNew) {
		viewOld = viewOldNew;
	}
	/**
	 * Set current view to a new function.
	 *
	 * @param {Function} viewCurrentNew
	 */

	function setViewCurrent(viewCurrentNew) {
		viewCurrent = viewCurrentNew;
	}

	/**
	 * Start time
	 */

	var executeStart;
	/**
	 * Execution queue
	 */

	var executeQueue = [];
	/**
	 * Types of patches
	 */

	var patchTypes = {
		updateText: 0,
		updateNode: 1,
		updateDataEvent: 2,
		updateDataSet: 3,
		updateDataProperty: 4,
		removeDataEvent: 5,
		removeDataSet: 6,
		removeDataSetExclude: 7,
		removeDataProperty: 8,
		appendNode: 9,
		removeNode: 10,
		replaceNode: 11
	};
	/**
	 * Creates an old reference node from a view node.
	 *
	 * @param {Object} node
	 * @returns {Object} node to be used as an old node
	 */

	function executeCreate(node) {
		var element;
		var children = [];

		if (node.type === types.text) {
			// Create a text node using the text content from the default key.
			element = document.createTextNode(node.data[""]);
		} else {
			var nodeData = node.data; // Create a DOM element.

			element = document.createElement(node.name); // Recursively append children.

			var nodeDataChildren = nodeData.children;

			for (var i = 0; i < nodeDataChildren.length; i++) {
				var childOld = executeCreate(nodeDataChildren[i]);
				element.appendChild(childOld.element);
				children.push(childOld);
			} // Store DOM events.


			var MoonEvents = element.MoonEvents = {};
			var MoonListeners = element.MoonListeners = {}; // Set data, events, and attributes.

			for (var key in nodeData) {
				var value = nodeData[key];

				if (key.charCodeAt(0) === 64) {
					// Set an event listener.
					setEvent(key, value, MoonEvents, MoonListeners, element);
				} else if (key === "ariaset" || key === "dataset" || key === "style") {
					// Set aria-*, data-*, and style attributes.
					updateAttributeSet(key, value, element);
				} else if (key !== "children") {
					// Set an attribute.
					element[key] = value;
				}
			}
		} // Return an old node with a reference to the immutable node and mutable
		// element. This is to help performance and allow static nodes to be reused.


		return {
			element: element,
			node: node,
			children: children
		};
	}
	/**
	 * Executes a component until it returns a usable node.
	 *
	 * @param {Object} node
	 * @returns {Object} executed component node
	 */


	function executeComponent(node) {
		while (node.type === types.component) {
			node = components[node.name](node.data);
		}

		return node;
	}
	/**
	 * Finds changes between a new and old tree and creates a list of patches to
	 * execute.
	 *
	 * @param {Array} nodesOld
	 * @param {Array} nodesNew
	 * @param {Array} patches
	 */


	function executeDiff(nodesOld, nodesNew, patches) {
		while (true) {
			var nodeOld = nodesOld.pop();
			var nodeOldNode = nodeOld.node;
			var nodeNew = executeComponent(nodesNew.pop()); // If they have the same reference (hoisted) then skip diffing.

			if (nodeOldNode !== nodeNew) {
				if (nodeOldNode.type !== nodeNew.type || nodeOldNode.name !== nodeNew.name) {
					// If they have different types or names, then replace the old node
					// with the new one.
					patches.push({
						type: patchTypes.replaceNode,
						nodeOld: nodeOld,
						nodeOldNew: executeCreate(nodeNew)
					});
				} else if (nodeOldNode.type === types.text) {
					// If they both are text, then update the text content.
					var nodeNewText = nodeNew.data[""];

					if (nodeOldNode.data[""] !== nodeNewText) {
						patches.push({
							type: patchTypes.updateText,
							nodeOld: nodeOld,
							nodeNew: nodeNew,
							nodeNewText: nodeNewText
						});
					}
				} else {
					// If they both are normal elements, then update attributes, update
					// events, and diff the children for appends, deletes, or recursive
					// updates.
					// Push a patch to change the node reference on the old node.
					patches.push({
						type: patchTypes.updateNode,
						nodeOld: nodeOld,
						nodeNew: nodeNew
					}); // Diff data.

					var nodeOldElement = nodeOld.element;
					var nodeOldNodeData = nodeOldNode.data;
					var nodeNewData = nodeNew.data;

					for (var keyNew in nodeNewData) {
						var valueOld = nodeOldNodeData[keyNew];
						var valueNew = nodeNewData[keyNew];

						if (valueOld !== valueNew && keyNew !== "children") {
							var type = void 0;

							if (keyNew.charCodeAt(0) === 64) {
								type = patchTypes.updateDataEvent;
							} else if (keyNew === "ariaset" || keyNew === "dataset" || keyNew === "style") {
								type = patchTypes.updateDataSet;

								if (valueOld !== undefined) {
									patches.push({
										type: patchTypes.removeDataSetExclude,
										keyNew: keyNew,
										valueOld: valueOld,
										valueNew: valueNew,
										nodeOldElement: nodeOldElement
									});
								}
							} else {
								type = patchTypes.updateDataProperty;
							}

							patches.push({
								type: type,
								keyNew: keyNew,
								valueNew: valueNew,
								nodeOldElement: nodeOldElement
							});
						}
					}

					for (var keyOld in nodeOldNodeData) {
						if (!(keyOld in nodeNewData)) {
							var _type = void 0;

							if (keyOld.charCodeAt(0) === 64) {
								_type = patchTypes.removeDataEvent;
							} else if (keyOld === "ariaset" || keyOld === "dataset" || keyOld === "style") {
								_type = patchTypes.removeDataSet;
							} else {
								_type = patchTypes.removeDataProperty;
							}

							patches.push({
								type: _type,
								keyOld: keyOld,
								valueOld: nodeOldNodeData[keyOld],
								nodeOldElement: nodeOldElement
							});
						}
					}

					var childrenOld = nodeOld.children;
					var childrenNew = nodeNewData.children;
					var childrenOldLength = childrenOld.length;
					var childrenNewLength = childrenNew.length;

					if (childrenOldLength === childrenNewLength) {
						// If the children have the same length then update both as
						// usual.
						for (var i = 0; i < childrenOldLength; i++) {
							nodesOld.push(childrenOld[i]);
							nodesNew.push(childrenNew[i]);
						}
					} else if (childrenOldLength > childrenNewLength) {
						// If there are more old children than new children, update the
						// corresponding ones and remove the extra old children.
						for (var _i = 0; _i < childrenNewLength; _i++) {
							nodesOld.push(childrenOld[_i]);
							nodesNew.push(childrenNew[_i]);
						}

						for (var _i2 = childrenNewLength; _i2 < childrenOldLength; _i2++) {
							patches.push({
								type: patchTypes.removeNode,
								nodeParent: nodeOld
							});
						}
					} else {
						// If there are more new children than old children, update the
						// corresponding ones and append the extra new children.
						for (var _i3 = 0; _i3 < childrenOldLength; _i3++) {
							nodesOld.push(childrenOld[_i3]);
							nodesNew.push(childrenNew[_i3]);
						}

						for (var _i4 = childrenOldLength; _i4 < childrenNewLength; _i4++) {
							patches.push({
								type: patchTypes.appendNode,
								nodeOldNew: executeCreate(executeComponent(childrenNew[_i4])),
								nodeParent: nodeOld
							});
						}
					}
				}
			}

			if (nodesOld.length === 0) {
				// Move to the patch phase if there is nothing left to do.
				executePatch(patches);
				break;
			} else if (performance.now() - executeStart >= 16) {
				// If the current frame doesn't have sufficient time left to keep
				// running then continue diffing in the next frame.
				requestAnimationFrame(function () {
					executeStart = performance.now();
					executeDiff(nodesOld, nodesNew, patches);
				});
				break;
			}
		}
	}
	/**
	 * Applies the list of patches as DOM updates.
	 *
	 * @param {Array} patches
	 */


	function executePatch(patches) {
		for (var i = 0; i < patches.length; i++) {
			var patch = patches[i];

			switch (patch.type) {
				case patchTypes.updateText:
					{
						// Update text of a node with new text.
						var nodeOld = patch.nodeOld;
						nodeOld.element.data = patch.nodeNewText;
						nodeOld.node = patch.nodeNew;
						break;
					}

				case patchTypes.updateNode:
					{
						// Update the reference of an old node.
						patch.nodeOld.node = patch.nodeNew;
						break;
					}

				case patchTypes.updateDataEvent:
					{
						// Update an event.
						var keyNew = patch.keyNew;
						var nodeOldElement = patch.nodeOldElement;
						var MoonEvents = nodeOldElement.MoonEvents;

						if (MoonEvents[keyNew] === undefined) {
							setEvent(keyNew, patch.valueNew, MoonEvents, nodeOldElement.MoonListeners, nodeOldElement);
						} else {
							MoonEvents[keyNew] = patch.valueNew;
						}

						break;
					}

				case patchTypes.updateDataSet:
					{
						// Update a set attribute.
						updateAttributeSet(patch.keyNew, patch.valueNew, patch.nodeOldElement);
						break;
					}

				case patchTypes.updateDataProperty:
					{
						// Update a DOM property.
						patch.nodeOldElement[patch.keyNew] = patch.valueNew;
						break;
					}

				case patchTypes.removeDataEvent:
					{
						// Remove an event.
						var keyOld = patch.keyOld;
						var _nodeOldElement = patch.nodeOldElement;
						var MoonListeners = _nodeOldElement.MoonListeners;

						_nodeOldElement.removeEventListener(MoonListeners[keyOld]);

						delete _nodeOldElement.MoonEvents[keyOld];
						delete MoonListeners[keyOld];
						break;
					}

				case patchTypes.removeDataSet:
					{
						// Remove a set property.
						removeAttributeSet(patch.keyOld, patch.valueOld, {}, patch.nodeOldElement);
						break;
					}

				case patchTypes.removeDataSetExclude:
					{
						// Remove a set property while excluding new values.
						removeAttributeSet(patch.keyOld, patch.valueOld, patch.valueNew, patch.nodeOldElement);
						break;
					}

				case patchTypes.removeDataProperty:
					{
						// Remove a DOM property.
						patch.nodeOldElement.removeAttribute(patch.keyOld);
						break;
					}

				case patchTypes.appendNode:
					{
						// Append a node to the parent.
						var nodeParent = patch.nodeParent;
						var nodeOldNew = patch.nodeOldNew;
						nodeParent.element.appendChild(nodeOldNew.element);
						nodeParent.children.push(nodeOldNew);
						break;
					}

				case patchTypes.removeNode:
					{
						// Remove a node from the parent.
						var _nodeParent = patch.nodeParent; // Pops the last child because the patches still hold a reference
						// to them. The diff phase can only create this patch when there
						// are extra old children, and popping nodes off of the end is more
						// efficient than removing at a specific index, especially because
						// they are equivalent in this case.

						_nodeParent.element.removeChild(_nodeParent.children.pop().element);

						break;
					}

				case patchTypes.replaceNode:
					{
						// Replaces an old node with a new node.
						var _nodeOld = patch.nodeOld;
						var _nodeOldElement2 = _nodeOld.element;
						var _nodeOldNew = patch.nodeOldNew;
						var nodeOldNewElement = _nodeOldNew.element;

						_nodeOldElement2.parentNode.replaceChild(nodeOldNewElement, _nodeOldElement2);

						_nodeOld.element = nodeOldNewElement;
						_nodeOld.node = _nodeOldNew.node;
						_nodeOld.children = _nodeOldNew.children;
						break;
					}
			}
		} // Remove the current execution from the queue.


		executeQueue.shift(); // If there is new data in the execution queue, continue to it.

		if (executeQueue.length !== 0) {
			if (performance.now() - executeStart >= 16) {
				// If the current frame doesn't have sufficient time left to keep
				// running then start the next execution in the next frame.
				requestAnimationFrame(function () {
					executeStart = performance.now();
					executeNext();
				});
			} else {
				executeNext();
			}
		}
	}
	/**
	 * Execute the next update in the execution queue.
	 */


	function executeNext() {
		// Get the next data update.
		var dataNew = executeQueue[0]; // Merge new data into current data.

		for (var key in dataNew) {
			data[key] = dataNew[key];
		} // Begin the diff phase.


		executeDiff([viewOld], [viewCurrent(data)], []);
	}
	/**
	 * Executor
	 *
	 * The executor runs in two phases.
	 *
	 * 1. Diff
	 * 2. Patch
	 *
	 * The diff phase consists of walking the old and new tree while finding
	 * differences. The differences are pushed as individual patches to a global
	 * list of them. Components are also executed in this phase. This is run over
	 * multiple frames because finding differences between large component trees
	 * can take a while, especially from long lists.
	 *
	 * The patch phase consists of iterating through the patches and applying all
	 * of them to mutate the DOM. These boil down to primitive DOM operations that
	 * are all batched together to update the view. Rather than doing it along with
	 * the diff phase, the patch is done in one frame to prevent an inconsistent
	 * UI -- similar to screen tearing.
	 *
	 * @param {Object} dataNew
	 */


	function execute(dataNew) {
		// Push the new data to the execution queue.
		executeQueue.push(dataNew); // Execute the next function in the queue if none are scheduled yet.

		if (executeQueue.length === 1) {
			requestAnimationFrame(function () {
				executeStart = performance.now();
				executeNext();
			});
		}
	}

	/**
	 * Moon
	 *
	 * Creates a new Moon component or root based on given options. Each Moon
	 * component is independent and has no knowledge of the parent. A component is
	 * a function mapping data to a view. The component can update global data to
	 * recreate the view. In Moon, the view is defined as a function over data, and
	 * components are just helper functions.
	 *
	 * The options can have a `root` property with an element. Moon will
	 * automatically create the component and append it to the root element
	 * provided if the component name is "Root". This makes the data the source of
	 * true state that is accessible for updates by every component.
	 *
	 * The options must have a `view` property with a string template or
	 * precompiled functions.
	 *
	 * The `data` option is custom and can be thought of as a default. This data is
	 * immutable, and the component updates global data instead of having local
	 * state.
	 *
	 * @param {Object} options
	 * @param {string} [options.name]
	 * @param {Object|string} [options.root]
	 * @param {Object} [options.data]
	 * @param {Object|string} options.view
	 */

	function Moon(options) {
		// Handle the optional `name` parameter.
		var name = defaultValue(options.name, "Root"); // Handle the optional default `data`.

		var dataDefault = defaultValue(options.data, {}); // Ensure the view is defined, and compile it if needed.

		var view = options.view;

		if ("development" === "development" && view === undefined) {
			error("The " + name + " component requires a \"view\" property.");
		}

		if (typeof view === "string") {
			view = new Function("m", "data", compile(view));
		} // Create a list of static nodes for the view function.


		m[name] = []; // Create a wrapper view function that maps data to the compiled view
		// function. The compiled view function takes `m`, which holds static nodes.
		// The data is also processed so that `options` acts as a default.

		var viewComponent = function viewComponent(data) {
			for (var key in dataDefault) {
				if (!(key in data)) {
					data[key] = dataDefault[key];
				}
			}

			return view(m[name], data);
		};

		if (name === "Root") {
			// Mount to the `root` element and begin execution when the component is
			// the "Root" component.
			var root = options.root;

			if (typeof root === "string") {
				root = document.querySelector(root);
			}

			if ("development" === "development" && root === undefined) {
				error("The \"Root\" component requires a \"root\" property.");
			} // Start the root renderer.


			var rootAttributes = root.attributes;
			var dataNode = {
				children: []
			};

			for (var i = 0; i < rootAttributes.length; i++) {
				var rootAttribute = rootAttributes[i];
				dataNode[rootAttribute.name] = rootAttribute.value;
			}

			setViewOld({
				element: root,
				node: {
					type: types.element,
					name: root.tagName.toLowerCase(),
					data: dataNode
				},
				children: []
			});
			setViewCurrent(viewComponent);
			execute(options);
		} else {
			// Store it as a component if no `root` is given.
			components[name] = viewComponent;
		}
	}
	Moon.lex = lex;
	Moon.parse = parse;
	Moon.generate = generate;
	Moon.compile = compile;
	Moon.components = components;
	Moon.get = data;
	Moon.set = execute;

	return Moon;
}));
