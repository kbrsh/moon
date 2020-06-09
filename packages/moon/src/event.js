import { m, mSet } from "moon/src/m";
import { componentMain } from "moon/src/main";
import drivers from "moon/src/drivers/index";

/**
 * Return an event handler that runs a component transformer before running the
 * main component.
 *
 * @param {function} component
 * @returns {function} event handler
 */
export default function event(component) {
	return () => {
		for (const driver in drivers) {
			m[driver] = drivers[driver].get();
		}

		mSet(componentMain(component(m)));

		for (const driver in drivers) {
			drivers[driver].set(m[driver]);
		}
	};
}
