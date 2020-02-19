import Moon from "moon/src/index";

/**
 * Register custom transformers.
 *
 * @param {object} transformers
 */
export default function use(transformers) {
	for (const transformer in transformers) {
		Moon[transformer] = transformers[transformer];
	}
}
