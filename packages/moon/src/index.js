import data from "moon/src/drivers/data/data";
import view from "moon/src/drivers/view/view";
import { execute, setExecuteDrivers } from "moon/src/executor/executor";
import { error } from "util/util";

/**
 * Moon
 *
 * Creates a new Moon application based on a root application and drivers. A
 * Moon application takes inputs and returns outputs -- it's just a function.
 * The input and output effects are created by drivers, individual modules
 * responsible for controlling the outside world. Ideally, these would be
 * standard and implemented by the browser, operating system, and computer
 * itself.
 *
 * Drivers control things like state data, the DOM view, timing events,
 * animation frames, HTTP requests, dates, audio, etc. They are all implemented
 * separately from Moon, but Moon ships with data and view drivers by default.
 * A driver is an object with input and output functions. The input function
 * reads data from the outside world and returns it, while the output function
 * takes the driver output returned by the application and performs effects on
 * the outside world.
 *
 * Instead of components, Moon views are just functions. They usually take a
 * `data` object as a parameter and return Moon elements, but can technically
 * be implemented with any structure.
 *
 * When events occur, they are detected by the application, and it returns the
 * value of an event handler instead. These happen with events from any driver.
 * Event handlers are applications as well, but since everything is a function,
 * they can use the root application within their own implementation.
 *
 * Essentially, Moon aims to remove unnecessary abstractions like local state,
 * imperative event handlers, or reactive state subscriptions. Instead, it
 * embraces a purely functional approach with support for drivers to interact
 * with the imperative API often offered by the containing environment.
 *
 * @param {Function} root
 * @param {Object} drivers
 */
export default function Moon(root, drivers) {
	// Handle invalid types.
	if (process.env.MOON_ENV === "development" && typeof root !== "function") {
		error(`Root parameter with an invalid type.

Attempted to execute the "root" parameter as an application.

Received an invalid root argument:
	${root}

	The given root has an invalid type:
		${typeof root}

Expected the root to be a function that takes driver inputs as parameters and returns driver outputs.`);
	}

	if (process.env.MOON_ENV === "development" && typeof drivers !== "object") {
		error(`Drivers parameter with an invalid type.

Attempted to store the "drivers" parameter for use during execution.

Received an invalid drivers argument:
	${drivers}

	The given drivers have an invalid type:
		${typeof drivers}

Expected the drivers to be an object with keys as driver names and values as functions that take driver inputs as parameters and return driver outputs.`);
	}

	// Begin execution.
	setExecuteDrivers(drivers);
	execute(root);
}

Moon.data = data;
Moon.view = view;
Moon.execute = execute;
