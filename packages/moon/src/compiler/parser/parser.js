import { tokenString } from "../lexer/lexer";
import { error } from "../../util/util";

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
	return process.env.MOON_ENV === "development" ? message : "";
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
	const length = end - start;
	let error;

	if (length === 0) {
		return [];
	} else {
		for (
			let elementEnd = start + 1;
			elementEnd <= end;
			elementEnd++
		) {
			const element = parseElement(start, elementEnd, tokens);

			if (element instanceof ParseError) {
				// Store the latest error in parsing an element. This will be the
				// error with the largest possible match if all of the input tokens
				// fail to match.
				error = element;
			} else {
				const elements = parseElements(elementEnd, end, tokens);

				if (!(elements instanceof ParseError)) {
					// Combine the first element with the rest of the elements.
					let elementsAll = [element];

					for (let i = 0; i < elements.length; i++) {
						elementsAll.push(elements[i]);
					}

					return elementsAll;
				}
			}
		}

		return new ParseError(
			parseErrorMessage("Parser expected valid elements but encountered an error."),
			start,
			end,
			error
		);
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
	const tokenFirst = tokens[start];
	const tokenLast = tokens[end - 1];
	const length = end - start;

	if (length === 0) {
		// Return an error because this parser does not accept empty inputs.
		return new ParseError(
			parseErrorMessage("Parser expected an element but received nothing."),
			start,
			end
		);
	} else if (length === 1) {
		// The next alternate only matches on inputs with one token.
		if (
			tokenFirst.type === "tagOpen" &&
			tokenFirst.closed === true
		) {
			// Verify that the single token is a self-closing tag, and return a
			// new element without children.
			return {
				type: tokenFirst.value,
				attributes: tokenFirst.attributes,
				children: []
			};
		} else {
			return new ParseError(
				parseErrorMessage("Parser expected a self-closing tag or text."),
				start,
				end
			);
		}
	} else {
		// If the input size is greater than one, it must be a full element with
		// both opening and closing tags that match.
		if (
			tokenFirst.type === "tagOpen" &&
			tokenLast.type === "tagClose" &&
			tokenFirst.value === tokenLast.value
		) {
			// Attempt to parse the inner contents as children. They must be valid
			// for the element parse to succeed.
			const children = parseElements(start + 1, end - 1, tokens);

			if (children instanceof ParseError) {
				return new ParseError(
					parseErrorMessage("Parser expected valid child elements but encountered an error."),
					start,
					end,
					children
				);
			} else {
				return {
					type: tokenFirst.value,
					attributes: tokenFirst.attributes,
					children
				};
			}
		} else {
			return new ParseError(
				parseErrorMessage("Parser expected an element with matching opening and closing tags."),
				start,
				end
			);
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
export function parse(tokens) {
	const tree = parseElement(0, tokens.length, tokens);

	if (
		process.env.MOON_ENV === "development" &&
		tree instanceof ParseError
	) {
		// Append error messages and print all of them with their corresponding
		// locations in the source.
		let parseErrors = "";
		let parseError = tree;

		do {
			parseErrors += `\n\n${parseError.message}\n`;

			// Collect the tokens responsible for the error as well as the
			// surrounding tokens.
			for (
				let i = Math.max(0, parseError.start - 2);
				i < Math.min(parseError.end + 2, tokens.length);
				i++
			) {
				parseErrors += tokenString(tokens[i]);
			}
		} while ((parseError = parseError.next) !== undefined);

		error(`Parser failed to process the view.${parseErrors}`);
	}

	return tree;
}
