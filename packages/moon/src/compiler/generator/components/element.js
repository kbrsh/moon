import { generateStaticPart } from "../util/util";
import { types } from "../../../util/util";

/**
 * Generates code for a node from an `element` element.
 *
 * @param {Object} element
 * @param {number} variable
 * @param {Array} staticParts
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export function generateNodeElement(element, variable, staticParts) {
	const attributes = element.attributes;
	const name = attributes.name;
	const data = attributes.data;
	const children = attributes.children;
	const dataIsStatic = data.isStatic;
	const childrenIsStatic = children.isStatic;
	const isStatic = name.isStatic && dataIsStatic && childrenIsStatic;
	let dataValue = data.value;
	let childrenValue = children.value;

	if (!isStatic) {
		if (dataIsStatic) {
			dataValue = generateStaticPart("", dataValue, staticParts);
		}

		if (childrenIsStatic) {
			childrenValue = generateStaticPart("", childrenValue, staticParts);
		}
	}

	return {
		prelude: "",
		node: `m(${types.element},${name.value},${dataValue},${childrenValue})`,
		isStatic,
		variable
	};
}
