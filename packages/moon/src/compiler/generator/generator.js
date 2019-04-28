import { generateNodeIf } from "./components/if";
import { setGenerateVariable } from "./util/globals";
import { types } from "../../util/util";

/**
 * Generates view function code for a Moon node from an element.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @returns {Object} View function code and prelude code
 */
export function generateNode(element, parent, index) {
	const name = element.type;
	let type;

	// Generate the correct type number for the given name.
	if (name === "if") {
		return generateNodeIf(element, parent, index);
	} else if (name === "text") {
		type = types.text;
	} else if (name[0] === name[0].toLowerCase()) {
		type = types.element;
	} else {
		type = types.component;
	}

	const attributes = element.attributes;
	let prelude = "";
	let data = "{";
	let separator = "";

	for (let attribute in attributes) {
		data += `${separator}"${attribute}":${attributes[attribute]}`;
		separator = ",";
	}

	if (attributes.children === undefined) {
		// Generate children if they are not in the element data.
		const children = element.children;
		data += separator + "children:[";

		separator = "";
		for (let i = 0; i < children.length; i++) {
			const childNode = generateNode(children[i], element, i);

			prelude += childNode.prelude;
			data += separator + childNode.node;

			separator = ",";
		}

		data += "]";
	}

	return {
		prelude,
		node: `{type:${type},name:"${name}",data:${data}}}`
	};
}

/**
 * Generator
 *
 * The generator is responsible for generating a function that creates a view.
 * A view could be represented as a normal set of recursive function calls, but
 * it uses lightweight objects to represent them instead. This allows the
 * executor to execute the function over multiple frames with its own
 * representation of the stack.
 *
 * @param {Object} element
 * @returns {string} View function code
 */
export function generate(element) {
	// Reset generator variable.
	setGenerateVariable(0);

	// Generate the root node and get the prelude and node code.
	const { prelude, node } = generateNode(element, null, 0);

	// Convert the code into a usable function body.
	return `${prelude}return ${node};`;
}
