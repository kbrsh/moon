/*
 * Match HTTP headers.
 */
const headerRE = /^([^:]+):\s*([^]*?)\s*$/gm;

/**
 * Sends HTTP requests. Multiple HTTP requests can be implemented with multiple
 * requests in the array, and subsequent HTTP requests can be implemented with
 * another HTTP request once a response is received.
 *
 * @param {array} requests
 */
export default function send(requests) {
	// Make the HTTP requests.
	for (let i = 0; i < requests.length; i++) {
		const request = requests[i];
		const xhr = new XMLHttpRequest();

		// Handle response types.
		xhr.responseType = "responseType" in request ? request.responseType : "text";

		// Handle load event.
		if ("onLoad" in request) {
			xhr.onload = () => {
				const responseHeaders = {};
				const responseHeadersText = xhr.getAllResponseHeaders();
				let responseHeader;

				// Parse headers to object.
				while ((responseHeader = headerRE.exec(responseHeadersText)) !== null) {
					responseHeaders[responseHeader[1]] = responseHeader[2];
				}

				// Run load event handler.
				request.onLoad({
					status: xhr.status,
					headers: responseHeaders,
					body: xhr.response
				});
			};
		}

		// Handle error event.
		if ("onError" in request) {
			xhr.onerror = request.onError;
		}

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
