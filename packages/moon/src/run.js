import { drivers } from "moon/src/use";
import { error } from "util/index";

/**
 * Run
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
 * separately from Moon, but Moon comes with some drivers by default. A driver
 * is an object with input and output functions. The input function reads data
 * from the outside world and returns it, while the output function takes the
 * driver output returned by the application and performs effects on the
 * outside world.
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
 * The application runs on the Moon while drivers update the Earth.
 *
 * @param {function} application
 */
export default function run(application) {
	// Handle invalid root type.
	if (process.env.MOON_ENV === "development" && typeof application !== "function") {
		error(`Application parameter with an invalid type.

Attempted to execute an application function.

Received an invalid application argument:
	${application}

	The given application has an invalid type:
		${typeof application}

Expected the application to be a function that takes driver inputs as parameters and returns driver outputs.`);
	}

	// Get inputs from all drivers.
	const input = {};

	for (const driver in drivers) {
		if (process.env.MOON_ENV === "development" && !("input" in drivers[driver])) {
			error(`Use of a driver without an "input" function.

Attempted to execute a driver to receive inputs:
	${driver}

Received a driver without an "input" function:
	${drivers[driver]}

Expected the driver to be an object with "input" and "output" functions.`);
		}

		input[driver] = drivers[driver].input();
	}

	// Get the application output.
	const output = application(input);

	// Execute drivers with the outputs.
	for (const driver in output) {
		if (process.env.MOON_ENV === "development" && !(driver in drivers)) {
			error(`Use of an unknown driver.

Attempted to execute a driver to receive outputs:
		${driver}

Received an undefined value when fetching the driver from the given drivers.

Expected the driver to be defined.`);
		}

		if (process.env.MOON_ENV === "development" && !("output" in drivers[driver])) {
			error(`Use of a driver without an "output" function.

Attempted to execute a driver to receive outputs:
	${driver}

Received a driver without an "output" function:
	${drivers[driver]}

Expected the driver to be an object with "input" and "output" functions.`);
		}

		drivers[driver].output(output[driver]);
	}
}
