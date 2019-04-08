import { instruction, instructions } from "../../instructions/instruction";

/**
 * Generates code for a text element.
 *
 * @param {Object} text
 * @param {Object} data
 * @param {number} total
 * @return {Object} Data, create, update, and destroy functions
 */
export function generateText(text, data, total) {
	const textVar = total++;
	const textContent = text.attributes[""];

	let textContentVar = data[textContent];

	if (textContentVar === undefined) {
		textContentVar = data[textContent] = total++;
	}

	return {
		create: instruction(instructions.createText, [textVar, textContentVar]),
		createVar: textVar,

		update: instruction(instructions.updateText, [textContentVar]),

		destroy: instruction(instructions.destroyElement, [textVar]),

		total
	};
}
