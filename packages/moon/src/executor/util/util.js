/**
 * Cache for default property values
 */
const removeDataPropertyCache = {};

/**
 * Update an ariaset, dataset, or style property.
 *
 * @param {Object} element
 * @param {string} key
 * @param {Object} value
 */
export function updateDataSet(element, key, value) {
	if (key === "ariaset") {
		// Set aria-* attributes.
		for (const setKey in value) {
			element.setAttribute("aria-" + setKey, value[setKey]);
		}
	} else {
		// Set data-* and style attributes.
		const set = element[key];

		for (const setKey in value) {
			set[setKey] = value[setKey];
		}
	}
}

/**
 * Remove a data property.
 *
 * @param {Object} element
 * @param {string} key
 */
export function removeDataProperty(element, name, key) {
	const defaultName =
		name in removeDataPropertyCache ?
		removeDataPropertyCache[name] :
		(removeDataPropertyCache[name] = {});

	element[key] =
		key in defaultName ?
		defaultName[key] :
		(defaultName[key] = document.createElement(name)[key]);
}

/**
 * Remove all the keys from an ariaset, dataset, or style property that aren't
 * in `exclude`.
 *
 * @param {Object} element
 * @param {string} key
 * @param {string} value
 * @param {Object} exclude
 */
export function removeDataSet(element, key, value, exclude) {
	for (const setKey in value) {
		if (!(setKey in exclude)) {
			switch (key) {
				case "ariaset":
					element.removeAttribute("aria-" + setKey);
					break;
				case "dataset":
					delete element.dataset[setKey];
					break;
				default:
					element.style[setKey] = "";
			}
		}
	}
}
