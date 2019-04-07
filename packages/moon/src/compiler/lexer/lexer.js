import { error, isQuote } from "../../util/util";

/**
 * Capture the tag name, attribute text, and closing slash from an opening tag.
 */
const typeRE = /<([\w\d-_]+)([^>]*?)(\/?)>/g;

/**
 * Capture a key, value, and expression from a list of whitespace-separated
 * attributes. There cannot be a value and an expression, but both are captured
 * due to the limits of regular expressions. One or both of them can be
 * undefined.
 */
const attributeRE = /\s*([\w\d-_]*)(?:=(?:("[^"]*"|'[^']*')|{([^{}]*)}))?/g;

/**
 * Convert a token into a string, accounting for `<text/>` components.
 *
 * @param {Object} token
 * @returns {String} Token converted into a string
 */
export function tokenString(token) {
	if (token.type === "tagOpen") {
		if (token.value === "text") {
			const content = token.attributes[""];

			// If the text content is surrounded with quotes, it was normal text
			// and doesn't need the quotes. If not, it was an expression and
			// needs to be formatted with curly braces.
			if (isQuote(content[0])) {
				return content.slice(1, -1);
			} else {
				return `{${content}}`;
			}
		} else {
			let tag = `<${token.value}`;

			for (let attributeKey in token.attributes) {
				const attributeValue = token.attributes[attributeKey];
				tag += ` ${attributeKey}=${isQuote(attributeValue[0]) ? attributeValue : `{${attributeValue}}`}`;
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
	let lexMessage = `${message}\n\n`;

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
				const type = input.slice(i + 2, closeIndex);

				if (process.env.MOON_ENV === "development" && closeIndex === -1) {
					lexError(`Lexer expected a closing ">" after "</".`, input, i);
					break;
				}

				tokens.push({
					type: "tagClose",
					value: type
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

			// Set the last searched index of the tag type regular expression to
			// the index of the character currently being processed. Since it is
			// being executed on the whole input, this is required for getting the
			// correct match and having better performance.
			typeRE.lastIndex = i;

			// Execute the tag type regular expression on the input and store
			// the match and captured groups.
			const typeExec = typeRE.exec(input);

			if (process.env.MOON_ENV === "development" && typeExec === null) {
				lexError("Lexer expected a valid opening or self-closing tag.", input, i);
			}

			const typeMatch = typeExec[0];
			const type = typeExec[1];
			const attributesText = typeExec[2];
			const closeSlash = typeExec[3];
			const attributes = {};
			let attributeExec;

			// Keep matching for new attribute key/value pairs until there are no
			// more in the attribute text.
			while (
				(attributeExec = attributeRE.exec(attributesText)) !==
				null
			) {
				// Store the match and captured groups.
				const attributeMatch = attributeExec[0];
				const attributeKey = attributeExec[1];
				const attributeValue = attributeExec[2];
				const attributeExpression = attributeExec[3];

				if (attributeMatch.length === 0) {
					// If nothing is matched, continue searching from the next
					// character. This is required because the attribute regular
					// expression can have empty matches and create an infinite
					// loop.
					attributeRE.lastIndex += 1;
				} else {
					// Store the key/value pair using the matched value or
					// expression.
					attributes[attributeKey] =
						attributeExpression === undefined ?
						attributeValue :
						attributeExpression;
				}
			}

			// Append an opening tag token with the type, attributes, and optional
			// self-closing slash.
			tokens.push({
				type: "tagOpen",
				value: type,
				attributes,
				closed: closeSlash  === "/"
			});

			i += typeMatch.length;
		} else if (char === "{") {
			// If a sequence of characters begins with "{", process it as an
			// expression token.
			let expression = "";

			// Consume the input until the end of the expression.
			for (i += 1; i < input.length; i++) {
				const char = input[i];

				if (char === "}") {
					break;
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
					"": expression
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
			// content attribute.
			tokens.push({
				type: "tagOpen",
				value: "text",
				attributes: {
					"": `"${text}"`
				},
				closed: true
			});
		}
	}

	return tokens;
}
