import { httpRequest } from "moon/src/wrappers/http";

/**
 * Global HTTP state
 */
let state = {};

/**
 * Create event handler for http request.
 *
 * @param {object} data
 * @returns {function} handler
 */
function httpHandler(data) {
	return response => {
		data.response = response;
	};
}

/**
 * HTTP driver
 */
export default {
	get() {
		return state;
	},
	set(http) {
		state = http;

		for (const name in state) {
			const data = state[name];

			if (data.response.status === null) {
				httpRequest(name, data.request, httpHandler(data));
			}
		}
	}
};
