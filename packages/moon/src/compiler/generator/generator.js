import { generateNodeIf } from "./components/if";
import { generateNodeFor } from "./components/for";
import { setGenerateVariable } from "./util/globals";
import { types } from "../../util/util";

/**
 * Generates code for a node from an element.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @param {Array} staticNodes
 * @returns {Object} Prelude code, view function code, and static status
 */
export function generateNode(element, parent, index, staticNodes) {
	const name = element.name;
	let type;
	let isStatic = true;

	// Generate the correct type number for the given name.
	if (name === "if") {
		return generateNodeIf(element, parent, index, staticNodes);
	} else if (name === "for") {
		return generateNodeFor(element, staticNodes);
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
		const attributeValue = attributes[attribute];

		// Mark the current node as dynamic if there are any events or dynamic
		// attributes.
		if (
			attribute[0] === "@" ||
			(attributeValue[0] !== "\"" && attributeValue[0] !== "'")
		) {
			isStatic = false;
		}

		data += `${separator}"${attribute}":${attributeValue}`;
		separator = ",";
	}

	if (attributes.children === undefined) {
		// Generate children if they are not in the element data.
		const children = element.children;
		let generateChildren = [];

		data += separator + "children:[";
		separator = "";

		for (let i = 0; i < children.length; i++) {
			const generateChild = generateNode(
				children[i],
				element,
				i,
				staticNodes
			);

			// Mark the current node as dynamic if any child is dynamic.
			if (!generateChild.isStatic) {
				isStatic = false;
			}

			generateChildren.push(generateChild);
		}

		for (let i = 0; i < generateChildren.length; i++) {
			const generateChild = generateChildren[i];

			if (isStatic || !generateChild.isStatic) {
				// If the whole current node is static or the current node and
				// child node are dynamic, then append the child as a part of the
				// node as usual.
				prelude += generateChild.prelude;
				data += separator + generateChild.node;
			} else {
				// If the whole current node is dynamic and the child node is
				// static, then use a static node in place of the static child.
				data += separator + `m[${staticNodes.length}]`;

				staticNodes.push(generateChild);
			}

			separator = ",";
		}

		data += "]";
	}

	return {
		prelude,
		node: `{type:${type},name:"${name}",data:${data}}}`,
		isStatic
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
	// Store static nodes.
	const staticNodes = [];

	// Reset generator variable.
	setGenerateVariable(0);

	// Generate the root node and get the prelude and node code.
	const { prelude, node, isStatic } = generateNode(
		element,
		null,
		0,
		staticNodes
	);

	if (isStatic) {
		// Account for a static root node.
		return `if(m[0]===undefined){${prelude}m[0]=${node};}return m[0];`;
	} else if (staticNodes.length === 0) {
		return `${prelude}return ${node};`;
	} else {
		// Generate static nodes only once at the start.
		let staticCode = `if(m[0]===undefined){`;

		for (let i = 0; i < staticNodes.length; i++) {
			const staticNode = staticNodes[i];

			staticCode += `${staticNode.prelude}m[${i}]=${staticNode.node};`;
		}

		staticCode += "}";

		return `${staticCode}${prelude}return ${node};`;
	}
}
