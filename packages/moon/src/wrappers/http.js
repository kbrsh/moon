/**
 * Load events
 */
export const httpEventsLoad = {};

/**
 * Error events
 */
export const httpEventsError = {};

/**
 * Make an HTTP request.
 *
 * This is a wrapper around the XMLHttpRequest API that allows access to events
 * through a global object. Drivers usually access normal JavaScript APIs to
 * access their data and normalize it, but the normal API doesn't allow hooking
 * into load and error events, so they use this wrapper instead.
 *
 * @param {string} name
 * @param {object} request
 * @param {function} onLoad
 * @param {function} onError
 */
export function httpRequest(name, request, onLoad, onError) {
	const xhr = new XMLHttpRequest();

	// Handle response types.
	xhr.responseType = "responseType" in request ? request.responseType : "text";

	// Handle load event.
	xhr.onload = () => {
		onLoad(xhr);

		if (name in httpEventsLoad) {
			httpEventsLoad[name]();
		}
	};

	// Handle error event.
	xhr.onerror = () => {
		onError();

		if (name in httpEventsError) {
			httpEventsError[name]();
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
