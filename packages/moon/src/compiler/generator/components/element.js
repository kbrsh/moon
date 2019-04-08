import { generateObject } from "../data/object";
import { generateAll } from "../generator";
import { instruction, instructions } from "../../instructions/instruction";

/**
 * Generates instructions for an element.
 *
 * @param {Object} element
 * @param {Object} data
 * @param {number} total
 * @return {Object} Data, create, update, and destroy functions
 */
export function generateElement(element, data, total) {
	const elementType = `"${element.type}"`;
	const elementAttributes = generateObject(element.attributes);

	const elementVar = total++;
	let elementNameVar = data[elementType];
	let elementAttributesVar = data[elementAttributes];

	if (elementNameVar === undefined) {
		elementNameVar = data[elementType] = total++;
	}

	if (elementAttributesVar === undefined) {
		elementAttributesVar = data[elementAttributes] = total++;
	}

	let childrenCreate = "";
	let childrenUpdate = "";
	let childrenDestroy = "";

	for (let i = 0; i < element.children.length; i++) {
		const child = element.children[i];
		const childCode = generateAll(child, data, total);

		childrenCreate += childCode.create;
		childrenCreate += instruction(instructions.appendElement, [
			childCode.createVar, elementVar
		]);

		childrenUpdate += childCode.update;

		childrenDestroy += childCode.destroy;

		total = childCode.total;
	}

	return {
		create: instruction(instructions.createElement, [
			elementVar, elementNameVar, elementAttributesVar
		]) + childrenCreate,
		createVar: elementVar,

		update: instruction(instructions.updateElement, [elementVar]) + childrenUpdate,

		destroy: instruction(instructions.destroyElement, [elementVar]) + childrenDestroy,

		total
	};
}
