export default {
	get() {
		return location.pathname;
	},
	set(routeNew) {
		history.pushState(null, "", routeNew);
	}
};
