import generate from "moon-compiler/src/generator/generator";
import { generateStaticPart } from "moon-compiler/src/generator/util/util";

/**
 * Generates code for a node from a `for` element.
 *
 * @param {Object} element
 * @param {number} variable
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export default function generateNodeFor(element, variable, staticParts, staticPartsMap) {
	const variableForChildren = "m" + variable;
	const variableForChild = "m" + (variable + 1);
	const variableForKey = "m" + (variable + 2);
	const attributes = element.attributes;
	const parameters = attributes[""].value;

	// Generate the child and pass the parameters as locals.
	const generateChild = generate(
		element.children[0],
		element,
		0,
		variable + 3,
		staticParts,
		staticPartsMap
	);

	// Generate the child function.
	let childFunction;
	variable = generateChild.variable;

	if (generateChild.isStatic) {
		// If the child is static, then use a static node in place of it.
		const staticPart = generateStaticPart(generateChild.prelude, generateChild.node, variable, staticParts, staticPartsMap);
		variable = staticPart.variable;
		childFunction = `return ${staticPart.variableStatic};`;
	} else {
		// If the child is dynamic, then use the dynamic node in the loop body.
		childFunction = `${generateChild.prelude}return ${generateChild.node};`;
	}

	childFunction = `${variableForChild}=function(${parameters}){${childFunction}};`;

	// Generate the iterable, loop, and arguments for the child function.
	let iterable;
	let loop;
	let args;

	if ("in" in attributes) {
		// Generate a `for` loop over an object. The first local is the key and
		// the second is the value.
		iterable = attributes.in.value;
		loop = `for(${variableForKey} in ${iterable}){`;
		args = `${variableForKey},${iterable}[${variableForKey}]`;
	} else {
		// Generate a `for` loop over an array. The first local is the value and
		// the second is the key (index).
		iterable = attributes.of.value;
		loop = `for(${variableForKey}=0;${variableForKey}<${iterable}.length;${variableForKey}++){`;
		args = `${iterable}[${variableForKey}],${variableForKey}`;
	}

	// Generate any custom data or create static data as an empty object.
	let data;

	if ("data" in attributes) {
		data = attributes.data.value;
	} else {
		const staticPart = generateStaticPart("", "{}", variable, staticParts, staticPartsMap);
		variable = staticPart.variable;
		data = staticPart.variableStatic;
	}

	return {
		prelude: `${variableForChildren}=[];${childFunction}${loop}${variableForChildren}.push(${variableForChild}(${args}));}`,
		node: `Moon.view.m(${"name" in attributes ? attributes.name.value : "\"span\""},${data},${variableForChildren})`,
		isStatic: false,
		variable
	};
}
