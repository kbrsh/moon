import { viewRoot, viewPatch } from "moon/src/wrappers/view";

/**
 * View driver
 */
export default {
	get() {
		return viewRoot;
	},
	set: viewPatch
};
