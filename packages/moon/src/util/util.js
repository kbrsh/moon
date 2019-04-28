/**
 * View node types.
 */
export const types = {
	element: 0,
	text: 1,
	component: 2
};

/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
	console.error("[Moon] ERROR: " + message);
}

/**
 * Returns a value or a default fallback if the value is undefined.
 *
 * @param value
 * @param fallback
 * @returns Value or default fallback
 */
export function defaultValue(value, fallback) {
	return value === undefined ? fallback : value;
}

/**
 * Returns an object using default fallback key/value pairs if they are
 * undefined.
 *
 * @param {Object} obj
 * @param {Object} fallback
 * @returns {Object} Full object with default key/value pairs
 */
export function defaultObject(obj, fallback) {
	let full = {};

	for (let key in obj) {
		full[key] = obj[key];
	}

	for (let key in fallback) {
		if (!(key in obj)) {
			full[key] = fallback[key];
		}
	}

	return full;
}
