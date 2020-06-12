import { storageState } from "moon/src/wrappers/storage";

/**
 * Storage driver
 */
export default {
	get() {
		return storageState;
	},
	set(storage) {
		for (const key in storage) {
			const value = storage[key];

			if (!(key in storageState) || value !== storageState[key]) {
				storageState[key] = value;
			}
		}

		for (const key in storageState) {
			if (!(key in storage)) {
				delete storageState[key];
			}
		}
	}
};
