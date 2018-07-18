import { parse } from "./compiler/parser/parser";
import { generate } from "./compiler/generator/generator";
import { compile } from "./compiler/compiler";
import { component } from "./component/component";
import { components } from "./component/components";
import { config } from "./util/config";

export default function Moon(options) {
	let root = options.root;
	delete options.root;

	if (typeof root === "string") {
		root = document.querySelector(root);
	}

	const instanceComponent = component("", options);
	const instance = new instanceComponent();

	instance.create(root);
	instance.update();

	return instance;
}

Moon.extend = (name, options) => {
	components[name] = component(name, options);
};

Moon.parse = parse;
Moon.generate = generate;
Moon.compile = compile;
Moon.config = config;
