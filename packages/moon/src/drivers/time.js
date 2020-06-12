import { timeNow } from "moon/src/wrappers/time";

/**
 * Time driver
 */
export default {
	get: timeNow,
	set() {}
};
