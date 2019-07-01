/**
 * Moon Browser v1.0.0-beta.3
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
(function () {
	"use strict";

	/**
	 * See if a character is an unescaped quote.
	 *
	 * @param {string} char
	 * @param {string} charPrevious
	 * @returns {Boolean} quote status
	 */
	function isQuote(_char, charPrevious) {
		return charPrevious !== "\\" && (_char === "\"" || _char === "'");
	}

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
	 * Capture whitespace-only text.
	 */

	var whitespaceRE = /^\s+$/;
	/**
	 * Capture special characters in text that need to be escaped.
	 */

	var textRE = /&amp;|&gt;|&lt;|&nbsp;|&quot;|\\|"|\n|\r/g;
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
				} // Hold information about the name, attributes, and closing slash.


				var name = "";
				var attributesText = "";
				var closed = false;
				var attributes = {}; // Keep track of if the lexer is scanning the name or attribute text.

				var isName = true; // Keep a stack of opened objects. When lexing a tag, objects and
				// expressions can have the `>` character, and it is important that
				// they are skipped over until they are the end of a tag.

				var opened = 0; // Skip over the input and lex until the end of the tag.

				for (i++; i < input.length; i++) {
					var charName = input[i]; // Keep track of opened and closed objects.

					if (charName === "{") {
						opened += 1;
					} else if (charName === "}") {
						opened -= 1;
					}

					if (
					/* Ensure all objects/expressions are closed. */
					opened === 0 && (
					/* Check for a normal closing angle bracket. */
					charName === ">" ||
					/* Check for a closing slash followed by an angle bracket and
					 * skip over the slash. */
					charName === "/" && input[i + 1] === ">" && (closed = true) && (i += 1))) {
						// Skip over the closing angle bracket.
						i += 1;
						break;
					} else if (isName) {
						if (whitespaceRE.test(charName)) {
							// If lexing the name and the character is whitespace, stop
							// lexing the name.
							isName = false;
						} else if (charName === "=") {
							// If the character is an equals sign, stop lexing the name
							// and add it to the attribute text because it is an empty
							// key attribute.
							isName = false;
							attributesText += charName;
						} else {
							// Add on text as part of the name.
							name += charName;
						}
					} else if (isQuote(charName, input[i - 1])) {
						// If the character is a quote, add it to the attribute text.
						attributesText += charName; // Skip until the closing quote.

						for (i++; i < input.length; i++) {
							var charString = input[i]; // Add everything inside the string to the attribute text.

							attributesText += charString;

							if (isQuote(charString, input[i - 1]) && charString === charName) {
								// If there is a closing quote, exit.
								break;
							}
						}
					} else {
						// If not lexing the name, add on extra text as part of the
						// attributes of the tag.
						attributesText += charName;
					}
				} // Match attributes.


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


						if (attributeKey in normalizeAttributeKeyMap) {
							attributeKey = normalizeAttributeKeyMap[attributeKey];
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

							var _opened = 0; // Iterate through the value.

							for (; j < attributesText.length; j++) {
								charAttribute = attributesText[j];

								if (charAttribute === "{") {
									// Found an open object, keep track of it.
									_opened += 1;
									attributeValue += charAttribute;
								} else if (quote === "}" && isQuote(charAttribute, attributesText[j - 1])) {
									// Found a string inside an expression, skip over it.
									attributeValue += charAttribute;

									for (j++; j < attributesText.length; j++) {
										var _charString = attributesText[j]; // Add everything inside the string to the attribute
										// value.

										attributeValue += _charString;

										if (isQuote(_charString, attributesText[j - 1]) && _charString === charAttribute) {
											// If there is a closing quote, exit.
											break;
										}
									}
								} else if (charAttribute === quote) {
									// Found a potential ending quote.
									if (quote === "}") {
										// If the value is an expression, ensure that all
										// objects are closed.
										if (_opened === 0) {
											// Set a dynamic expression.
											attributes[attributeKey] = {
												value: attributeValue,
												isStatic: false
											}; // Exit on the quote.

											break;
										} else {
											// If all objects aren't yet closed, mark one as
											// closed.
											_opened -= 1;
											attributeValue += charAttribute;
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
							}
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
				// self-closing slash status.


				tokens.push({
					type: "tagOpen",
					value: name,
					attributes: attributes,
					closed: closed
				});
			} else if (_char === "{") {
				// If a sequence of characters begins with "{", process it as an
				// expression token.
				var expression = ""; // Keep a stack of opened objects.

				var _opened2 = 0; // Consume the input until the end of the expression.

				for (i++; i < input.length; i++) {
					var _char2 = input[i];

					if (_char2 === "{") {
						// Keep track of an open object.
						_opened2 += 1;
						expression += _char2;
					} else if (_char2 === "}") {
						if (_opened2 === 0) {
							// If there are no more open objects and the expression
							// closed, exit on the closing brace.
							break;
						} else {
							// If there are open objects, close one.
							_opened2 -= 1;
							expression += _char2;
						}
					} else if (isQuote(_char2, input[i - 1])) {
						// If there is a string in the expression, skip over it.
						expression += _char2;

						for (i++; i < input.length; i++) {
							var _charString2 = input[i]; // Add the string contents to the expression.

							expression += _charString2;

							if (isQuote(_charString2, input[i - 1]) && _charString2 === _char2) {
								// If there is a closing quote, exit.
								break;
							}
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
						"": {
							value: expression,
							isStatic: false
						}
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
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */

	function generateNodeElement(element, variable) {
		var attributes = element.attributes;
		var name = attributes.name;
		var data = attributes.data;
		var children = attributes.children;
		return {
			prelude: "",
			node: "Moon.view.m(" + types.element + "," + name.value + "," + data.value + "," + children.value + ")",
			isStatic: name.isStatic && data.isStatic && children.isStatic,
			variable: variable
		};
	}

	/**
	 * Generates a static part.
	 *
	 * @param {string} prelude
	 * @param {string} part
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @param {Object} staticPartsMap
	 * @returns {Object} variable and static variable
	 */
	function generateStaticPart(prelude, part, variable, staticParts, staticPartsMap) {
		var staticPartsMapKey = prelude + part;

		if (staticPartsMapKey in staticPartsMap) {
			return {
				variable: variable,
				variableStatic: staticPartsMap[staticPartsMapKey]
			};
		} else {
			var variableStatic = staticPartsMap[staticPartsMapKey] = "m" + variable++;
			staticParts.push({
				variableStatic: variableStatic,
				variablePart: "" + prelude + variableStatic + "=" + part + ";"
			});
			return {
				variable: variable,
				variableStatic: variableStatic
			};
		}
	}

	/**
	 * Generates code for an `if`/`else-if`/`else` clause body.
	 *
	 * @param {number} variableIf
	 * @param {Object} element
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @param {Object} staticPartsMap
	 * @returns {string} clause body and variable
	 */

	function generateClause(variableIf, element, variable, staticParts, staticPartsMap) {
		var generateBody = generate(element.children[0], element, 0, variable, staticParts, staticPartsMap);
		var clause;
		variable = generateBody.variable;

		if (generateBody.isStatic) {
			// If the clause is static, then use a static node in place of it.
			var staticPart = generateStaticPart(generateBody.prelude, generateBody.node, variable, staticParts, staticPartsMap);
			variable = staticPart.variable;
			clause = variableIf + "=" + staticPart.variableStatic + ";";
		} else {
			// If the clause is dynamic, then use the dynamic node.
			clause = "" + generateBody.prelude + variableIf + "=" + generateBody.node + ";";
		}

		return {
			clause: clause,
			variable: variable
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
	 * @param {Object} staticPartsMap
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */


	function generateNodeIf(element, parent, index, variable, staticParts, staticPartsMap) {
		var variableIf = "m" + variable;
		var prelude = "";
		var emptyElseClause = true; // Generate the initial `if` clause.

		var clauseIf = generateClause(variableIf, element, variable + 1, staticParts, staticPartsMap);
		prelude += "if(" + element.attributes[""].value + "){" + clauseIf.clause + "}";
		variable = clauseIf.variable; // Search for `else-if` and `else` clauses if there are siblings.

		if (parent !== null) {
			var siblings = parent.children;

			for (var i = index + 1; i < siblings.length;) {
				var sibling = siblings[i];

				if (sibling.name === "else-if") {
					// Generate the `else-if` clause.
					var clauseElseIf = generateClause(variableIf, sibling, variable, staticParts, staticPartsMap);
					prelude += "else if(" + sibling.attributes[""].value + "){" + clauseElseIf.clause + "}";
					variable = clauseElseIf.variable; // Remove the `else-if` clause so that it isn't generated
					// individually by the parent.

					siblings.splice(i, 1);
				} else if (sibling.name === "else") {
					// Generate the `else` clause.
					var clauseElse = generateClause(variableIf, sibling, variable, staticParts, staticPartsMap);
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
			var staticPart = generateStaticPart("", "Moon.view.m(" + types.text + ",\"text\",{\"\":\"\"},[])", variable, staticParts, staticPartsMap);
			variable = staticPart.variable;
			prelude += "else{" + variableIf + "=" + staticPart.variableStatic + ";}";
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
	 * @param {Object} staticPartsMap
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */

	function generateNodeFor(element, variable, staticParts, staticPartsMap) {
		var variableForChildren = "m" + variable;
		var variableForChild = "m" + (variable + 1);
		var variableForKey = "m" + (variable + 2);
		var attributes = element.attributes;
		var parameters = attributes[""].value; // Generate the child and pass the parameters as locals.

		var generateChild = generate(element.children[0], element, 0, variable + 3, staticParts, staticPartsMap); // Generate the child function.

		var childFunction;
		variable = generateChild.variable;

		if (generateChild.isStatic) {
			// If the child is static, then use a static node in place of it.
			var staticPart = generateStaticPart(generateChild.prelude, generateChild.node, variable, staticParts, staticPartsMap);
			variable = staticPart.variable;
			childFunction = "return " + staticPart.variableStatic + ";";
		} else {
			// If the child is dynamic, then use the dynamic node in the loop body.
			childFunction = generateChild.prelude + "return " + generateChild.node + ";";
		}

		childFunction = variableForChild + "=function(" + parameters + "){" + childFunction + "};"; // Generate the iterable, loop, and arguments for the child function.

		var iterable;
		var loop;
		var args;

		if ("in" in attributes) {
			// Generate a `for` loop over an object. The first local is the key and
			// the second is the value.
			iterable = attributes["in"].value;
			loop = "for(" + variableForKey + " in " + iterable + "){";
			args = variableForKey + "," + iterable + "[" + variableForKey + "]";
		} else {
			// Generate a `for` loop over an array. The first local is the value and
			// the second is the key (index).
			iterable = attributes.of.value;
			loop = "for(" + variableForKey + "=0;" + variableForKey + "<" + iterable + ".length;" + variableForKey + "++){";
			args = iterable + "[" + variableForKey + "]," + variableForKey;
		} // Generate any custom data or create static data as an empty object.


		var data;

		if ("data" in attributes) {
			data = attributes.data.value;
		} else {
			var _staticPart = generateStaticPart("", "{}", variable, staticParts, staticPartsMap);

			variable = _staticPart.variable;
			data = _staticPart.variableStatic;
		}

		return {
			prelude: variableForChildren + "=[];" + childFunction + loop + variableForChildren + ".push(" + variableForChild + "(" + args + "));}",
			node: "Moon.view.m(" + types.element + "," + ("name" in attributes ? attributes.name.value : "\"span\"") + "," + data + "," + variableForChildren + ")",
			isStatic: false,
			variable: variable
		};
	}

	/**
	 * Generator
	 *
	 * The generator is responsible for generating a function that creates a view.
	 * A view is represented as a normal set of recursive function calls, these
	 * functions are components.
	 *
	 * @param {Object} element
	 * @param {Object} parent
	 * @param {number} index
	 * @param {number} variable
	 * @param {Array} staticParts
	 * @param {Object} staticPartsMap
	 * @returns {Object} prelude code, view function code, static status, and variable
	 */

	function generate(element, parent, index, variable, staticParts, staticPartsMap) {
		var name = element.name;
		var staticData = true;
		var staticChildren = true; // Generate the correct type number for the given name.

		if (name === "element") {
			return generateNodeElement(element, variable);
		} else if (name === "if") {
			return generateNodeIf(element, parent, index, variable, staticParts, staticPartsMap);
		} else if (name === "for") {
			return generateNodeFor(element, variable, staticParts, staticPartsMap);
		}

		var attributes = element.attributes;
		var prelude = "";
		var data = "";
		var children = "";
		var dataSeparator = "";
		var childrenSeparator = "";

		for (var attributeKey in attributes) {
			var attributeValue = attributes[attributeKey]; // A `children` attribute takes place of component children.

			if (attributeKey === "children") {
				if (!attributeValue.isStatic) {
					staticChildren = false;
				}

				children = attributeValue.value;
			} else {
				// Mark the data as dynamic if there are any dynamic attributes.
				if (!attributeValue.isStatic) {
					staticData = false;
				}

				data += dataSeparator + "\"" + attributeKey + "\":" + attributeValue.value;
				dataSeparator = ",";
			}
		} // Generate children if they weren't provided in an attribute.


		if (!("children" in attributes)) {
			var elementChildren = element.children;
			var generateChildren = [];
			children += "[";

			for (var i = 0; i < elementChildren.length; i++) {
				var generateChild = generate(elementChildren[i], element, i, variable, staticParts, staticPartsMap); // Mark the children as dynamic if any child is dynamic.

				if (!generateChild.isStatic) {
					staticChildren = false;
				} // Update the variable counter.


				variable = generateChild.variable; // Keep track of generated children.

				generateChildren.push(generateChild);
			}

			for (var _i = 0; _i < generateChildren.length; _i++) {
				var _generateChild = generateChildren[_i];

				if (staticChildren || !_generateChild.isStatic) {
					// If the children are static or the children and child node are
					// dynamic, then append the child as a part of the node as usual.
					prelude += _generateChild.prelude;
					children += childrenSeparator + _generateChild.node;
				} else {
					// If the children are dynamic and the child node is static, then use
					// a static node in place of the static child.
					var staticPart = generateStaticPart(_generateChild.prelude, _generateChild.node, variable, staticParts, staticPartsMap);
					variable = staticPart.variable;
					children += childrenSeparator + staticPart.variableStatic;
				}

				childrenSeparator = ",";
			}

			children += "]";
		}

		if (!staticData && staticChildren) {
			// If only the children are static, hoist them out.
			var _staticPart = generateStaticPart("", children, variable, staticParts, staticPartsMap);

			variable = _staticPart.variable;
			children = _staticPart.variableStatic;
		} // Find the type.


		if (name[0] === name[0].toUpperCase()) {
			return {
				prelude: prelude,
				node: name + "({" + data + dataSeparator + "children:" + children + "})",
				isStatic: staticData && staticChildren,
				variable: variable
			};
		} else {
			var type;

			if (name === "text") {
				type = types.text;
			} else {
				type = types.element;
			} // Add braces around the data.


			data = "{" + data + "}";

			if (staticData && !staticChildren) {
				// If only the data is static, hoist it out. This is only done for
				// elements and text because components have children as a part of
				// their data. In order to hoist it, the data and children have to be
				// static, which means that the whole node is static anyway. Instead,
				// children are the only ones hoisted for components, while both data
				// and children are hoisted for elements and text.
				var _staticPart2 = generateStaticPart("", data, variable, staticParts, staticPartsMap);

				variable = _staticPart2.variable;
				data = _staticPart2.variableStatic;
			}

			return {
				prelude: prelude,
				node: "Moon.view.m(" + type + ",\"" + name + "\"," + data + "," + children + ")",
				isStatic: staticData && staticChildren,
				variable: variable
			};
		}
	}

	/**
	 * Compiles a JavaScript file with Moon syntax.
	 *
	 * @param {string} input
	 * @returns {string} file code
	 */

	function compile(input) {
		var output = "";
		var variable = 0;

		for (var i = 0; i < input.length;) {
			var _char = input[i];

			if (_char === "(") {
				// Skip over the parenthesis.
				output += _char;
				i += 1; // Record the expression.

				var expression = ""; // Store opened parentheses.

				var opened = 0;

				for (; i < input.length;) {
					var _char2 = input[i];

					if (_char2 === ")" && opened === 0) {
						break;
					} else if (isQuote(_char2, input[i - 1])) {
						// Skip over strings.
						expression += _char2;

						for (i++; i < input.length; i++) {
							var charString = input[i]; // Add the string contents to the output.

							expression += charString;

							if (isQuote(charString, input[i - 1]) && charString === _char2) {
								// Skip over the closing quote.
								i += 1; // Exit after the closing quote.

								break;
							}
						}
					} else {
						if (_char2 === "(") {
							opened += 1;
						} else if (_char2 === ")") {
							opened -= 1;
						}

						expression += _char2;
						i += 1;
					}
				} // Remove surrounding whitespace.


				expression = expression.trim();

				if (expression[0] === "<") {
					// If it is a Moon view, then lex, parse, and generate code for it.
					var staticParts = [];
					var staticPartsMap = {};
					var result = generate(parse(lex(expression)), null, 0, variable, staticParts, staticPartsMap);
					variable = result.variable;

					if (result.isStatic) {
						// Generate a static output.
						var staticPart = generateStaticPart(result.prelude, result.node, variable, staticParts, staticPartsMap);
						variable = staticPart.variable;
						output += "(function(){if(" + staticPart.variableStatic + "===undefined){" + staticParts[0].variablePart + "}return " + staticPart.variableStatic + ";})()";
					} else {
						// Add the prelude to the last seen block and the node in place of the expression.
						output += "(function(){" + (staticParts.length === 0 ? "" : "if(" + staticParts[0].variableStatic + "===undefined){" + staticParts.map(function (staticPart) {
							return staticPart.variablePart;
						}).join("") + "}") + result.prelude + "return " + result.node + ";})()";
					}
				} else {
					// If not, then add it to the output as a normal expression.
					output += expression;
				}
			} else if (isQuote(_char, input[i - 1])) {
				// If there is a string in the code, skip over it.
				output += _char;

				for (i++; i < input.length; i++) {
					var _charString = input[i]; // Add the string contents to the output.

					output += _charString;

					if (isQuote(_charString, input[i - 1]) && _charString === _char) {
						// Skip over the closing quote.
						i += 1; // Exit after the closing quote.

						break;
					}
				}
			} else if (_char === "/" && input[i + 1] === "/") {
				// Skip over the line.
				for (; i < input.length; i++) {
					var _char3 = input[i];
					output += _char3;

					if (_char3 === "\n") {
						// Skip over the newline.
						i += 1; // Exit after the newline.

						break;
					}
				}
			} else if (_char === "/" && input[i + 1] === "*") {
				// Skip over the multiline comment.
				output += "/*";
				i += 2;

				for (; i < input.length; i++) {
					var _char4 = input[i];
					output += _char4;

					if (_char4 === "*" && input[i + 1] === "/") {
						// Skip over the closing delimiter.
						output += "/";
						i += 2; // Exit after the comment.

						break;
					}
				}
			} else {
				// Add the character to the output as normal.
				output += _char;
				i += 1;
			}
		} // Define variables in the beginning and return the output.


		var prelude = "";
		var separator = "";

		if (variable !== 0) {
			prelude += "var ";

			for (var _i = 0; _i < variable; _i++) {
				prelude += separator + "m" + _i;
				separator = ",";
			}

			prelude += ";";
		}

		return prelude + output;
	}

	/**
	 * Async script sources
	 */

	var scriptsAsync = [];
	/**
	 * Head element
	 */

	var head;
	/**
	 * Script elements
	 */

	var scripts;
	/**
	 * Load async scripts in the order they appear.
	 */

	function load() {
		if (scriptsAsync.length !== 0) {
			var xhr = new XMLHttpRequest();
			var src = scriptsAsync.shift();
			xhr.addEventListener("load", function () {
				if (xhr.readyState === xhr.DONE) {
					if (xhr.status === 0 || xhr.status === 200) {
						var scriptNew = document.createElement("script");
						scriptNew.text = compile(this.responseText);
						head.appendChild(scriptNew);
					} else {
						error("Failed to load script with source \"" + src + "\" and status " + xhr.status + ".");
					}

					load();
				}
			});
			xhr.open("GET", src, true);
			xhr.send();
		}
	}

	document.addEventListener("DOMContentLoaded", function () {
		head = document.querySelector("head");
		scripts = document.querySelectorAll("script");

		for (var i = 0; i < scripts.length; i++) {
			var script = scripts[i];

			if (script.type === "text/moon") {
				var src = script.src;

				if (src.length === 0) {
					var scriptNew = document.createElement("script");
					scriptNew.text = compile(script.text);
					head.appendChild(scriptNew);
				} else {
					scriptsAsync.push(src);
				}

				script.parentNode.removeChild(script);
			}
		}

		load();
	});

}());
