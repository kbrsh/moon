import view from "moon/src/view/index";
import route from "moon/src/route/index";
import m from "moon/src/m/index";

export default {
	m,
	route,
	version: process.env.MOON_VERSION,
	view
};
