/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
	console.error("[Moon] ERROR: " + message);
}

/**
 * Pads a string with spaces on the left to match a certain length.
 *
 * @param {string} string
 * @param {number} length
 * @returns {string} padded string
 */
export function pad(string, length) {
	const remaining = length - string.length;

	for (let i = 0; i < remaining; i++) {
		string = " " + string;
	}

	return string;
}
