import { timeWait } from "moon/src/wrappers/time";

/**
 * Timer component
 */
export default data => m => {
	for (const delay in data) {
		timeWait(delay, data[delay]);
	}

	return m;
};
