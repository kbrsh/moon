import { generateNode } from "../generator";
import { types } from "../../../util/util";
import { generateVariable, setGenerateVariable } from "../util/globals";

/**
 * Generates view function code and prelude code for a `for` element.
 *
 * @param {Object} element
 * @returns {Object} View function code and prelude code
 */
export function generateNodeFor(element) {
	const variable = "m" + generateVariable;
	const dataValue = element.attributes[""];
	const dataArray = element.attributes["of"];
	const dataObject = element.attributes["in"];

	setGenerateVariable(generateVariable + 1);

	const generateChild = generateNode(element.children[0], element, 0);
	const body = `${generateChild.prelude}${variable}.push(${generateChild.node});`;

	return {
		prelude: `var ${variable}=[];${
			dataArray === undefined ?
				`for(var ${dataValue} in ${dataObject}){${body}}` :
				`for(var i=0;i<${dataArray}.length;i++){var ${dataValue}=${dataArray}[i];${body}}`
		}`,
		node: `{type:${types.element},name:"span",data:{children:${variable}}}`
	};
}
