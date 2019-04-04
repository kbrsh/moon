import { lex } from "./compiler/lexer/lexer";
import { parse } from "./compiler/parser/parser";
import { generate } from "./compiler/generator/generator";
import { compile } from "./compiler/compiler";
import { components } from "./component/components";
import { defaultValue, error, noop } from "./util/util";
import { config } from "./util/config";

/**
 * Moon
 *
 * Creates a new Moon constructor based on given data. Each Moon component is
 * independent and has no knowledge of the parent. A component has the sole
 * function of mapping data to a view. A component starts by creating a view
 * with data. Every time data is set to a new object, the component updates
 * with the new data. Each of these methods are created from compiling the view
 * into vanilla JavaScript running on a lightweight Moon runtime. The built-in
 * components can all be implemented in user space, but some are optimized and
 * implemented in the compiler.
 *
 * The data can have a `name` property with a string representing the name of
 * the component, "Root" by default.
 *
 * The data can have a `root` property with an element. Moon will automatically
 * create a new instance and mount it to the root element provided.
 *
 * The data must have a `view` property with a string template or precompiled
 * functions.
 *
 * Optional `onCreate`, `onUpdate`, and `onDestroy` hooks can be in the data
 * and are called when their corresponding event occurs.
 *
 * The rest of the data is custom starting state that will be modified as the
 * component is passed different values. It can contain properties and methods
 * of any type, and will have access to various utilities for creating a new
 * state.
 *
 * @param {Object} data
 * @param {string} [data.name="Root"]
 * @param {Node|string} [data.root]
 * @param {Function|string} data.view
 * @param {Function} [data.onCreate]
 * @param {Function} [data.onUpdate]
 * @param {Function} [data.onDestroy]
 * @returns {MoonComponent} Moon constructor or instance
 */
export default function Moon(data) {
	// Initialize the component constructor with the given data.
	function MoonComponent() {}
	MoonComponent.prototype = data;

	// Handle the optional `name` parameter.
	data.name = defaultValue(data.name, "Root");

	// Ensure the view is defined, and compile it if needed.
	let view = data.view;

	if (view === undefined) {
		error(`The ${data.name} component requires a "view" property.`);
	}

	if (typeof view === "string") {
		view = compile(view);
	}

	data.view = view;

	// Create default events at the beginning so that checks before calling them
	// aren't required.
	data.onCreate = defaultValue(data.onCreate, noop);
	data.onUpdate = defaultValue(data.onUpdate, noop);
	data.onDestroy = defaultValue(data.onDestroy, noop);

	// If a `root` option is given, create a new instance and mount it.
	let root = data.root;
	delete data.root;

	if (typeof root === "string") {
		root = document.querySelector(root);
	}

	if (root === undefined) {
		components[name] = MoonComponent;
		return MoonComponent;
	} else {
		const instance = new MoonComponent();
		instance.create(root);
		return instance;
	}
}

Moon.lex = lex;
Moon.parse = parse;
Moon.generate = generate;
Moon.compile = compile;
Moon.config = config;
