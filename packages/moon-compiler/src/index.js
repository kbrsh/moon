import { lex } from "moon-compiler/src/lexer/lexer";
import parse from "moon-compiler/src/parser/parser";
import generate from "moon-compiler/src/generator/generator";
import { generateStaticPart } from "moon-compiler/src/generator/util/util";
import { isQuote, whitespaceRE } from "moon-compiler/src/util/util";

/**
 * Returns the number of newlines in a string.
 *
 * @param {string} string
 * @returns {number} number of newlines
 */
function countNewlines(string) {
	let count = 0;

	for (let i = 0; i < string.length; i++) {
		if (string[i] === "\n") {
			count += 1;
		}
	}

	return count;
}

/**
 * Compiles a JavaScript file with Moon syntax.
 *
 * @param {string} input
 * @returns {string} file code
 */
function compile(input) {
	let output = "";
	let variable = 0;

	for (let i = 0; i < input.length;) {
		const char = input[i];

		if (char === "(") {
			// Skip over the parenthesis.
			output += char;

			// Skip over whitespace.
			for (i++; i < input.length; i++) {
				const char = input[i];

				if (whitespaceRE.test(char)) {
					output += char;
				} else {
					break;
				}
			}

			// Check if is a view.
			if (input[i] === "<") {
				// Record the view.
				let view = "";

				// Store opened parentheses.
				let opened = 0;

				for (; i < input.length;) {
					const char = input[i];

					if (char === ")" && opened === 0) {
						break;
					} else if (isQuote(char, input[i - 1])) {
						// Skip over strings.
						view += char;

						for (i++; i < input.length; i++) {
							const charString = input[i];

							// Add the string contents to the output.
							view += charString;

							if (isQuote(charString, input[i - 1]) && charString === char) {
								// Skip over the closing quote.
								i += 1;

								// Exit after the closing quote.
								break;
							}
						}
					} else {
						if (char === "(") {
							opened += 1;
						} else if (char === ")") {
							opened -= 1;
						}

						view += char;
						i += 1;
					}
				}

				const staticParts = [];
				const staticPartsMap = {};
				const result = generate(parse(lex(view)), null, 0, variable, staticParts, staticPartsMap);
				let resultCode;

				variable = result.variable;

				if (result.isStatic) {
					// Generate a static output.
					const staticPart = generateStaticPart(result.prelude, result.node, variable, staticParts, staticPartsMap);
					variable = staticPart.variable;
					resultCode = `(function(){if(${staticPart.variableStatic}===undefined){${staticParts[0].variablePart}}return ${staticPart.variableStatic};})()`;
				} else {
					// Add the prelude to the last seen block and the node in place of the expression.
					resultCode = `(function(){${staticParts.length === 0 ? "" : `if(${staticParts[0].variableStatic}===undefined){${staticParts.map(staticPart => staticPart.variablePart).join("")}}`}${result.prelude}return ${result.node};})()`;
				}

				// Append result code to output.
				output += resultCode;

				// Preserve newlines.
				const newlines = countNewlines(view) - countNewlines(resultCode);

				for (let i = 0; i < newlines; i++) {
					output += "\n";
				}
			}
		} else if (isQuote(char, input[i - 1])) {
			// If there is a string in the code, skip over it.
			output += char;

			for (i++; i < input.length; i++) {
				const charString = input[i];

				// Add the string contents to the output.
				output += charString;

				if (isQuote(charString, input[i - 1]) && charString === char) {
					// Skip over the closing quote.
					i += 1;

					// Exit after the closing quote.
					break;
				}
			}
		} else if (char === "/" && input[i + 1] === "/") {
			// Skip over the line.
			for (; i < input.length; i++) {
				const char = input[i];
				output += char;

				if (char === "\n") {
					// Skip over the newline.
					i += 1;

					// Exit after the newline.
					break;
				}
			}
		} else if (char === "/" && input[i + 1] === "*") {
			// Skip over the multiline comment.
			output += "/*";
			i += 2;

			for (; i < input.length; i++) {
				const char = input[i];
				output += char;

				if (char === "*" && input[i + 1] === "/") {
					// Skip over the closing delimiter.
					output += "/";
					i += 2;

					// Exit after the comment.
					break;
				}
			}
		} else {
			// Add the character to the output as normal.
			output += char;
			i += 1;
		}
	}

	// Define variables in the beginning and return the output.
	let prelude = "";
	let separator = "";

	if (variable !== 0) {
		prelude += "var ";

		for (let i = 0; i < variable; i++) {
			prelude += `${separator}m${i}`;
			separator = ",";
		}

		prelude += ";";
	}

	return prelude + output;
}

export default {
	compile,
	generate,
	lex,
	parse
};
