/**
 * Global data state.
 */
let state = null;

/**
 * Data driver
 */
export default {
	get() {
		return state;
	},
	set(data) {
		state = data;
	}
};
