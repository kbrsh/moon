import { generateNode } from "../generator";
import { types } from "../../../util/util";
import { generateVariable, setGenerateVariable } from "../util/globals";

/**
 * Generates code for an `if`/`else-if`/`else` clause body.
 *
 * @param {number} variable
 * @param {Object} element
 * @param {Array} staticNodes
 * @returns {string} clause body
 */
function generateClause(variable, element, staticNodes) {
	const generateBody = generateNode(element.children[0], element, 0, staticNodes);
	let clause;

	if (generateBody.isStatic) {
		// If the clause is static, then use a static node in place of it.
		clause = `${variable}=m[${staticNodes.length}];`;

		staticNodes.push(generateBody);
	} else {
		// If the clause is dynamic, then use the dynamic node.
		clause = `${generateBody.prelude}${variable}=${generateBody.node};`;
	}

	return clause;
}

/**
 * Generates code for a node from an `if` element.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @param {Array} staticNodes
 * @returns {Object} Prelude code, view function code, and static status
 */
export function generateNodeIf(element, parent, index, staticNodes) {
	const variable = "m" + generateVariable;
	let prelude = "";
	let emptyElseClause = true;

	setGenerateVariable(generateVariable + 1);

	// Generate the initial `if` clause.
	prelude += `var ${variable};if(${element.attributes[""].value}){${generateClause(variable, element, staticNodes)}}`;

	// Search for `else-if` and `else` clauses if there are siblings.
	if (parent !== null) {
		const siblings = parent.children;

		for (let i = index + 1; i < siblings.length;) {
			const sibling = siblings[i];

			if (sibling.name === "else-if") {
				// Generate the `else-if` clause.
				prelude += `else if(${sibling.attributes[""].value}){${generateClause(variable, sibling, staticNodes)}}`;

				// Remove the `else-if` clause so that it isn't generated
				// individually by the parent.
				siblings.splice(i, 1);
			} else if (sibling.name === "else") {
				// Generate the `else` clause.
				prelude += `else{${generateClause(variable, sibling, staticNodes)}}`;

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
		prelude += `else{${variable}=m[${staticNodes.length}];}`;

		staticNodes.push({
			prelude: "",
			node: `{type:${types.text},name:"text",data:{"":"",children:[]}}`,
			isStatic: true
		});
	}

	return {
		prelude,
		node: variable,
		isStatic: false
	};
}
