import { main } from "moon/src/main";
import drivers from "moon/src/drivers/index";
import components from "moon/src/components/index";
import event from "moon/src/event";
import run from "moon/src/run";

/**
 * Moon
 *
 * Moon works by having components to transform states which drivers access to
 * transform and perform effects. For performance, the main component is ran on
 * events instead of every tick. As a result, drivers are called only when
 * needed.
 *
 * Drivers get data from builtin APIs and normalize it to store it in the
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
 * Hooking into local events through global listeners isn't always practical or
 * possible, so some APIs have wrapper implementations which create global
 * event buses.
 */
export default {
	main,
	drivers,
	components,
	event,
	run,
	version: process.env.MOON_VERSION
};
