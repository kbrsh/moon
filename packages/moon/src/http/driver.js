import run from "moon/src/run";

/*
 * Current global response
 */
let response = null;

/*
 * Match HTTP headers.
 */
const headerRE = /^([^:]+):\s*([^]*?)\s*$/gm;

/**
 * HTTP driver
 *
 * The HTTP driver provides HTTP response information as input. For output, it
 * takes an array of requests. Multiple HTTP requests can be implemented with
 * multiple request in the array, and subsequent HTTP requests can be
 * implemented with another HTTP request once a response is received.
 */
export default {
	input() {
		// Return the response as output.
		return response;
	},
	output(requests) {
		// Make the HTTP requests.
		for (let i = 0; i < requests.length; i++) {
			const request = requests[i];
			const xhr = new XMLHttpRequest();

			// Handle response types.
			xhr.responseType = "responseType" in request ? request.responseType : "text";

			// Handle load event.
			xhr.onload = () => {
				const responseHeaders = {};
				const responseHeadersText = xhr.getAllResponseHeaders();
				let responseHeader;

				// Parse headers to object.
				while ((responseHeader = headerRE.exec(responseHeadersText)) !== null) {
					responseHeaders[responseHeader[1]] = responseHeader[2];
				}

				// Create response object.
				response = {
					status: xhr.status,
					headers: responseHeaders,
					body: xhr.response
				};

				// Run load event handler if it exists.
				if ("onLoad" in request) {
					run(request.onLoad);
				}
			};

			// Handle error event.
			xhr.onerror = () => {
				// Reset response to prevent older response from being available.
				response = null;

				// Run error event handler if it exists.
				if ("onError" in request) {
					run(request.onError);
				}
			};

			// Open the request with the given method and URL.
			xhr.open(
				"method" in request ? request.method : "GET",
				request.url
			);

			// Set request headers.
			if ("headers" in request) {
				const requestHeaders = request.headers;

				for (const requestHeader in requestHeaders) {
					xhr.setRequestHeader(requestHeader, requestHeaders[requestHeader]);
				}
			}

			// Send the request with the given body.
			xhr.send("body" in request ? request.body : null);
		}
	}
};
