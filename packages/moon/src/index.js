import { main } from "moon/src/main";
import event from "moon/src/event";
import run from "moon/src/run";
import wrappers from "moon/src/wrappers/index";
import drivers from "moon/src/drivers/index";
import components from "moon/src/components/index";

/**
 * Moon
 *
 * Moon works by having components to transform states which drivers access to
 * transform and perform effects. For performance, the main component is ran on
 * events instead of every tick. As a result, drivers are called only when
 * needed.
 *
 * Wrappers around APIs are used by drivers and components for portability.
 * They provide a uniform interface for interacting with devices through
 * JavaScript. Since local events aren't always practical or available,
 * wrappers can also create global event buses as a part of their uniform API.
 *
 * Drivers get data from wrapper APIs and normalize it to store it in the
 * state. They also set data using builtin APIs. This forms an isomorphism
 * between the Moon state and the builtin state. This isn't always possible, so
 * drivers can create global variables as a part of the builtin state to allow
 * an isomorphism.
 *
 * Components transform the Moon state `m`, which is accessed by drivers to
 * convert to builtin state, reflecting as effects in the real world. They are
 * also responsible for detecting events. They do this by hooking into the
 * event loop for global events, checking if it is relevant locally, and
 * running the component in their handler before running the main component.
 */
export default {
	main,
	event,
	run,
	wrappers,
	drivers,
	components,
	version: process.env.MOON_VERSION
};
