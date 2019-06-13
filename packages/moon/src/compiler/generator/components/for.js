import { generateNode } from "../generator";
import { types } from "../../../util/util";
import { defaultValue } from "../../../util/util";

/**
 * Generates code for a node from a `for` element.
 *
 * @param {Object} element
 * @param {number} variable
 * @param {Array} staticParts
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export function generateNodeFor(element, variable, staticParts) {
	const variableFor = "m" + variable;
	const attributes = element.attributes;
	const dataLocals = attributes[""].value.split(",");
	const dataName = defaultValue(attributes.name, {value: "\"span\""}).value;
	let dataData = defaultValue(attributes.data, {value: "{}", isStatic: true});
	let dataArray = attributes.of;
	let dataObject = attributes.in;
	let dataKey;
	let dataValue;
	let prelude;

	const generateChild = generateNode(
		element.children[0],
		element,
		0,
		variable + 1,
		staticParts
	);

	let body;
	variable = generateChild.variable;

	if (generateChild.isStatic) {
		// If the body is static, then use a static node in place of it.
		const staticVariable = staticParts.length;

		staticParts.push(`${generateChild.prelude}ms[${staticVariable}]=${generateChild.node};`);

		body = `${variableFor}.push(ms[${staticVariable}]);`;
	} else {
		// If the body is dynamic, then use the dynamic node in the loop body.
		body = `${generateChild.prelude}${variableFor}.push(${generateChild.node});`;
	}

	if (dataArray === undefined) {
		// Generate a `for` loop over an object. The first local is the key and
		// the second is the value.
		let dataObjectValue;
		dataObject = dataObject.value;
		dataKey = dataLocals[0];

		if (dataLocals.length === 2) {
			dataValue = dataLocals[1];
			dataObjectValue = `var ${dataValue}=${dataObject}[${dataKey}];`;
		} else {
			dataObjectValue = "";
		}

		prelude = `for(var ${dataKey} in ${dataObject}){${dataObjectValue}${body}}`;
	} else {
		// Generate a `for` loop over an array. The first local is the value and
		// the second is the key (index).
		dataArray = dataArray.value;
		dataKey = dataLocals.length === 2 ? dataLocals[1] : ("m" + variable++);
		dataValue = dataLocals[0];
		prelude = `for(var ${dataKey}=0;${dataKey}<${dataArray}.length;${dataKey}++){var ${dataValue}=${dataArray}[${dataKey}];${body}}`;
	}

	if (dataData.isStatic) {
		const staticVariable = staticParts.length;

		staticParts.push(`ms[${staticVariable}]=${dataData.value};`);

		dataData = `ms[${staticVariable}]`;
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
