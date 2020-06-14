/**
 * Keyboard pressed state
 */
let keyboardPressedState = null;

/**
 * Get the pressed keys on the keyboard.
 *
 * @returns {object} keyboard event
 */
export function keyboardPressed() {
	if (event !== null && event instanceof KeyboardEvent) {
		keyboardPressedState = event;
	}

	return keyboardPressedState;
}
