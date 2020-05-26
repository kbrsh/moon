import element from "moon/src/components/element";

const elementDiv = element("div");

/**
 * Root component
 */
export default data => m => {
	// Update view using root.
	const route = m.root.route;

	if (route !== location.pathname) {
		history.pushState(null, "", route);
	}

	return elementDiv(data)(m);
};
