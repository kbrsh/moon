import { generateNode } from "../generator";
import { types } from "../../../util/util";
import { generateVariable, setGenerateVariable } from "../util/globals";

/**
 * Generates code for a node from a `for` element.
 *
 * @param {Object} element
 * @param {Array} staticNodes
 * @returns {Object} Prelude code, view function code, and static status
 */
export function generateNodeFor(element, staticNodes) {
	const variable = "m" + generateVariable;
	const dataLocals = element.attributes[""].split(",");
	const dataArray = element.attributes["of"];
	const dataObject = element.attributes["in"];
	let dataKey;
	let dataValue;
	let prelude;

	setGenerateVariable(generateVariable + 1);

	const generateChild = generateNode(
		element.children[0],
		element,
		0,
		staticNodes
	);
	let body;

	if (generateChild.isStatic) {
		// If the body is static, then use a static node in place of it.
		body = `${variable}.push(m[${staticNodes.length}]);`;

		staticNodes.push(generateChild);
	} else {
		// If the body is dynamic, then use the dynamic node in the loop body.
		body = `${generateChild.prelude}${variable}.push(${generateChild.node});`;
	}

	if (dataArray === undefined) {
		// Generate a `for` loop over an object. The first local is the key and
		// the second is the value.
		let dataObjectValue;

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
		dataKey = dataLocals.length === 2 ? dataLocals[1] : "mi";
		dataValue = dataLocals[0];
		prelude = `for(var ${dataKey}=0;${dataKey}<${dataArray}.length;${dataKey}++){var ${dataValue}=${dataArray}[${dataKey}];${body}}`;
	}

	return {
		prelude: `var ${variable}=[];${prelude}`,
		node: `{type:${types.element},name:"span",data:{children:${variable}}}`,
		isStatic: false
	};
}
