/**
 * View node types.
 */
export const types = {
	element: 0,
	text: 1,
	component: 2
};

/**
 * Checks if a given character is a quote.
 *
 * @param {string} char
 * @returns {boolean} True if the character is a quote
 */
export function isQuote(char) {
	return char === "\"" || char === "'";
}

/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
	console.error(`[Moon] ERROR: ${message}`);
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

	for (let key in fallback) {
		full[key] = fallback[key];
	}

	for (let key in obj) {
		full[key] = obj[key];
	}

	return full;
}
