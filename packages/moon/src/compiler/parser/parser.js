/**
 * Parse elements
 *
 * Given a start index, end index, and a list of tokens, return a tree after
 * matching against the following grammar:
 *
 * Elements -> Empty | Element Elements
 *
 * The parsing algorithm is explained in more detail in the `parse` function.
 *
 * @param {integer} start
 * @param {integer} end
 * @param {Object[]} tokens
 * @returns {Object} Abstract syntax tree
 */
function parseElements(start, end, tokens) {
	const length = end - start;

	if (length === 0) {
		return [];
	} else {
		for (
			let elementEnd = start + 1;
			elementEnd <= end;
			elementEnd++
		) {
			const element = parse(start, elementEnd, tokens);

			if (element !== null) {
				const elements = parseElements(elementEnd, end, tokens);

				if (elements !== null) {
					return [element, ...elements];
				}
			}
		}

		return null;
	}
}

/**
 * Parser
 *
 * The parser is responsible for taking a start index, end index, and a list of
 * tokens to return an abstract syntax tree of a view template. The start and
 * end index are required because it is a recursive function that is called on
 * various sections of the tokens. Instead of passing down slices of the
 * tokens, it is much more efficient to keep the same reference and pass new
 * ranges. The start index is inclusive, and the end index is exclusive.
 *
 * The parser is built up of other parsers, including itself and
 * `parseChildren()`. Each parser is responsible for taking an input with a
 * length within a certain range. A parser has a set of alternates that are
 * matched *exactly* to the input. Each alternate distributes the input in
 * various ways across other parsers in every possible way. If an alternate
 * matches, it is returned as a new node in the tree. If it doesn't, and any
 * other alternates don't match either, then it returns an error.
 *
 * The simplest possible parser simply takes an input and ensures that it
 * matches a certain sequence of tokens. This parser is built from the
 * following structure:
 *
 * Element -> TagSelfClosing | TagOpen Elements TagClose
 * Elements -> Empty | Element Elements
 *
 * In this case, `TagSelfClosing`, `TagOpen`, and `TagClose` are primitive
 * parsers that ensure that the input token matches their respective token
 * type.
 *
 * @param {integer} start
 * @param {integer} end
 * @param {Object[]} tokens
 * @returns {Object} Abstract syntax tree
 */
export function parse(start, end, tokens) {
	const firstToken = tokens[start];
	const lastToken = tokens[end - 1];
	const length = end - start;

	if (length === 0) {
		// Return an error because this parser does not accept empty inputs.
		return null;
	} else if (length === 1) {
		// The next alternate only matches on inputs with one token.
		if (
			firstToken.type === "tagOpen" &&
			firstToken.closed === true
		) {
			// Verify that the single token is a self-closing tag, and return a
			// new element without children.
			return {
				type: firstToken.value,
				attributes: firstToken.attributes,
				children: []
			};
		} else {
			return null;
		}
	} else {
		// If the input size is greater than one, it must be a full element with
		// both opening and closing tags that match.
		if (
			firstToken.type === "tagOpen" &&
			lastToken.type === "tagClose" &&
			firstToken.value === lastToken.value
		) {
			// Attempt to parse the inner contents as children. They must be valid
			// for the element parse to succeed.
			const children = parseElements(start + 1, end - 1, tokens);

			if (children === null) {
				return null;
			} else {
				return {
					type: firstToken.value,
					attributes: firstToken.attributes,
					children
				};
			}
		} else {
			return null;
		}
	}
}
