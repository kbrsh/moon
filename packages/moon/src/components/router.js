/**
 * Router component
 */
export default data => m => {
	const route = m.root.route;
	let routeSegment = "/";

	for (let i = 1; i < route.length; i++) {
		const routeCharacter = route[i];

		if (routeCharacter === "/") {
			data = (
				routeSegment in data ?
					data[routeSegment] :
					data["/*"]
			)[1];
			routeSegment = "/";
		} else {
			routeSegment += routeCharacter;
		}
	}

	return (
		routeSegment in data ?
			data[routeSegment] :
			data["/*"]
	)[0](m);
};
