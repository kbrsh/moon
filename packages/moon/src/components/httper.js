import event from "moon/src/event";
import { httpEventsLoad, httpEventsError } from "moon/src/wrappers/http";

/**
 * HTTP component
 */
export default data => m => {
	const http = m.http;

	for (const name in data) {
		const request = data[name];

		if ("onLoad" in request) {
			httpEventsLoad[name] = event(request.onLoad);
		}

		if ("onError" in request) {
			httpEventsError[name] = event(request.onError);
		}

		http[name] = {
			request,
			response: {
				status: null,
				headers: null,
				body: null
			}
		};
	}

	return m;
};
