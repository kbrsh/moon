/**
 * Returns a view given routes that map to views and the current route.
 *
 * @param {object} data
 * @returns {object} view
 */
export default function router(data) {
	const route = data.route;
	let routeSegment = "/";

	const routes = data.routes;
	let routesCurrent = routes;
	let routesCurrentView;

	for (let i = 1; i <= route.length; i++) {
		const routeCharacter = route[i];

		if (routeCharacter === undefined || routeCharacter === "/") {
			const routesCurrentValue = routeSegment in routesCurrent ? routesCurrent[routeSegment] : routesCurrent["/*"];
			routesCurrent = routesCurrentValue[1];
			routesCurrentView = routesCurrentValue[0];
			routeSegment = "/";
		} else {
			routeSegment += routeCharacter;
		}
	}

	return routesCurrentView(data);
}
