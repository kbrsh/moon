import generate from "moon-compiler/src/generator/generator";
import { generateStaticPart } from "moon-compiler/src/generator/util/util";

/**
 * Generates code for an `if`/`else-if`/`else` clause body.
 *
 * @param {number} variableIf
 * @param {Object} element
 * @param {number} variable
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {string} clause body and variable
 */
function generateClause(variableIf, element, variable, staticParts, staticPartsMap) {
	const generateBody = generate(
		element.children[0],
		element,
		0,
		variable,
		staticParts,
		staticPartsMap
	);
	let clause;
	variable = generateBody.variable;

	if (generateBody.isStatic) {
		// If the clause is static, then use a static node in place of it.
		const staticPart = generateStaticPart(generateBody.prelude, generateBody.node, variable, staticParts, staticPartsMap);
		variable = staticPart.variable;
		clause = `${variableIf}=${staticPart.variableStatic};`;
	} else {
		// If the clause is dynamic, then use the dynamic node.
		clause = `${generateBody.prelude}${variableIf}=${generateBody.node};`;
	}

	return {
		clause,
		variable
	};
}

/**
 * Generates code for a node from an `if` element.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @param {number} variable
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} prelude code, view function code, static status, and variable
 */
export default function generateNodeIf(element, parent, index, variable, staticParts, staticPartsMap) {
	const variableIf = "m" + variable;
	let prelude = "";
	let emptyElseClause = true;

	// Generate the initial `if` clause.
	const clauseIf = generateClause(variableIf, element, variable + 1, staticParts, staticPartsMap);

	prelude += `if(${element.attributes[""].value}){${clauseIf.clause}}`;
	variable = clauseIf.variable;

	// Search for `else-if` and `else` clauses if there are siblings.
	if (parent !== null) {
		const siblings = parent.children;

		for (let i = index + 1; i < siblings.length;) {
			const sibling = siblings[i];

			if (sibling.name === "else-if") {
				// Generate the `else-if` clause.
				const clauseElseIf = generateClause(variableIf, sibling, variable, staticParts, staticPartsMap);

				prelude += `else if(${sibling.attributes[""].value}){${clauseElseIf.clause}}`;
				variable = clauseElseIf.variable;

				// Remove the `else-if` clause so that it isn't generated
				// individually by the parent.
				siblings.splice(i, 1);
			} else if (sibling.name === "else") {
				// Generate the `else` clause.
				const clauseElse = generateClause(variableIf, sibling, variable, staticParts, staticPartsMap);

				prelude += `else{${clauseElse.clause}}`;
				variable = clauseElse.variable;

				// Skip generating the empty `else` clause.
				emptyElseClause = false;

				// Remove the `else` clause so that it isn't generated
				// individually by the parent.
				siblings.splice(i, 1);
			} else {
				break;
			}
		}
	}

	// Generate an empty `else` clause represented by an empty text node.
	if (emptyElseClause) {
		const staticPart = generateStaticPart("", `Moon.view.m("text",{"":""},[])`, variable, staticParts, staticPartsMap);
		variable = staticPart.variable;
		prelude += `else{${variableIf}=${staticPart.variableStatic};}`;
	}

	return {
		prelude,
		node: variableIf,
		isStatic: false,
		variable
	};
}
