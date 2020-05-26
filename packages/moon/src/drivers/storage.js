/**
 * Storage driver
 */
export default {
	get() {
		return localStorage;
	},
	set(storage) {
		for (const key in storage) {
			const value = storage[key];

			if (!(key in localStorage) || value !== localStorage[key]) {
				localStorage[key] = value;
			}
		}

		for (const key in localStorage) {
			if (!(key in storage)) {
				delete localStorage[key];
			}
		}
	}
};
