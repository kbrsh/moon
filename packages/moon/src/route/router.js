/**
 * Returns a view given routes that map to views and the current route.
 *
 * @param {object} data
 * @returns {object} view
 */
export default function router(data) {
	const route = data.route;
	let routeSegment = "/";
	let routes = data.routes;

	for (let i = 1; i < route.length; i++) {
		const routeCharacter = route[i];

		if (routeCharacter === "/") {
			routes = (
				routeSegment in routes ?
					routes[routeSegment] :
					routes["/*"]
			)[1];
			routeSegment = "/";
		} else {
			routeSegment += routeCharacter;
		}
	}

	return (
		routeSegment in routes ?
			routes[routeSegment] :
			routes["/*"]
	)[0](data);
}
