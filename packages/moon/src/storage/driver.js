/*
 * Current storage
 */
let storage = {};

for (const key in localStorage) {
	if (localStorage.hasOwnProperty(key)) {
		storage[key] = localStorage[key];
	}
}

/**
 * Storage driver
 *
 * The storage driver allows applications to receive input from local storage
 * and persist string key/value pairs in local storage.
 */
export default {
	input() {
		// Return the local storage as input.
		return storage;
	},
	output(storageNew) {
		// Update the local storage when it is an output.
		for (const keyNew in storageNew) {
			const valueNew = storageNew[keyNew];

			if (storage[keyNew] !== valueNew) {
				localStorage[keyNew] = valueNew;
			}
		}

		// Remove any items that aren't in the new local storage.
		for (const keyOld in storage) {
			if (!(keyOld in storageNew)) {
				delete localStorage[keyOld];
			}
		}

		// Update the global storage reference.
		storage = storageNew;
	}
};
