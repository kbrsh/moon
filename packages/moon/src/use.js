import { error } from "util/index";

/**
 * Application drivers
 */
export let drivers;

/**
 * Sets the application drivers to new drivers.
 *
 * @param {object} driversNew
 */
export function use(driversNew) {
	// Handle invalid drivers type.
	if (process.env.MOON_ENV === "development" && typeof driversNew !== "object") {
		error(`Drivers parameter with an invalid type.

Attempted to store the "drivers" parameter for use during execution.

Received an invalid drivers argument:
	${driversNew}

	The given drivers have an invalid type:
		${typeof driversNew}

Expected the drivers to be an object with keys as driver names and values as drivers.`);
	}

	drivers = driversNew;
}
