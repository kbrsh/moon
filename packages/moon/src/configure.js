import Moon from "moon/src/index";

/**
 * Configure transformers.
 *
 * @param {object} options
 */
export default function configure(options) {
	for (const transformer in options) {
		Moon[transformer].configure(options[transformer]);
	}
}
