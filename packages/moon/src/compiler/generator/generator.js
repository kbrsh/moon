import { instruction, instructions } from "../instructions/instruction";

/**
 * Generates code for an object.
 *
 * @param {Object} obj
 * @returns {string} Code for object
 */
function generateObject(obj) {
	let output = "{";

	for (let key in obj) {
		output += `"${key}":${obj[key]},`;
	}

	return `${output}}`;
}

/**
 * Generates instructions for creating, updating, and destroying the given
 * tree. Updates the data object with a mapping from expression to variable.
 * The `total` argument represents the total number of data mappings.
 *
 * @param {Object} tree
 * @param {Object} data
 * @param {Number} total
 * @return {Object} Data, create, update, and destroy functions
 */
function generateAll(tree, data, total) {
	const type = tree.type;

	if (type === "text") {
		const textVar = total++;
		const textContent = tree.attributes[""];

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
	} else if (type[0] === type[0].toLowerCase()) {
		// Tags that start with a lowercase letter are normal HTML elements. This
		// could be implemented as a user-defined component but is implemented
		// here for efficiency.
		const elementType = `"${type}"`;
		const elementAttributes = generateObject(tree.attributes);

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

		for (let i = 0; i < tree.children.length; i++) {
			const child = tree.children[i];
			const childCode = generateAll(child, data, total);

			childrenCreate += childCode.create;
			childrenCreate += instruction(instructions.appendElement, [
				childCode.createVar, elementVar
			]);

			childrenUpdate += childCode.update;

			childrenDestroy += childCode.destroy;

			total += childCode.total;
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
}

/**
 * Generator
 *
 * The generator is responsible for generating instructions that create a view.
 * These instructions create, update, and destroy components. For efficiency,
 * they also handle elements to remove a layer of abstraction. The instructions
 * are ran across multiple frames to allow the browser to handle other events.
 *
 * @param {Object} tree
 * @returns {Object} Data, create, update, and destroy functions
 */
export function generate(tree) {
	const data = {};
	let {
		create,
		createVar,

		update,

		destroy
	} = generateAll(tree, data, 0);

	let dataCode = "";

	for (let key in data) {
		dataCode += `this.m${data[key]}=${key};`;
	}

	create += instruction(instructions.returnVar, [createVar]);

	return {
		data: new Function(dataCode),
		create,
		update,
		destroy
	};
}
