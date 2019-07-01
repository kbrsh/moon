import { types } from "util/util";

/**
 * Generates code for a node from an `element` element.
 *
 * @param {Object} element
 * @param {number} variable
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export default function generateNodeElement(element, variable) {
	const attributes = element.attributes;
	const name = attributes.name;
	const data = attributes.data;
	const children = attributes.children;

	return {
		prelude: "",
		node: `Moon.view.m(${types.element},${name.value},${data.value},${children.value})`,
		isStatic: name.isStatic && data.isStatic && children.isStatic,
		variable
	};
}
