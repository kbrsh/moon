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
