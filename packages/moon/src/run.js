import { m, mSet } from "moon/src/m";
import { componentMain } from "moon/src/main";
import drivers from "moon/src/drivers/index";

export default function run() {
	for (const driver in drivers) {
		m[driver] = drivers[driver].get();
	}

	mSet(componentMain(m));

	for (const driver in drivers) {
		drivers[driver].set(m[driver]);
	}
}
