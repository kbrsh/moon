import root from "moon/src/components/root";
import element from "moon/src/components/element";
import router from "moon/src/components/router";
import timer from "moon/src/components/timer";
import httper from "moon/src/components/httper";
import { names } from "util/index";

const components = {};

for (let i = 0; i < names.length; i++) {
	const name = names[i];

	switch (name) {
		case "root": {
			components.root = root;

			break;
		}

		case "element": {
			components.element = element;

			break;
		}

		case "router": {
			components.router = router;

			break;
		}

		case "timer": {
			components.timer = timer;

			break;
		}

		case "httper": {
			components.httper = httper;

			break;
		}

		default: {
			components[name] = element(name);
		}
	}
}

export default components;
