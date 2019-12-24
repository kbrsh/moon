import { pad } from "util/index";

/**
 * Formats lines surrounding a certain index in a string.
 *
 * @param {string} input
 * @param {number} index
 * @returns {string} formatted lines
 */
export function format(input, index) {
	const lines = input.split("\n");
	let lineNumber = 1;
	let columnNumber = 1;

	for (let i = 0; i < input.length; i++) {
		const character = input[i];

		if (i === index) {
			const lineNumberPrevious = lineNumber - 1;
			const lineNumberNext = lineNumber + 1;
			const lineNumberLength = Math.max(
				Math.floor(Math.log10(lineNumberPrevious) + 1),
				Math.floor(Math.log10(lineNumber) + 1),
				Math.floor(Math.log10(lineNumberNext) + 1)
			) + 2;
			const linePrevious = lines[lineNumberPrevious - 1];
			const line = lines[lineNumber - 1];
			const lineNext = lines[lineNumberNext - 1];
			let formatted = "";

			if (linePrevious !== undefined) {
				formatted += pad(lineNumberPrevious + "| ", lineNumberLength) + linePrevious + "\n";
			}

			formatted += pad(lineNumber + "| ", lineNumberLength) + line + "\n" + pad("| ", lineNumberLength) + pad("^", columnNumber);

			if (lineNext !== undefined) {
				formatted += "\n" + pad(lineNumberNext + "| ", lineNumberLength) + lineNext;
			}

			return formatted;
		}

		if (character === "\n") {
			lineNumber += 1;
			columnNumber = 1;
		} else {
			columnNumber += 1;
		}
	}
}
