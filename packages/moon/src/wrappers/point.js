export function pointCoordinates() {
	if (event === null || !(event instanceof MouseEvent)) {
		return null;
	} else {
		return {
			x: event.clientX,
			y: event.clientY
		};
	}
}
