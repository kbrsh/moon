import { compile } from "./compiler/compiler";
import { component } from "./component/component";
import { components } from "./component/components";
import { config } from "./util/config";

export default function Moon(data) {
	let root = data.root;
	delete data.root;

	if (typeof root === "string") {
		root = document.querySelector(root);
	}

	const instanceComponent = component("", data);
	const instance = new instanceComponent();

	instance.create(root);
	instance.update();

	return instance;
}

Moon.extend = (name, data) => {
	components[name] = component(name, data);
};

Moon.compile = compile;
Moon.config = config;
