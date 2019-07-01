import { lex } from "moon-compiler/src/lexer/lexer";
import parse from "moon-compiler/src/parser/parser";
import generate from "moon-compiler/src/generator/generator";
import { generateStaticPart } from "moon-compiler/src/generator/util/util";
import { isQuote } from "moon-compiler/src/util/util";

/**
 * Compiles a JavaScript file with Moon syntax.
 *
 * @param {string} input
 * @returns {string} file code
 */
export default function compile(input) {
	let output = "";
	let variable = 0;

	for (let i = 0; i < input.length;) {
		const char = input[i];

		if (char === "(") {
			// Skip over the parenthesis.
			output += char;
			i += 1;

			// Record the expression.
			let expression = "";

			// Store opened parentheses.
			let opened = 0;

			for (; i < input.length;) {
				const char = input[i];

				if (char === ")" && opened === 0) {
					break;
				} else if (isQuote(char, input[i - 1])) {
					// Skip over strings.
					expression += char;

					for (i++; i < input.length; i++) {
						const charString = input[i];

						// Add the string contents to the output.
						expression += charString;

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

					expression += char;
					i += 1;
				}
			}

			// Remove surrounding whitespace.
			expression = expression.trim();

			if (expression[0] === "<") {
				// If it is a Moon view, then lex, parse, and generate code for it.
				const staticParts = [];
				const staticPartsMap = {};
				const result = generate(parse(lex(expression)), null, 0, variable, staticParts, staticPartsMap);

				variable = result.variable;

				if (result.isStatic) {
					// Generate a static output.
					const staticPart = generateStaticPart(result.prelude, result.node, variable, staticParts, staticPartsMap);
					variable = staticPart.variable;
					output += `(function(){if(${staticPart.variableStatic}===undefined){${staticParts[0].variablePart}}return ${staticPart.variableStatic};})()`;
				} else {
					// Add the prelude to the last seen block and the node in place of the expression.
					output += `(function(){${staticParts.length === 0 ? "" : `if(${staticParts[0].variableStatic}===undefined){${staticParts.map(staticPart => staticPart.variablePart).join("")}}`}${result.prelude}return ${result.node};})()`;
				}
			} else {
				// If not, then add it to the output as a normal expression.
				output += expression;
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
