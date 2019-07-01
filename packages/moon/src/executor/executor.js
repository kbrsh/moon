import { error } from "util/util";

/**
 * Execution drivers.
 */
let executeDrivers;

/**
 * Sets the execution drivers to new drivers.
 *
 * @param {Object} executeDriversNew
 */
export function setExecuteDrivers(executeDriversNew) {
	executeDrivers = executeDriversNew;
}

/**
 * Executor
 *
 * The executor is responsible for providing an interface for applications to
 * interact with drivers. Drivers have an input and output function. The input
 * function is responsible for reading data from the outside world and
 * providing it to the application. On the other hand, the output function
 * takes the output of an application meant for the driver and performs an
 * action that changes the outside world: an effect.
 *
 * An application runs on the Moon while drivers update the Earth.
 *
 * @param {Function} root
 */
export function execute(root) {
	// Get inputs from all drivers.
	const executeInput = {};

	for (const executeDriver in executeDrivers) {
		if (process.env.MOON_ENV === "development" && !("input" in executeDrivers[executeDriver])) {
			error(`Use of a driver without an "input" function.

Attempted to execute a driver to receive inputs:
	${executeDriver}

Received a driver without an "input" function:
	${executeDrivers[executeDriver]}

Expected the driver to be an object with "input" and "output" functions.`);
		}

		executeInput[executeDriver] = executeDrivers[executeDriver].input();
	}

	// Get the application output.
	const executeOutput = root(executeInput);

	// Execute drivers with the outputs.
	for (const executeDriver in executeOutput) {
		if (process.env.MOON_ENV === "development" && !(executeDriver in executeDrivers)) {
			error(`Use of an unknown driver.

Attempted to execute an application function:
	${root.name}

	The function attempted to output to a driver:
		${executeDriver}: ${executeOutput[executeDriver]}

Received an undefined value when fetching the driver from the given drivers.

Expected the driver to be defined.`);
		}

		if (process.env.MOON_ENV === "development" && !("output" in executeDrivers[executeDriver])) {
			error(`Use of a driver without an "output" function.

Attempted to execute a driver to receive outputs:
	${executeDriver}

Received a driver without an "output" function:
	${executeDrivers[executeDriver]}

Expected the driver to be an object with "input" and "output" functions.`);
		}

		executeDrivers[executeDriver].output(executeOutput[executeDriver]);
	}
}
