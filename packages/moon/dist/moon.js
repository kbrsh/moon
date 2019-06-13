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
	 * Scope an expression to use variables within the `md` object.
	 *
	 * @param {string} expression
	 * @returns {Object} scoped expression and static status
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
				return name[0] === "$" ? name : "md." + name;
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
	 * @returns {string} token converted into a string
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
	 * @returns {Object[]} list of tokens
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
												// For events, pass the event handler,
												// component data, and component children.
												// Event handlers are assumed to be dynamic
												// because the component data or children can
												// change.
												attributes[attributeKey] = {
													value: "[" + scopeExpression(attributeValue).value + ",md,mc]",
													isStatic: false
												};
											} else {
												// Set a potentially dynamic expression.
												attributes[attributeKey] = scopeExpression(attributeValue);
											} // Exit on the quote.


											break;
										} else {
											// If all objects aren't yet closed, mark one as
											// closed.
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
	 * @returns {string} conditional error message
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
	 * @returns {Object} abstract syntax tree or ParseError
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
	 * @returns {Object} abstract syntax tree or ParseError
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
	 * @returns {Object} abstract syntax tree or ParseError
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
	 * Generates code for a node from an `element` element.
	 *
	 * @param {Object} element
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */

	function generateNodeElement(element, variable, staticParts) {
		var attributes = element.attributes;
		var name = attributes.name;
		var data = attributes.data;
		var children = attributes.children;
		var dataIsStatic = data.isStatic;
		var isStatic = name.isStatic && dataIsStatic && children.isStatic;
		var dataValue = data.value;

		if (!isStatic && dataIsStatic) {
			var staticVariable = staticParts.length;
			staticParts.push("ms[" + staticVariable + "]=" + dataValue + ";");
			dataValue = "ms[" + staticVariable + "]";
		}

		return {
			prelude: "",
			node: "m(" + types.element + "," + name.value + "," + dataValue + "," + children.value + ")",
			isStatic: isStatic,
			variable: variable
		};
	}

	/**
	 * Generates code for an `if`/`else-if`/`else` clause body.
	 *
	 * @param {number} variableIf
	 * @param {Object} element
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @returns {string} clause body and variable
	 */

	function generateClause(variableIf, element, variable, staticParts) {
		var generateBody = generateNode(element.children[0], element, 0, variable, staticParts);
		var clause;

		if (generateBody.isStatic) {
			// If the clause is static, then use a static node in place of it.
			var staticVariable = staticParts.length;
			staticParts.push(generateBody.prelude + "ms[" + staticVariable + "]=" + generateBody.node + ";");
			clause = variableIf + "=ms[" + staticVariable + "];";
		} else {
			// If the clause is dynamic, then use the dynamic node.
			clause = "" + generateBody.prelude + variableIf + "=" + generateBody.node + ";";
		}

		return {
			clause: clause,
			variable: generateBody.variable
		};
	}
	/**
	 * Generates code for a node from an `if` element.
	 *
	 * @param {Object} element
	 * @param {Object} parent
	 * @param {number} index
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */


	function generateNodeIf(element, parent, index, variable, staticParts) {
		var variableIf = "m" + variable;
		var prelude = "";
		var emptyElseClause = true; // Generate the initial `if` clause.

		var clauseIf = generateClause(variableIf, element, variable + 1, staticParts);
		prelude += "var " + variableIf + ";if(" + element.attributes[""].value + "){" + clauseIf.clause + "}";
		variable = clauseIf.variable; // Search for `else-if` and `else` clauses if there are siblings.

		if (parent !== null) {
			var siblings = parent.children;

			for (var i = index + 1; i < siblings.length;) {
				var sibling = siblings[i];

				if (sibling.name === "else-if") {
					// Generate the `else-if` clause.
					var clauseElseIf = generateClause(variableIf, sibling, variable, staticParts);
					prelude += "else if(" + sibling.attributes[""].value + "){" + clauseElseIf.clause + "}";
					variable = clauseElseIf.variable; // Remove the `else-if` clause so that it isn't generated
					// individually by the parent.

					siblings.splice(i, 1);
				} else if (sibling.name === "else") {
					// Generate the `else` clause.
					var clauseElse = generateClause(variableIf, sibling, variable, staticParts);
					prelude += "else{" + clauseElse.clause + "}";
					variable = clauseElse.variable; // Skip generating the empty `else` clause.

					emptyElseClause = false; // Remove the `else` clause so that it isn't generated
					// individually by the parent.

					siblings.splice(i, 1);
				} else {
					break;
				}
			}
		} // Generate an empty `else` clause represented by an empty text node.


		if (emptyElseClause) {
			var staticVariable = staticParts.length;
			staticParts.push("ms[" + staticVariable + "]=m(" + types.text + ",\"text\",{\"\":\"\"},[]);");
			prelude += "else{" + variableIf + "=ms[" + staticVariable + "];}";
		}

		return {
			prelude: prelude,
			node: variableIf,
			isStatic: false,
			variable: variable
		};
	}

	/**
	 * Generates code for a node from a `for` element.
	 *
	 * @param {Object} element
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */

	function generateNodeFor(element, variable, staticParts) {
		var variableFor = "m" + variable;
		var attributes = element.attributes;
		var dataLocals = attributes[""].value.split(",");
		var dataName = defaultValue(attributes.name, {
			value: "\"span\""
		}).value;
		var dataData = defaultValue(attributes.data, {
			value: "{}",
			isStatic: true
		});
		var dataArray = attributes.of;
		var dataObject = attributes["in"];
		var dataKey;
		var dataValue;
		var prelude;
		var generateChild = generateNode(element.children[0], element, 0, variable + 1, staticParts);
		var body;
		variable = generateChild.variable;

		if (generateChild.isStatic) {
			// If the body is static, then use a static node in place of it.
			var staticVariable = staticParts.length;
			staticParts.push(generateChild.prelude + "ms[" + staticVariable + "]=" + generateChild.node + ";");
			body = variableFor + ".push(ms[" + staticVariable + "]);";
		} else {
			// If the body is dynamic, then use the dynamic node in the loop body.
			body = "" + generateChild.prelude + variableFor + ".push(" + generateChild.node + ");";
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
			dataKey = dataLocals.length === 2 ? dataLocals[1] : "m" + variable++;
			dataValue = dataLocals[0];
			prelude = "for(var " + dataKey + "=0;" + dataKey + "<" + dataArray + ".length;" + dataKey + "++){var " + dataValue + "=" + dataArray + "[" + dataKey + "];" + body + "}";
		}

		if (dataData.isStatic) {
			var _staticVariable = staticParts.length;
			staticParts.push("ms[" + _staticVariable + "]=" + dataData.value + ";");
			dataData = "ms[" + _staticVariable + "]";
		} else {
			dataData = dataData.value;
		}

		return {
			prelude: "var " + variableFor + "=[];" + prelude,
			node: "m(" + types.element + "," + dataName + "," + dataData + "," + variableFor + ")",
			isStatic: false,
			variable: variable
		};
	}

	/**
	 * Generates code for a node from an element.
	 *
	 * @param {Object} element
	 * @param {Object} parent
	 * @param {number} index
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */

	function generateNode(element, parent, index, variable, staticParts) {
		var name = element.name;
		var type;
		var staticData = true;
		var staticChildren = true; // Generate the correct type number for the given name.

		if (name === "element") {
			return generateNodeElement(element, variable, staticParts);
		} else if (name === "if") {
			return generateNodeIf(element, parent, index, variable, staticParts);
		} else if (name === "for") {
			return generateNodeFor(element, variable, staticParts);
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
		var children = "[";
		var separator = "";

		for (var attribute in attributes) {
			var attributeValue = attributes[attribute]; // Mark the data as dynamic if there are any dynamic attributes.

			if (!attributeValue.isStatic) {
				staticData = false;
			}

			data += separator + "\"" + attribute + "\":" + attributeValue.value;
			separator = ",";
		}

		data += "}"; // Generate children.

		var elementChildren = element.children;
		var generateChildren = [];
		separator = "";

		for (var i = 0; i < elementChildren.length; i++) {
			var generateChild = generateNode(elementChildren[i], element, i, variable, staticParts); // Mark the children as dynamic if any child is dynamic.

			if (!generateChild.isStatic) {
				staticChildren = false;
			} // Update the variable counter.


			variable = generateChild.variable;
			generateChildren.push(generateChild);
		} // Mark the node as static if the data and children are static.


		var isStatic = staticData && staticChildren;

		for (var _i = 0; _i < generateChildren.length; _i++) {
			var _generateChild = generateChildren[_i];

			if (isStatic || !_generateChild.isStatic) {
				// If the whole current node is static or the current node and child
				// node are dynamic, then append the child as a part of the node as
				// usual.
				prelude += _generateChild.prelude;
				children += separator + _generateChild.node;
			} else {
				// If the whole current node is dynamic and the child node is static,
				// then use a static node in place of the static child.
				var staticVariable = staticParts.length;
				staticParts.push(_generateChild.prelude + "ms[" + staticVariable + "]=" + _generateChild.node + ";");
				children += separator + ("ms[" + staticVariable + "]");
			}

			separator = ",";
		}

		children += "]";

		if (staticData && !staticChildren) {
			// If only the data is static, hoist it out.
			var _staticVariable = staticParts.length;
			staticParts.push("ms[" + _staticVariable + "]=" + data + ";");
			data = "ms[" + _staticVariable + "]";
		} else if (!staticData && staticChildren) {
			// If only the children are static, hoist them out.
			var _staticVariable2 = staticParts.length;
			staticParts.push("ms[" + _staticVariable2 + "]=" + children + ";");
			children = "ms[" + _staticVariable2 + "]";
		}

		return {
			prelude: prelude,
			node: "m(" + type + ",\"" + name + "\"," + data + "," + children + ")",
			isStatic: isStatic,
			variable: variable
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
	 * @returns {string} view function code
	 */

	function generate(element) {
		// Store static parts.
		var staticParts = []; // Generate the root node and get the prelude and node code.

		var _generateNode = generateNode(element, null, 0, 0, staticParts),
				prelude = _generateNode.prelude,
				node = _generateNode.node,
				isStatic = _generateNode.isStatic;

		if (isStatic) {
			// Account for a static root node.
			return "if(ms[0]===undefined){" + prelude + "ms[0]=" + node + ";}return ms[0];";
		} else {
			// Generate static parts only once at the start.
			return "if(ms[0]===undefined){" + staticParts.join("") + "}" + prelude + "return " + node + ";";
		}
	}

	/**
	 * Compiles an input into a function that returns a Moon view node.
	 *
	 * @param {string} input
	 * @returns {string} view function code
	 */

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
			info[0](event, info[1], info[2]);
		});
	}

	/**
	 * Global views
	 */
	var viewOld, viewCurrent, viewNew;
	/**
	 * Global component store
	 */

	var components = {};
	/**
	 * Global data
	 */

	var md = {};
	/**
	 * Global children
	 */

	var mc = [];
	/**
	 * Global static component views
	 */

	var ms = {};
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
	 * Set new view to a new object.
	 *
	 * @param {Object} viewNewNew
	 */

	function setViewNew(viewNewNew) {
		viewNew = viewNewNew;
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
			// Create a DOM element.
			element = document.createElement(node.name); // Recursively append children.

			var nodeChildren = node.children;

			for (var i = 0; i < nodeChildren.length; i++) {
				var childOld = executeCreate(nodeChildren[i]);
				element.appendChild(childOld.element);
				children.push(childOld);
			} // Store DOM events.


			var MoonEvents = element.MoonEvents = {};
			var MoonListeners = element.MoonListeners = {}; // Set data.

			var nodeData = node.data;

			for (var key in nodeData) {
				var value = nodeData[key];

				if (key.charCodeAt(0) === 64) {
					// Set an event listener.
					setEvent(key, value, MoonEvents, MoonListeners, element);
				} else if (key === "ariaset" || key === "dataset" || key === "style") {
					// Set aria-*, data-*, and style attributes.
					updateAttributeSet(key, value, element);
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
	 * Executes a view, including all components.
	 *
	 * @param {Array} nodesOld
	 * @param {Array} nodesNew
	 */


	function executeView(nodes) {
		while (true) {
			var node = nodes.pop();
			var nodeChildren = node.children;

			while (node.type === types.component) {
				// Execute the component to get the component view.
				var nodeName = node.name;
				var nodeComponent = components[nodeName](m, node.data, nodeChildren, ms[nodeName]); // Update the node to reflect the component view.

				node.type = nodeComponent.type;
				node.name = nodeComponent.name;
				node.data = nodeComponent.data;
				nodeChildren = node.children = nodeComponent.children;
			} // Execute the views of the children.


			for (var i = 0; i < nodeChildren.length; i++) {
				nodes.push(nodeChildren[i]);
			}

			if (nodes.length === 0) {
				// Move to the patch phase if there is nothing left to do.
				executePatch(viewOld, viewNew); // Remove the current execution from the queue.

				executeQueue.shift(); // If there is new data in the execution queue, continue to it.

				if (executeQueue.length !== 0) {
					if (Date.now() - executeStart >= 16) {
						// If the current frame doesn't have sufficient time left to keep
						// running then start the next execution in the next frame.
						requestAnimationFrame(function () {
							executeStart = Date.now();
							executeNext();
						});
					} else {
						executeNext();
					}
				}

				break;
			} else if (Date.now() - executeStart >= 16) {
				// If the current frame doesn't have sufficient time left to keep
				// running then continue executing the view in the next frame.
				requestAnimationFrame(function () {
					executeStart = Date.now();
					executeView(nodes);
				});
				break;
			}
		}
	}
	/**
	 * Transforms an old node into a new one, making changes to the DOM as needed.
	 *
	 * @param {Object} nodeOld
	 * @param {Object} nodeNew
	 */


	function executePatch(nodeOld, nodeNew) {
		var nodeOldNode = nodeOld.node;

		if (nodeOldNode !== nodeNew) {
			// Update the old node reference. This doesn't affect the rest of the
			// patch because it uses `nodeOldNode` instead of direct property access.
			nodeOld.node = nodeNew;

			if (nodeOldNode.type !== nodeNew.type || nodeOldNode.name !== nodeNew.name) {
				// If the types or name aren't the same, then replace the old node
				// with the new one.
				var nodeOldElement = nodeOld.element;
				var nodeOldNew = executeCreate(nodeNew);
				var nodeOldNewElement = nodeOldNew.element;
				nodeOld.element = nodeOldNewElement;
				nodeOld.children = nodeOldNew.children;
				nodeOldElement.parentNode.replaceChild(nodeOldElement, nodeOldNewElement);
			} else if (nodeOldNode.type === types.text) {
				// If they both are text, then update the text content.
				var nodeNewText = nodeNew.data[""];

				if (nodeOldNode.data[""] !== nodeNewText) {
					nodeOld.element.data = nodeNewText;
				}
			} else {
				// If they are both elements, then update the data.
				var _nodeOldElement = nodeOld.element;
				var nodeOldNodeData = nodeOldNode.data;
				var nodeNewData = nodeNew.data;

				if (nodeOldNodeData !== nodeNewData) {
					// First, go through all new data and update all of the existing data
					// to match.
					for (var keyNew in nodeNewData) {
						var valueOld = nodeOldNodeData[keyNew];
						var valueNew = nodeNewData[keyNew];

						if (valueOld !== valueNew) {
							if (keyNew.charCodeAt(0) === 64) {
								// Update an event.
								var MoonEvents = _nodeOldElement.MoonEvents;

								if (MoonEvents[keyNew] === undefined) {
									// If the event doesn't exist, add a new event listener.
									setEvent(keyNew, valueNew, MoonEvents, _nodeOldElement.MoonListeners, _nodeOldElement);
								} else {
									// If it does exist, update the existing event handler.
									MoonEvents[keyNew] = valueNew;
								}
							} else if (keyNew === "ariaset" || keyNew === "dataset" || keyNew === "style") {
								// If it is a set attribute, update all values in the set.
								updateAttributeSet(keyNew, valueNew, _nodeOldElement);

								if (valueOld !== undefined) {
									// If there was an old set, remove all old set attributes
									// while excluding any new ones that still exist.
									removeAttributeSet(keyNew, valueOld, valueNew, _nodeOldElement);
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
								var MoonListeners = _nodeOldElement.MoonListeners; // Remove the event listener from the DOM.

								_nodeOldElement.removeEventListener(MoonListeners[keyOld]); // Remove both the event listener and event handler.


								MoonListeners[keyOld] = undefined;
								_nodeOldElement.MoonEvents[keyOld] = undefined;
							} else if (keyOld === "ariaset" || keyOld === "dataset" || keyOld === "style") {
								// If it is a set attribute, remove all old values from the
								// set and exclude nothing.
								removeAttributeSet(keyOld, nodeOldNodeData[keyOld], {}, _nodeOldElement);
							} else {
								// Remove a DOM property.
								_nodeOldElement.removeAttribute(keyOld);
							}
						}
					}
				} // Recursively patch children.


				var childrenOld = nodeOld.children;
				var childrenNew = nodeNew.children;

				if (childrenOld !== childrenNew) {
					var childrenOldLength = childrenOld.length;
					var childrenNewLength = childrenNew.length;

					if (childrenOldLength === childrenNewLength) {
						// If the children have the same length then update both as
						// usual.
						for (var i = 0; i < childrenOldLength; i++) {
							executePatch(childrenOld[i], childrenNew[i]);
						}
					} else if (childrenOldLength > childrenNewLength) {
						// If there are more old children than new children, update the
						// corresponding ones and remove the extra old children.
						for (var _i = 0; _i < childrenNewLength; _i++) {
							executePatch(childrenOld[_i], childrenNew[_i]);
						}

						for (var _i2 = childrenNewLength; _i2 < childrenOldLength; _i2++) {
							_nodeOldElement.removeChild(childrenOld.pop().element);
						}
					} else {
						// If there are more new children than old children, update the
						// corresponding ones and append the extra new children.
						for (var _i3 = 0; _i3 < childrenOldLength; _i3++) {
							executePatch(childrenOld[_i3], childrenNew[_i3]);
						}

						for (var _i4 = childrenOldLength; _i4 < childrenNewLength; _i4++) {
							var _nodeOldNew = executeCreate(childrenNew[_i4]);

							childrenOld.push(_nodeOldNew);

							_nodeOldElement.appendChild(_nodeOldNew.element);
						}
					}
				}
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
			md[key] = dataNew[key];
		} // Begin the view phase.


		setViewNew(viewCurrent(m, md, mc, ms.Root));
		executeView([viewNew]);
	}
	/**
	 * Executor
	 *
	 * The executor runs in two phases.
	 *
	 * 1. View
	 * 2. Patch
	 *
	 * The view phase consists of walking the new tree and executing components.
	 * This is run over multiple frames because big view trees can take a while to
	 * generate, and the user can provide input to create various events during
	 * this render. Instead of freezing up the browser, Moon allows events to be
	 * handled in between frames while the view is rendering.
	 *
	 * The patch phase consists of transforming the old tree into the new view
	 * tree. Differences between nodes are found, and their equivalent DOM
	 * operations are performed to update the DOM. At the same time, the old view
	 * tree is updated to match the new one without mutating the new tree. This
	 * allows for a quick reference check to skip over a patch. This phase is run
	 * over one frame to prevent an inconsistent UI -- similar to screen tearing.
	 *
	 * @param {Object} dataNew
	 */


	function execute(dataNew) {
		// Push the new data to the execution queue.
		executeQueue.push(dataNew); // Execute the next function in the queue if none are scheduled yet.

		if (executeQueue.length === 1) {
			requestAnimationFrame(function () {
				executeStart = Date.now();
				executeNext();
			});
		}
	}

	/**
	 * Moon
	 *
	 * Creates a new Moon component or root based on given options. Each Moon
	 * component is independent and has no knowledge of the parent. A component is
	 * a function mapping data and children to a view. The component can update
	 * global data to recreate the view. In Moon, the view is defined as a function
	 * over data and children, and components are just helper functions.
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
		var name = defaultValue(options.name, "Root"); // Store the default data.

		var dataDefault = options.data; // Ensure the view is defined, and compile it if needed.

		var view = options.view;

		if ("development" === "development" && view === undefined) {
			error("The " + name + " component requires a \"view\" property.");
		}

		if (typeof view === "string") {
			view = new Function("m", "md", "mc", "ms", compile(view));
		} // Create a list of static nodes for the view function.


		ms[name] = []; // Create a wrapper view function that processes default data if needed.

		var viewComponent = dataDefault === undefined ? view : function (m, md, mc, ms) {
			for (var key in dataDefault) {
				if (!(key in md)) {
					md[key] = dataDefault[key];
				}
			}

			return view(m, md, mc, ms);
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
			var dataNode = {};

			for (var i = 0; i < rootAttributes.length; i++) {
				var rootAttribute = rootAttributes[i];
				dataNode[rootAttribute.name] = rootAttribute.value;
			}

			setViewOld(new NodeOld(new NodeNew(types.element, root.tagName.toLowerCase(), dataNode, []), root, []));
			setViewCurrent(viewComponent);
			execute(defaultValue(dataDefault, {}));
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
	Moon.get = md;
	Moon.set = execute;

	return Moon;
}));
