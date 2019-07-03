import { isQuote, whitespaceRE } from "moon-compiler/src/util/util";
import { error } from "util/util";

/**
 * Capture the variables in expressions to scope them within the data
 * parameter. This ignores property names and deep object accesses.
 */
const expressionRE = /"[^"]*"|'[^']*'|`[^`]*`|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;

/**
 * Capture special characters in text that need to be escaped.
 */
const textRE = /&amp;|&gt;|&lt;|&nbsp;|&quot;|\\|"|\n|\r/g;

/**
 * List of global variables to ignore in expression scoping
 */
const globals = ["Infinity", "NaN", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "extends", "false", "finally", "for", "function", "if", "in", "instanceof", "let", "new", "null", "return", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "window"];

/*
 * Map from attribute keys to equivalent DOM properties.
 */
const normalizeAttributeKeyMap = {
	"class": "className",
	"for": "htmlFor"
};

/**
 * Map from special characters to a safe format for JavaScript string literals.
 */
const escapeTextMap = {
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
 * See if an expression is static.
 *
 * @param {string} expression
 * @returns {Boolean} static status
 */
function expressionIsStatic(expression) {
	let result;

	while ((result = expressionRE.exec(expression)) !== null) {
		const name = result[1];

		if (name !== undefined && globals.indexOf(name) === -1) {
			// Reset the last matched index to prevent some sneaky bugs that can
			// cause the function to become nondeterministic.
			expressionRE.lastIndex = 0;

			return false;
		}
	}

	expressionRE.lastIndex = 0;

	return true;
}

/**
 * Convert a token into a string, accounting for `<text/>` components.
 *
 * @param {Object} token
 * @returns {string} token converted into a string
 */
export function tokenString(token) {
	if (token.type === "tagOpen") {
		if (token.value === "text") {
			const content = token.attributes[""].value;

			// If the text content is surrounded with quotes, it was normal text
			// and doesn't need the quotes. If not, it was an expression and
			// needs to be formatted with curly braces.
			if (content[0] === "\"" && content[content.length - 1] === "\"") {
				return content.slice(1, -1);
			} else {
				return `{${content}}`;
			}
		} else {
			let tag = "<" + token.value;
			const attributes = token.attributes;

			for (const attributeKey in attributes) {
				const attributeValue = attributes[attributeKey];
				tag += ` ${attributeKey}=${attributeValue.isStatic ? attributeValue.value : `{${attributeValue.value}}`}`;
			}

			if (token.closed) {
				tag += "/";
			}

			return tag + ">";
		}
	} else {
		return `</${token.value}>`;
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
	let lexMessage = message + "\n\n";

	// Show input characters surrounding the source of the error.
	for (
		let i = Math.max(0, index - 16);
		i < Math.min(index + 16, input.length);
		i++
	) {
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
export function lex(input) {
	// Remove leading and trailing whitespace because the lexer should only
	// accept one element as an input, and whitespace counts as text.
	input = input.trim();

	const tokens = [];

	for (let i = 0; i < input.length;) {
		const char = input[i];

		if (char === "<") {
			const charNext = input[i + 1];

			if (process.env.MOON_ENV === "development" && charNext === undefined) {
				lexError(`Lexer expected a character after "<".`, input, i);
				break;
			}

			if (charNext === "/") {
				// Append a closing tag token if a sequence of characters begins
				// with "</".
				const closeIndex = input.indexOf(">", i + 2);
				const name = input.slice(i + 2, closeIndex);

				if (process.env.MOON_ENV === "development" && closeIndex === -1) {
					lexError(`Lexer expected a closing ">" after "</".`, input, i);
					break;
				}

				tokens.push({
					type: "tagClose",
					value: name
				});

				i = closeIndex + 1;
				continue;
			} else if (
				charNext === "!" &&
				input[i + 2] === "-" &&
				input[i + 3] === "-"
			) {
				// Ignore input if a sequence of characters begins with "<!--".
				const closeIndex = input.indexOf("-->", i + 4);

				if (process.env.MOON_ENV === "development" && closeIndex === -1) {
					lexError(`Lexer expected a closing "-->" after "<!--".`, input, i);
					break;
				}

				i = closeIndex + 3;
				continue;
			}

			// Hold information about the name, attributes, and closing slash.
			let name = "";
			let attributesText = "";
			let closed = false;
			const attributes = {};

			// Keep track of if the lexer is scanning the name or attribute text.
			let isName = true;

			// Keep a stack of opened objects. When lexing a tag, objects and
			// expressions can have the `>` character, and it is important that
			// they are skipped over until they are the end of a tag.
			let opened = 0;

			// Skip over the input and lex until the end of the tag.
			for (i++; i < input.length; i++) {
				const charName = input[i];

				// Keep track of opened and closed objects.
				if (charName === "{") {
					opened += 1;
				} else if (charName === "}") {
					opened -= 1;
				}

				if (
					/* Ensure all objects/expressions are closed. */
					(opened === 0) &&
					(
						/* Check for a normal closing angle bracket. */
						(charName === ">") ||
						/* Check for a closing slash followed by an angle bracket and
						 * skip over the slash. */
						(charName === "/" && input[i + 1] === ">" && (closed = true) && (i += 1))
					)
				) {
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
					attributesText += charName;

					// Skip until the closing quote.
					for (i++; i < input.length; i++) {
						const charString = input[i];

						// Add everything inside the string to the attribute text.
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
			}

			// Match attributes.
			for (let j = 0; j < attributesText.length; j++) {
				let charAttribute = attributesText[j];

				if (!whitespaceRE.test(charAttribute)) {
					let attributeKey = "";
					let attributeValue = "true";

					// Match an attribute key.
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
					}

					// Normalize the attribute key. Moon attribute keys should
					// follow camelCase by convention instead of using standard HTML
					// attribute keys.
					if (attributeKey in normalizeAttributeKeyMap) {
						attributeKey = normalizeAttributeKeyMap[attributeKey];
					}

					// Match an attribute value if it exists.
					if (attributeValue.length === 0) {
						// Find a matching end quote.
						let quote = attributesText[++j];

						if (quote === "{") {
							// For expressions, ensure that the correct closing
							// delimiter is used.
							quote = "}";
						} else {
							// For strings, add the first quote to the value.
							attributeValue += quote;
						}

						// Skip over the first quote.
						j += 1;

						// Keep a stack of opened objects.
						let opened = 0;

						// Iterate through the value.
						for (; j < attributesText.length; j++) {
							charAttribute = attributesText[j];

							if (charAttribute === "{") {
								// Found an open object, keep track of it.
								opened += 1;
								attributeValue += charAttribute;
							} else if (quote === "}" && isQuote(charAttribute, attributesText[j - 1])) {
								// Found a string inside an expression, skip over it.
								attributeValue += charAttribute;

								for (j++; j < attributesText.length; j++) {
									// Add everything inside the string to the attribute
									// value.
									const charString = attributesText[j];
									attributeValue += charString;

									if (isQuote(charString, attributesText[j - 1]) && charString === charAttribute) {
										// If there is a closing quote, exit.
										break;
									}
								}
							} else if (charAttribute === quote) {
								// Found a potential ending quote.
								if (quote === "}") {
									// If the value is an expression, ensure that all
									// objects are closed.
									if (opened === 0) {
										// Set a potentially dynamic expression.
										attributes[attributeKey] = {
											value: attributeValue,
											isStatic: expressionIsStatic(attributeValue)
										};

										// Exit on the quote.
										break;
									} else {
										// If all objects aren't yet closed, mark one as
										// closed.
										opened -= 1;
										attributeValue += charAttribute;
									}
								} else {
									// If the value is a string, add the closing quote.
									attributeValue += charAttribute;

									// Set a static key-value pair.
									attributes[attributeKey] = {
										value: attributeValue,
										isStatic: true
									};

									// Exit on the quote.
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
			}

			// Append an opening tag token with the name, attributes, and optional
			// self-closing slash status.
			tokens.push({
				type: "tagOpen",
				value: name,
				attributes,
				closed
			});
		} else if (char === "{") {
			// If a sequence of characters begins with "{", process it as an
			// expression token.
			let expression = "";

			// Keep a stack of opened objects.
			let opened = 0;

			// Consume the input until the end of the expression.
			for (i++; i < input.length; i++) {
				const char = input[i];

				if (char === "{") {
					// Keep track of an open object.
					opened += 1;
					expression += char;
				} else if (char === "}") {
					if (opened === 0) {
						// If there are no more open objects and the expression
						// closed, exit on the closing brace.
						break;
					} else {
						// If there are open objects, close one.
						opened -= 1;
						expression += char;
					}
				} else if (isQuote(char, input[i - 1])) {
					// If there is a string in the expression, skip over it.
					expression += char;

					for (i++; i < input.length; i++) {
						const charString = input[i];

						// Add the string contents to the expression.
						expression += charString;

						if (isQuote(charString, input[i - 1]) && charString === char) {
							// If there is a closing quote, exit.
							break;
						}
					}
				} else {
					expression += char;
				}
			}

			// Append the expression as a `<text/>` element with the appropriate
			// text content attribute.
			tokens.push({
				type: "tagOpen",
				value: "text",
				attributes: {
					"": {
						value: expression,
						isStatic: expressionIsStatic(expression)
					}
				},
				closed: true
			});

			i += 1;
		} else {
			// If nothing has matched at this point, process the input as text.
			let text = "";

			// Consume the input until the start of a new tag or expression.
			for (; i < input.length; i++) {
				const char = input[i];

				if (char === "<" || char === "{") {
					break;
				} else {
					text += char;
				}
			}

			// Append the text as a `<text/>` element with the appropriate text
			// content attribute if it isn't only whitespace.
			if (!whitespaceRE.test(text)) {
				tokens.push({
					type: "tagOpen",
					value: "text",
					attributes: {
						"": {
							value: `"${text.replace(textRE, (match) => escapeTextMap[match])}"`,
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
