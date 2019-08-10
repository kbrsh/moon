import run from "moon/src/run";

/**
 * Time driver
 *
 * The time driver provides time information as input. For output, it takes an
 * object mapping timeouts to functions, and runs those functions after those
 * timeouts. This can be used to implement intervals through a recursive
 * timeout function.
 */
export default {
	input() {
		// Return the time as input.
		return Date.now();
	},
	output(timeouts) {
		// Set the given timeouts.
		for (const delay in timeouts) {
			setTimeout(() => {
				run(timeouts[delay]);
			}, delay);
		}
	}
};
