/**
 * Point coordinate state
 */
let pointCoordinatesState = null;

/**
 * Get the coordinates of the pointer.
 *
 * @returns {object} coordinates
 */
export function pointCoordinates() {
	if (event !== null && event instanceof MouseEvent) {
		pointCoordinatesState = {
			x: event.clientX,
			y: event.clientY
		};
	}

	return pointCoordinatesState;
}
