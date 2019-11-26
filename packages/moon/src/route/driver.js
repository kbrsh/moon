/**
 * Current route
 */
let route = location.pathname;

/**
 * Route driver
 *
 * The route driver provides current route path as input. For output, it takes
 * a new route as a string and changes the route in the browser as a result. It
 * also provides a Link component along with a Router component that can be
 * used to display different views based on a route.
 */
export default {
	input() {
		// Return the current route as input.
		return route;
	},
	output(routeNew) {
		// Change the browser route to the new route given as output.
		route = routeNew;
		history.pushState(route);
	}
};
