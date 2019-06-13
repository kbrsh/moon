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
	const isStatic = name.isStatic && dataIsStatic && children.isStatic;
	let dataValue = data.value;

	if (!isStatic && dataIsStatic) {
		const staticVariable = staticParts.length;

		staticParts.push(`ms[${staticVariable}]=${dataValue};`);

		dataValue = `ms[${staticVariable}]`;
	}

	return {
		prelude: "",
		node: `m(${types.element},${name.value},${dataValue},${children.value})`,
		isStatic,
		variable
	};
}
