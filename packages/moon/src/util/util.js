/**
 * Does nothing.
 */
export function noop() {}

/**
 * Returns a value if it is defined, or else returns a default value.
 *
 * @param value
 * @param fallback
 * @returns Value or default value
 */
export function valueDefault(value, fallback) {
	return value === undefined ? fallback : value;
}

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
	if (process.env.MOON_ENV === "development") {
		console.error("[Moon] ERROR: " + message);
	}
}
