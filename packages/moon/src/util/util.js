import { config } from "./config";

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
export function defaultValue(value, fallback) {
	return value === undefined ? fallback : value;
}

/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
	if (config.silent === false) {
		console.error("[Moon] ERROR: " + message);
	}
}
