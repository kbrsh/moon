/**
 * Global data
 */
export let data;

/**
 * Global views
 */
export let viewOld, viewNew, viewCurrent;

/**
 * Global component store
 */
export const components = {};

/**
 * Set data to a new object.
 * @param {Object} dataNew
 */
export function setData(dataNew) {
	data = dataNew;
}

/**
 * Set old view to a new object.
 * @param {Object} viewOld
 */
export function setViewOld(viewOldNew) {
	viewOld = viewOldNew;
}

/**
 * Set new view to a new object.
 * @param {Object} viewOld
 */
export function setViewNew(viewNewNew) {
	viewNew = viewNewNew;
}

/**
 * Set current view to a new function.
 * @param {Function} viewCurrentNew
 */
export function setViewCurrent(viewCurrentNew) {
	viewCurrent = viewCurrentNew;
}
