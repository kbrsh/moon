import { generateStaticPart, generateValue } from "../util/util";
import { types } from "../../../util/util";

/**
 * Generates code for a node from an `element` element.
 *
 * @param {Object} element
 * @param {number} variable
 * @param {Array} locals
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export function generateNodeElement(element, variable, locals, staticParts, staticPartsMap) {
	const attributes = element.attributes;
	const name = generateValue("name", attributes.name, locals);
	const data = generateValue("data", attributes.data, locals);
	const children = generateValue("children", attributes.children, locals);
	const dataIsStatic = data.isStatic;
	const childrenIsStatic = children.isStatic;
	const isStatic = name.isStatic && dataIsStatic && childrenIsStatic;
	let dataValue = data.value;
	let childrenValue = children.value;

	if (!isStatic) {
		if (dataIsStatic) {
			dataValue = generateStaticPart("", dataValue, staticParts, staticPartsMap);
		}

		if (childrenIsStatic) {
			childrenValue = generateStaticPart("", childrenValue, staticParts, staticPartsMap);
		}
	}

	return {
		prelude: "",
		node: `m(${types.element},${name.value},${dataValue},${childrenValue})`,
		isStatic,
		variable
	};
}
