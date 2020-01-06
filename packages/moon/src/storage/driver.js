/**
 * Storage driver
 *
 * The storage driver allows applications to receive input from local storage
 * and persist string key/value pairs in local storage.
 */
export default {
	input() {
		// Return the local storage as input.
		return localStorage;
	},
	output(localStorageNew) {
		// Update the local storage when it is an output.
		for (const keyNew in localStorageNew) {
			const valueNew = localStorageNew[keyNew];

			if (localStorage[keyNew] !== valueNew) {
				localStorage[keyNew] = valueNew;
			}
		}

		// Remove any items that aren't in the new local storage.
		for (const keyOld in localStorage) {
			if (!(keyOld in localStorageNew)) {
				delete localStorage[keyOld];
			}
		}
	}
};
