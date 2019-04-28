/**
 * Global variable number
 */
export let generateVariable;

/**
 * Global static variable number
 */
export let generateStatic = 0;

/**
 * Set variable number to a new number.
 *
 * @param {number} newGenerateVariable
 */
export function setGenerateVariable(newGenerateVariable) {
	generateVariable = newGenerateVariable;
}

/**
 * Set static variable number to a new number.
 *
 * @param {number} newGenerateStatic
 */
export function setGenerateStatic(newGenerateStatic) {
	generateStatic = newGenerateStatic;
}
