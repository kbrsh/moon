/**
 * Capture the variables in expressions to scope them within the data
 * parameter. This ignores property names and deep object accesses.
 */
const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;

/**
 * List of global variables to ignore in expression scoping
 */
const globals = ["NaN", "false", "function", "in", "null", "this", "true", "typeof", "undefined", "window"];

/**
 * Generates a static value or an expression using `md` or `mc`.
 *
 * @param {string} expression
 * @returns {Object} generated value and static status
 */
export function generateValue(key, value, locals) {
	let valueValue = value.value;
	let valueIsStatic = true;

	if (value.isExpression) {
		valueValue = valueValue.replace(expressionRE, (match, name) => {
			if (name === undefined || globals.indexOf(name) !== -1) {
				// Return a static match if there are no dynamic names or if it is a
				// global variable.
				return match;
			} else {
				// Return a dynamic match if there is a local, dynamic name, data
				// reference, or children reference.
				valueIsStatic = false;

				if (locals.indexOf(name) !== -1) {
					return name;
				} else if (name === "data") {
					return "md";
				} else if (name === "children") {
					return "mc";
				} else {
					return "md." + name;
				}
			}
		});
	}

	if (key.charCodeAt(0) === 64) {
		valueValue = `[${valueValue},md,mc]`;
	}

	return {
		value: valueValue,
		isStatic: valueIsStatic
	};
}

/**
 * Generates a static part.
 *
 * @param {string} prelude
 * @param {string} part
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {string} static variable
 */
export function generateStaticPart(prelude, part, staticParts, staticPartsMap) {
	const staticPartsMapKey = prelude + part;

	if (staticPartsMapKey in staticPartsMap) {
		return staticPartsMap[staticPartsMapKey];
	} else {
		const staticVariable = staticPartsMap[staticPartsMapKey] = `ms[${staticParts.length}]`;

		staticParts.push(`${prelude}${staticVariable}=${part};`);

		return staticVariable;
	}
}
