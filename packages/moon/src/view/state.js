/**
 * Global old view.
 */
export let viewOld = null;

/**
 * Global old view element.
 */
export let viewOldElement = null;

/**
 * Update the old view.
 *
 * @param {object} viewOldNew
 */
export function viewOldUpdate(viewOldNew) {
	viewOld = viewOldNew;
}

/**
 * Update the old view element.
 *
 * @param {object} viewOldElementNew
 */
export function viewOldElementUpdate(viewOldElementNew) {
	viewOldElement = viewOldElementNew;
}
