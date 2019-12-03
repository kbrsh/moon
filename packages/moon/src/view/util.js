/**
 * Cache for default property values
 */
const removeDataPropertyCache = {};

/**
 * Remove a data property.
 *
 * @param {Object} element
 * @param {string} key
 */
export function removeDataProperty(element, name, key) {
	element[key] =
		name in removeDataPropertyCache ?
		removeDataPropertyCache[name][key] :
		(removeDataPropertyCache[name] = document.createElement(name))[key];
}
