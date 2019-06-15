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
	let staticVariable = staticPartsMap[staticPartsMapKey];

	if (staticVariable === undefined) {
		staticVariable = staticPartsMap[staticPartsMapKey] = `ms[${staticParts.length}]`;
		staticParts.push(`${prelude}${staticVariable}=${part};`);
	}

	return staticVariable;
}
