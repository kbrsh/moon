import parse from "moon-compiler/src/parse";
import generate from "moon-compiler/src/generate";
import { format } from "moon-compiler/src/util";
import { error } from "util/index";

/**
 * Compiles a JavaScript file with Moon syntax.
 *
 * @param {string} input
 * @returns {string} file code
 */
export default function compile(input) {
	const parseOutput = parse(input);

	if (process.env.MOON_ENV === "development" && parseOutput.constructor.name === "ParseError") {
		error(`Invalid input to parser.

Attempted to parse input.

Expected ${parseOutput.expected}.

Received:

${format(input, parseOutput.index)}`);
	}

	return generate(parseOutput[0][0]);
}
