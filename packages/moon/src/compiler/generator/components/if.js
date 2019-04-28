import { generateNode } from "../generator";
import { types } from "../../../util/util";
import { generateVariable, setGenerateVariable } from "../util/globals";

/**
 * Generates view function code and prelude code for an `if` element.
 *
 * @param {Object} element
 * @param {Object} parent
 * @param {number} index
 * @returns {Object} View function code and prelude code
 */
export function generateNodeIf(element, parent, index) {
	const variable = "m" + generateVariable;
	let prelude = "";
	let emptyElseClause = true;

	setGenerateVariable(generateVariable + 1);

	// Generate the initial `if` clause.
	const generateIf = generateNode(element.children[0], element, 0);

	prelude += `var ${variable};if(${element.attributes[""]}){${generateIf.prelude}${variable}=${generateIf.node};}`;

	// Search for `else-if` and `else` clauses if there are siblings.
	if (parent !== null) {
		const siblings = parent.children;

		for (let i = index + 1; i < siblings.length;) {
			const sibling = siblings[i];

			if (sibling.type === "else-if") {
				// Generate the `else-if` clause.
				const generateElseIf = generateNode(
					sibling.children[0],
					sibling,
					0
				);

				prelude += `else if(${sibling.attributes[""]}){${generateElseIf.prelude}${variable}=${generateElseIf.node};}`;

				// Remove the `else-if` clause so that it isn't generated
				// individually by the parent.
				siblings.splice(i, 1);
			} else if (sibling.type === "else") {
				// Generate the `else` clause.
				const generateElse = generateNode(
					sibling.children[0],
					sibling,
					0
				);

				prelude += `else{${generateElse.prelude}${variable}=${generateElse.node};}`;

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
		prelude += `else{${variable}={type:${types.text},name:"text",data:{"":"",children:[]}};}`;
	}

	return {
		prelude,
		node: variable
	};
}
