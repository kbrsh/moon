import { generateNode } from "../generator";
import { expressionRE, generateStaticPart, generateValue, globals } from "../util/util";
import { types } from "../../../util/util";

/**
 * Generates code for a node from a `for` element.
 *
 * @param {Object} element
 * @param {number} variable
 * @param {Array} locals
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export function generateNodeFor(element, variable, locals, staticParts, staticPartsMap) {
	const variableForChildren = "m" + variable;
	const variableForChild = "m" + (variable + 1);
	const variableForKey = "m" + (variable + 2);
	const attributes = element.attributes;
	const parameters = attributes[""].value;
	const name = "name" in attributes ? attributes.name.value : "\"span\"";
	let data = "data" in attributes ? generateValue("data", attributes.data, locals) : { value: "{}", isStatic: true };

	// Extract locals from the child parameters.
	let local;

	while ((local = expressionRE.exec(parameters)) !== null) {
		local = local[1];

		if (local !== undefined && globals.indexOf(local) === -1 && locals.indexOf(local) === -1) {
			locals = locals.concat([local]);
		}
	}

	// Generate the child and pass the parameters as locals.
	const generateChild = generateNode(
		element.children[0],
		element,
		0,
		variable + 3,
		locals,
		staticParts,
		staticPartsMap
	);

	// Generate the child function.
	let childFunction;
	variable = generateChild.variable;

	if (generateChild.isStatic) {
		// If the child is static, then use a static node in place of it.
		childFunction = `return ${generateStaticPart(generateChild.prelude, generateChild.node, staticParts, staticPartsMap)};`;
	} else {
		// If the child is dynamic, then use the dynamic node in the loop body.
		childFunction = `${generateChild.prelude}return ${generateChild.node};`;
	}

	childFunction = `var ${variableForChild}=function(${parameters}){${childFunction}};`;

	// Generate the iterable, loop, and arguments for the child function.
	let iterable;
	let loop;
	let args;

	if ("in" in attributes) {
		// Generate a `for` loop over an object. The first local is the key and
		// the second is the value.
		iterable = generateValue("in", attributes.in, locals).value;
		loop = `for(var ${variableForKey} in ${iterable}){`;
		args = `${variableForKey},${iterable}[${variableForKey}]`;
	} else {
		// Generate a `for` loop over an array. The first local is the value and
		// the second is the key (index).
		iterable = generateValue("of", attributes.of, locals).value;
		loop = `for(var ${variableForKey}=0;${variableForKey}<${iterable}.length;${variableForKey}++){`;
		args = `${iterable}[${variableForKey}],${variableForKey}`;
	}

	if (data.isStatic) {
		data = generateStaticPart("", data.value, staticParts, staticPartsMap);
	} else {
		data = data.value;
	}

	return {
		prelude: `var ${variableForChildren}=[];${childFunction}${loop}${variableForChildren}.push(${variableForChild}(${args}));}`,
		node: `m(${types.element},${name},${data},${variableForChildren})`,
		isStatic: false,
		variable
	};
}
