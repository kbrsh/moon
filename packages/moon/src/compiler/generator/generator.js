import { generateNodeElement } from "./components/element";
import { generateNodeIf } from "./components/if";
import { generateNodeFor } from "./components/for";
import { types } from "../../util/util";

/**
 * Generates code for a node from an element.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @param {number} variable
 * @param {Array} staticParts
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export function generateNode(element, parent, index, variable, staticParts) {
	const name = element.name;
	let type;
	let staticData = true;
	let staticChildren = true;

	// Generate the correct type number for the given name.
	if (name === "element") {
		return generateNodeElement(element, variable, staticParts);
	} else if (name === "if") {
		return generateNodeIf(element, parent, index, variable, staticParts);
	} else if (name === "for") {
		return generateNodeFor(element, variable, staticParts);
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
	let children = "[";
	let separator = "";

	for (let attribute in attributes) {
		const attributeValue = attributes[attribute];

		// Mark the data as dynamic if there are any dynamic attributes.
		if (!attributeValue.isStatic) {
			staticData = false;
		}

		data += `${separator}"${attribute}":${attributeValue.value}`;
		separator = ",";
	}

	data += "}";

	// Generate children.
	const elementChildren = element.children;
	let generateChildren = [];
	separator = "";

	for (let i = 0; i < elementChildren.length; i++) {
		const generateChild = generateNode(
			elementChildren[i],
			element,
			i,
			variable,
			staticParts
		);

		// Mark the children as dynamic if any child is dynamic.
		if (!generateChild.isStatic) {
			staticChildren = false;
		}

		// Update the variable counter.
		variable = generateChild.variable;

		generateChildren.push(generateChild);
	}

	for (let i = 0; i < generateChildren.length; i++) {
		const generateChild = generateChildren[i];

		if (staticChildren || !generateChild.isStatic) {
			// If the children are static or the children and child node are
			// dynamic, then append the child as a part of the node as usual.
			prelude += generateChild.prelude;
			children += separator + generateChild.node;
		} else {
			// If the children are dynamic and the child node is static, then use
			// a static node in place of the static child.
			const staticVariable = staticParts.length;

			staticParts.push(`${generateChild.prelude}ms[${staticVariable}]=${generateChild.node};`);

			children += separator + `ms[${staticVariable}]`;
		}

		separator = ",";
	}

	children += "]";

	if (staticData && !staticChildren) {
		// If only the data is static, hoist it out.
		const staticVariable = staticParts.length;

		staticParts.push(`ms[${staticVariable}]=${data};`);

		data = `ms[${staticVariable}]`;
	} else if (!staticData && staticChildren) {
		// If only the children are static, hoist them out.
		const staticVariable = staticParts.length;

		staticParts.push(`ms[${staticVariable}]=${children};`);

		children = `ms[${staticVariable}]`;
	}

	return {
		prelude,
		node: `m(${type},"${name}",${data},${children})`,
		isStatic: staticData && staticChildren,
		variable
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
 * @returns {string} view function code
 */
export function generate(element) {
	// Store static parts.
	const staticParts = [];

	// Generate the root node and get the prelude and node code.
	const { prelude, node, isStatic } = generateNode(
		element,
		null,
		0,
		0,
		staticParts
	);

	if (isStatic) {
		// Account for a static root node.
		return `if(ms[0]===undefined){${prelude}ms[0]=${node};}return ms[0];`;
	} else {
		// Generate static parts only once at the start.
		return `if(ms[0]===undefined){${staticParts.join("")}}${prelude}return ${node};`;
	}
}
