import configure from "moon/src/configure";
import data from "moon/src/data/index";
import view from "moon/src/view/index";
import time from "moon/src/time/index";
import storage from "moon/src/storage/index";
import http from "moon/src/http/index";
import route from "moon/src/route/index";

const Moon = {
	configure,
	data,
	http,
	route,
	storage,
	time,
	use,
	version: process.env.MOON_VERSION,
	view
};

/**
 * Register custom transformers.
 *
 * @param {object} transformers
 */
function use(transformers) {
	for (const transformer in transformers) {
		Moon[transformer] = transformers[transformer];
	}
}

export default Moon;
