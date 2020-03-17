export default {
	get() {
		return localStorage;
	},
	set(localStorageNew) {
		for (const keyNew in localStorageNew) {
			const valueNew = localStorageNew[keyNew];

			if (localStorage[keyNew] !== valueNew) {
				localStorage[keyNew] = valueNew;
			}
		}

		for (const keyOld in localStorage) {
			if (!(keyOld in localStorageNew)) {
				delete localStorage[keyOld];
			}
		}
	}
};
