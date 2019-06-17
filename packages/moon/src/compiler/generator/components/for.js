import { generateNode } from "../generator";
import { generateStaticPart } from "../util/util";
import { types } from "../../../util/util";

/**
 * Generates code for a node from a `for` element.
 *
 * @param {Object} element
 * @param {number} variable
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export function generateNodeFor(element, variable, staticParts, staticPartsMap) {
	const variableFor = "m" + variable;
	const attributes = element.attributes;
	const dataLocals = attributes[""].value.split(",");
	const dataName = "name" in attributes ? attributes.name.value : "\"span\"";
	let dataData = "data" in attributes ? attributes.data : { value: "{}", isStatic: true };
	let prelude;

	const generateChild = generateNode(
		element.children[0],
		element,
		0,
		variable + 1,
		staticParts,
		staticPartsMap
	);

	let body;
	variable = generateChild.variable;

	if (generateChild.isStatic) {
		// If the body is static, then use a static node in place of it.
		body = `${variableFor}.push(${generateStaticPart(generateChild.prelude, generateChild.node, staticParts, staticPartsMap)});`;
	} else {
		// If the body is dynamic, then use the dynamic node in the loop body.
		body = `${generateChild.prelude}${variableFor}.push(${generateChild.node});`;
	}

	if ("in" in attributes) {
		// Generate a `for` loop over an object. The first local is the key and
		// the second is the value.
		const dataObject = attributes.in.value;
		const dataKey = dataLocals[0];
		let dataObjectValue;

		if (dataLocals.length === 2) {
			dataObjectValue = `var ${dataLocals[1]}=${dataObject}[${dataKey}];`;
		} else {
			dataObjectValue = "";
		}

		prelude = `for(var ${dataKey} in ${dataObject}){${dataObjectValue}${body}}`;
	} else {
		// Generate a `for` loop over an array. The first local is the value and
		// the second is the key (index).
		const dataArray = attributes.of.value;
		const dataKey = dataLocals.length === 2 ? dataLocals[1] : ("m" + variable++);
		prelude = `for(var ${dataKey}=0;${dataKey}<${dataArray}.length;${dataKey}++){var ${dataLocals[0]}=${dataArray}[${dataKey}];${body}}`;
	}

	if (dataData.isStatic) {
		dataData = generateStaticPart("", dataData.value, staticParts, staticPartsMap);
	} else {
		dataData = dataData.value;
	}

	return {
		prelude: `var ${variableFor}=[];${prelude}`,
		node: `m(${types.element},${dataName},${dataData},${variableFor})`,
		isStatic: false,
		variable
	};
}
