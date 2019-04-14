import { types } from "../../util/util";

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
	let type;
	const name = element.type;

	if (name === "text") {
		type = types.text;
	} else if (name[0] === name[0].toLowerCase()) {
		type = types.element;
	} else {
		type = types.component;
	}

	let data = "{";

	for (let attribute in element.attributes) {
		data += `"${attribute}":${element.attributes[attribute]},`;
	}

	data += "children:[";

	let separator = "";
	for (let i = 0; i < element.children.length; i++) {
		data += separator + generate(element.children[i]);
		separator = ",";
	}

	return `{type:${type},name:"${name}",data:${data}]},node:null}`;
}
