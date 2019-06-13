import { error } from "../../util/util";

/**
 * Capture whitespace-only text.
 */
const whitespaceRE = /^\s+$/;

/**
 * Capture the tag name, attribute text, and closing slash from an opening tag.
 */
const nameRE = /<([\w\d-_]+)([^>]*?)(\/?)>/g;

/**
 * Capture the variables in expressions to scope them within the data
 * parameter. This ignores property names and deep object accesses.
 */
const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;

/**
 * Capture special characters in text that need to be escaped.
 */
const textRE = /&amp;|&gt;|&lt;|&nbsp;|&quot;|\\|"|\n|\r/g;

/**
 * List of global variables to ignore in expression scoping
 */
const globals = ["NaN", "false", "in", "null", "this", "true", "typeof", "undefined", "window"];

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
 * Scope an expression to use variables within the `md` object.
 *
 * @param {string} expression
 * @returns {Object} Scoped expression and static status
 */
function scopeExpression(expression) {
	let isStatic = true;

	const value = expression.replace(expressionRE, (match, name) => {
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
		value,
		isStatic
	};
}

/**
 * Convert a token into a string, accounting for `<text/>` components.
 *
 * @param {Object} token
 * @returns {string} Token converted into a string
 */
export function tokenString(token) {
	if (token.type === "tagOpen") {
		if (token.value === "text") {
			const content = token.attributes[""];

			// If the text content is surrounded with quotes, it was normal text
			// and doesn't need the quotes. If not, it was an expression and
			// needs to be formatted with curly braces.
			if (content.isStatic) {
				return content.value.slice(1, -1);
			} else {
				return `{${content.value}}`;
			}
		} else {
			let tag = "<" + token.value;
			const attributes = token.attributes;

			for (let attributeKey in attributes) {
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
 * @returns {Object[]} List of tokens
 */
export function lex(input) {
	// Remove leading and trailing whitespace because the lexer should only
	// accept one element as an input, and whitespace counts as text.
	input = input.trim();

	let tokens = [];

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

			// Set the last searched index of the tag name regular expression to
			// the index of the character currently being processed. Since it is
			// being executed on the whole input, this is required for getting the
			// correct match and having better performance.
			nameRE.lastIndex = i;

			// Execute the tag name regular expression on the input and store the
			// match and captured groups.
			const nameExec = nameRE.exec(input);

			if (process.env.MOON_ENV === "development" && nameExec === null) {
				lexError("Lexer expected a valid opening or self-closing tag.", input, i);
			}

			const nameMatch = nameExec[0];
			const name = nameExec[1];
			const attributesText = nameExec[2];
			const closeSlash = nameExec[3];
			const attributes = {};

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
					const attributeKeyNormalized = normalizeAttributeKeyMap[attributeKey];

					if (attributeKeyNormalized !== undefined) {
						attributeKey = attributeKeyNormalized;
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
												value: `[${scopeExpression(attributeValue).value},md,mc]`,
												isStatic: false
											};
										} else {
											// Set a potentially dynamic expression.
											attributes[attributeKey] = scopeExpression(attributeValue);
										}

										// Exit on the quote.
										break;
									} else {
										// If all objects aren't yet closed, mark one as
										// closed.
										attributeValue += charAttribute;
										opened -= 1;
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

						// Skip over the closing quote.
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
			}

			// Append an opening tag token with the name, attributes, and optional
			// self-closing slash.
			tokens.push({
				type: "tagOpen",
				value: name,
				attributes,
				closed: closeSlash  === "/"
			});

			i += nameMatch.length;
		} else if (char === "{") {
			// If a sequence of characters begins with "{", process it as an
			// expression token.
			let expression = "";

			// Keep a stack of opened objects.
			let opened = 0;

			// Consume the input until the end of the expression.
			for (i += 1; i < input.length; i++) {
				const char = input[i];

				if (char === "{") {
					opened += 1;
					expression += char;
				} else if (char === "}") {
					if (opened === 0) {
						break;
					} else {
						opened -= 1;
						expression += char;
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
					"": scopeExpression(expression)
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
