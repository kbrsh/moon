import { compile } from "./compiler/compiler";
import { component } from "./component/component";
import { components } from "./component/components";
import { config } from "./util/config";

export default function Moon(options) {
	const instanceComponent = component("", options);
	const instance = new instanceComponent();

	let root = instance.root;
	delete instance.root;

	if (typeof root === "string") {
		root = document.querySelector(root);
	}

	instance.create(root);
	instance.update();

	return instance;
}

Moon.extend = (name, options) => {
	components[name] = component(name, options);
};

Moon.compile = compile;
Moon.config = config;
