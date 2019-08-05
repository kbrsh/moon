import generateNodeElement from "moon-compiler/src/generator/components/element";
import generateNodeIf from "moon-compiler/src/generator/components/if";
import generateNodeFor from "moon-compiler/src/generator/components/for";
import { generateStaticPart } from "moon-compiler/src/generator/util/util";

/**
 * Generator
 *
 * The generator is responsible for generating a function that creates a view.
 * A view is represented as a normal set of recursive function calls, these
 * functions are components.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @param {number} variable
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export default function generate(element, parent, index, variable, staticParts, staticPartsMap) {
	const name = element.name;
	let staticData = true;
	let staticChildren = true;

	// Generate the correct type number for the given name.
	if (name === "element") {
		return generateNodeElement(element, variable);
	} else if (name === "if") {
		return generateNodeIf(element, parent, index, variable, staticParts, staticPartsMap);
	} else if (name === "for") {
		return generateNodeFor(element, variable, staticParts, staticPartsMap);
	}

	const attributes = element.attributes;
	let prelude = "";
	let data = "";
	let children = "";
	let dataSeparator = "";
	let childrenSeparator = "";

	for (const attributeKey in attributes) {
		const attributeValue = attributes[attributeKey];

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

			data += `${dataSeparator}"${attributeKey}":${attributeValue.value}`;
			dataSeparator = ",";
		}
	}

	// Generate children if they weren't provided in an attribute.
	if (!("children" in attributes)) {
		const elementChildren = element.children;
		const generateChildren = [];
		children += "[";

		for (let i = 0; i < elementChildren.length; i++) {
			const generateChild = generate(
				elementChildren[i],
				element,
				i,
				variable,
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
				children += childrenSeparator + generateChild.node;
			} else {
				// If the children are dynamic and the child node is static, then use
				// a static node in place of the static child.
				const staticPart = generateStaticPart(
					generateChild.prelude,
					generateChild.node,
					variable,
					staticParts,
					staticPartsMap
				);
				variable = staticPart.variable;
				children += childrenSeparator + staticPart.variableStatic;
			}

			childrenSeparator = ",";
		}

		children += "]";
	}

	if (!staticData && staticChildren) {
		// If only the children are static, hoist them out.
		const staticPart = generateStaticPart("", children, variable, staticParts, staticPartsMap);
		variable = staticPart.variable;
		children = staticPart.variableStatic;
	}

	// Find the type.
	if (name[0] === name[0].toUpperCase()) {
		return {
			prelude,
			node: `${name}({${data}${dataSeparator}children:${children}})`,
			isStatic: staticData && staticChildren,
			variable
		};
	} else {
		// Add braces around the data.
		data = `{${data}}`;

		if (staticData && !staticChildren) {
			// If only the data is static, hoist it out. This is only done for
			// elements and text because components have children as a part of
			// their data. In order to hoist it, the data and children have to be
			// static, which means that the whole node is static anyway. Instead,
			// children are the only ones hoisted for components, while both data
			// and children are hoisted for elements and text.
			const staticPart = generateStaticPart("", data, variable, staticParts, staticPartsMap);
			variable = staticPart.variable;
			data = staticPart.variableStatic;
		}

		return {
			prelude,
			node: `Moon.view.m("${name}",${data},${children})`,
			isStatic: staticData && staticChildren,
			variable
		};
	}
}
