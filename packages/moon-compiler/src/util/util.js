/**
 * See if a character is an unescaped quote.
 *
 * @param {string} char
 * @param {string} charPrevious
 * @returns {Boolean} quote status
 */
export function isQuote(char, charPrevious) {
	return charPrevious !== "\\" && (char === "\"" || char === "'");
}
