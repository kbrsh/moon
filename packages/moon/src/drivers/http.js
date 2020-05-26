import { httpRequest } from "moon/src/wrappers/http";

/**
 * Match HTTP headers.
 */
const headerRE = /^([^:]+):\s*([^]*?)\s*$/gm;

/**
 * Global HTTP state
 */
let state = {};

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
				httpRequest(name, data.request, xhr => {
					const responseHeaders = {};
					const responseHeadersText = xhr.getAllResponseHeaders();
					let responseHeader;

					// Parse headers to object.
					while ((responseHeader = headerRE.exec(responseHeadersText)) !== null) {
						responseHeaders[responseHeader[1]] = responseHeader[2];
					}

					data.response = {
						status: xhr.status,
						headers: responseHeaders,
						body: xhr.response
					};
				}, () => {
					data.response = {
						status: 0,
						headers: null,
						body: null
					};
				});
			}
		}
	}
};
