import root from "moon/src/components/root";
import { element, elementEmpty } from "moon/src/components/element";
import router from "moon/src/components/router";
import timer from "moon/src/components/timer";
import httper from "moon/src/components/httper";
import { namesElement, namesElementEmpty } from "util/index";

const components = {
	root,
	router,
	timer,
	httper
};

for (let i = 0; i < namesElement.length; i++) {
	const name = namesElement[i];
	components[name] = element(name);
}

for (let i = 0; i < namesElementEmpty.length; i++) {
	const name = namesElementEmpty[i];
	components[name] = elementEmpty(name);
}

export default components;
