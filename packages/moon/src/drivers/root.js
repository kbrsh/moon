/**
 * Root state
 *
 * This includes the route. In theory, keys, scroll, and selection states would
 * belong here, but they are made implicit in practice to prevent performance
 * and accessibility issues.
 */
let state = {
	route: location.pathname
};

export default {
	get() {
		return state;
	},
	set(root) {
		state = root;
	}
};
