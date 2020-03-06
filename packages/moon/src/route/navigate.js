/**
 * Navigates to a new route.
 *
 * @param {string} routeNew
 */
export default function navigate(routeNew) {
	history.pushState(null, "", routeNew);
}
