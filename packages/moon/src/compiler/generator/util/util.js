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
