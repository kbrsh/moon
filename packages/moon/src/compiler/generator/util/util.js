/**
 * Generates a static part.
 *
 * @param {string} prelude
 * @param {string} part
 * @param {Array} staticParts
 * @returns {string} static variable
 */
export function generateStaticPart(prelude, part, staticParts) {
	const staticVariable = `ms[${staticParts.length}]`;

	staticParts.push(`${prelude}${staticVariable}=${part};`);

	return staticVariable;
}
