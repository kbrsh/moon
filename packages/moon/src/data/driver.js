/*
 * Current global data
 */
let data;

/**
 * Data driver
 *
 * The application components are usually a function of data. This data holds
 * application state. Every time an application is executed, it is passed new
 * data and returns driver outputs that correspond to it. These driver outputs
 * should be fast, pure, functions that are cheap to call and easy to optimize
 * through caching and memoization.
 */
export default {
	input() {
		// Return the stored data as input.
		return data;
	},
	output(dataNew) {
		// Update the stored data when it is an output.
		data = dataNew;
	}
};
