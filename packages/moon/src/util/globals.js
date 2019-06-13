/**
 * Global data
 */
export const data = {};

/**
 * Global views
 */
export let viewOld, viewCurrent, viewNew;

/**
 * Global component store
 */
export const components = {};

/**
 * Global static component views
 */
export const m = {};

/**
 * Set old view to a new object.
 *
 * @param {Object} viewOld
 */
export function setViewOld(viewOldNew) {
	viewOld = viewOldNew;
}

/**
 * Set current view to a new function.
 *
 * @param {Function} viewCurrentNew
 */
export function setViewCurrent(viewCurrentNew) {
	viewCurrent = viewCurrentNew;
}


/**
 * Set new view to a new object.
 *
 * @param {Object} viewNewNew
 */
export function setViewNew(viewNewNew) {
	viewNew = viewNewNew;
}
