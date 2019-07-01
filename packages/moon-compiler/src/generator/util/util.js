/**
 * Generates a static part.
 *
 * @param {string} prelude
 * @param {string} part
 * @param {number} variable
 * @param {Array} staticParts
 * @param {Object} staticPartsMap
 * @returns {Object} variable and static variable
 */
export function generateStaticPart(prelude, part, variable, staticParts, staticPartsMap) {
	const staticPartsMapKey = prelude + part;

	if (staticPartsMapKey in staticPartsMap) {
		return {
			variable,
			variableStatic: staticPartsMap[staticPartsMapKey]
		};
	} else {
		const variableStatic = staticPartsMap[staticPartsMapKey] = `m${variable++}`;

		staticParts.push({
			variableStatic,
			variablePart: `${prelude}${variableStatic}=${part};`
		});

		return {
			variable,
			variableStatic
		};
	}
}
