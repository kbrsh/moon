/**
 * Generates code for an object.
 *
 * @param {Object} obj
 * @returns {string} Code for object
 */
export function generateObject(obj) {
	let output = "{";

	for (let key in obj) {
		output += `"${key}":${obj[key]},`;
	}

	return `${output}}`;
}
