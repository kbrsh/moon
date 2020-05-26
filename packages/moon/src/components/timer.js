import event from "moon/src/event";

/**
 * Timer component
 */
export default data => m => {
	for (const delay in data) {
		setTimeout(event(data[delay]), delay);
	}

	return m;
};
