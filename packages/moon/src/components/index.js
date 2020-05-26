import root from "moon/src/components/root";
import element from "moon/src/components/element";
import router from "moon/src/components/router";
import httper from "moon/src/components/httper";
import timer from "moon/src/components/timer";
import { names } from "util/index";

const components = {
	root,
	element,
	router,
	httper,
	timer
};

for (let i = 0; i < names.length; i++) {
	const name = names[i];
	components[name] = element(name);
}

export default components;
