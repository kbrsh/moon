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
