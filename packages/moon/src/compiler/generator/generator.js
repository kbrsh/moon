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
	const name = element.type;
	let type;

	if (name === "text") {
		type = types.text;
	} else if (name === "fragment") {
		type = types.fragment;
	} else if (name[0] === name[0].toLowerCase()) {
		type = types.element;
	} else {
		type = types.component;
	}

	const attributes = element.attributes;
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
			data += separator + generate(children[i]);
			separator = ",";
		}

		data += "]";
	}

	return `{type:${type},name:"${name}",data:${data}}}`;
}
