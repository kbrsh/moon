/**
 * Wait for a time in seconds before executing an event callback.
 *
 * @param {number} delay
 */
export default function wait(delay) {
	return handler => {
		setTimeout(handler, delay);
	};
}
