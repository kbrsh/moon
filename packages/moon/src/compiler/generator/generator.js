import { generateNodeElement } from "./components/element";
import { generateNodeIf } from "./components/if";
import { generateNodeFor } from "./components/for";
import { generateStaticPart, generateValue } from "./util/util";
import { types } from "../../util/util";

/**
 * Generates code for a node from an element.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @param {number} variable
 * @param {Array} locals
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export function generateNode(element, parent, index, variable, locals, staticParts, staticPartsMap) {
	const name = element.name;
	let type;
	let staticData = true;
	let staticChildren = true;

	// Generate the correct type number for the given name.
	if (name === "element") {
		return generateNodeElement(element, variable, locals, staticParts, staticPartsMap);
	} else if (name === "if") {
		return generateNodeIf(element, parent, index, variable, locals, staticParts, staticPartsMap);
	} else if (name === "for") {
		return generateNodeFor(element, variable, locals, staticParts, staticPartsMap);
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
	let children = "";
	let separator = "";

	for (const attributeKey in attributes) {
		const attributeValue = generateValue(attributeKey, attributes[attributeKey], locals);

		// A `children` attribute takes place of component children.
		if (attributeKey === "children") {
			if (!attributeValue.isStatic) {
				staticChildren = false;
			}

			children = attributeValue.value;
		} else {
			// Mark the data as dynamic if there are any dynamic attributes.
			if (!attributeValue.isStatic) {
				staticData = false;
			}

			data += `${separator}"${attributeKey}":${attributeValue.value}`;
			separator = ",";
		}
	}

	data += "}";

	// Generate children if they weren't provided in an attribute.
	if (!("children" in attributes)) {
		const elementChildren = element.children;
		const generateChildren = [];
		children += "[";
		separator = "";

		for (let i = 0; i < elementChildren.length; i++) {
			const generateChild = generateNode(
				elementChildren[i],
				element,
				i,
				variable,
				locals,
				staticParts,
				staticPartsMap
			);

			// Mark the children as dynamic if any child is dynamic.
			if (!generateChild.isStatic) {
				staticChildren = false;
			}

			// Update the variable counter.
			variable = generateChild.variable;

			// Keep track of generated children.
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
				children += separator + generateStaticPart(
					generateChild.prelude,
					generateChild.node,
					staticParts,
					staticPartsMap
				);
			}

			separator = ",";
		}

		children += "]";
	}

	if (staticData && !staticChildren) {
		// If only the data is static, hoist it out.
		data = generateStaticPart("", data, staticParts, staticPartsMap);
	} else if (!staticData && staticChildren) {
		// If only the children are static, hoist them out.
		children = generateStaticPart("", children, staticParts, staticPartsMap);
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
		[],
		staticParts,
		{}
	);

	if (isStatic) {
		// Account for a static root node.
		return `if(!(0 in ms)){${prelude}ms[0]=${node};}return ms[0];`;
	} else {
		// Generate static parts only once at the start.
		return `if(!(0 in ms)){${staticParts.join("")}}${prelude}return ${node};`;
	}
}
