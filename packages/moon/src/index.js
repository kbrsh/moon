import { lex } from "./compiler/lexer/lexer";
import { parse } from "./compiler/parser/parser";
import { generate } from "./compiler/generator/generator";
import { compile } from "./compiler/compiler";
import { defaultObject, defaultValue, error, noop } from "./util/util";

/**
 * Global component store.
 */
const components = {};

/**
 * Moon
 *
 * Creates a new Moon constructor based on given data. Each Moon component is
 * independent and has no knowledge of the parent. A component has the sole
 * function of mapping data to a view. A component starts by creating a view
 * with data. Every time data is set to a new object, the component updates
 * with the new data. Each of these methods are created from compiling the view
 * into vanilla JavaScript running on a lightweight Moon runtime.
 *
 * The data can have a `name` property with a string representing the name of
 * the component, "Root" by default.
 *
 * The data can have a `root` property with an element. Moon will automatically
 * create the component and append it to the root element provided.
 *
 * The data must have a `view` property with a string template or precompiled
 * functions.
 *
 * Optional `onCreate`, `onUpdate`, and `onDestroy` hooks can be
 * in the data and are called when their corresponding event occurs.
 *
 * The rest of the data is custom starting state. This data is immutable, and
 * the component updates itself with new modified copies of the data.
 *
 * @param {Object} data
 * @param {string} [data.name="Root"]
 * @param {Node|string} [data.root]
 * @param {Object|string} data.view
 * @param {Function} [data.onCreate]
 * @param {Function} [data.onUpdate]
 * @param {Function} [data.onDestroy]
 * @returns {Object} Moon component
 */
export default function Moon(data) {
	// Handle the optional `name` parameter.
	data.name = defaultValue(data.name, "Root");

	// Create default events at the beginning so that checks before calling them
	// aren't required.
	data.onCreate = defaultValue(data.onCreate, noop);
	data.onUpdate = defaultValue(data.onUpdate, noop);
	data.onDestroy = defaultValue(data.onDestroy, noop);

	// Ensure the view is defined, and compile it if needed.
	let view = data.view;

	delete data.view;

	if (process.env.MOON_ENV === "development" && view === undefined) {
		error(`The ${data.name} component requires a "view" property.`);
	}

	if (typeof view === "string") {
		view = compile(view);
	}

	// Initialize the component object with the view functions.
	const component = {
		create(_data) {
			view.create(defaultObject(_data, data));
			_data.onCreate(_data);
		},
		update(_data) {
			view.update(_data);
			_data.onUpdate(_data);
		},
		destroy(_data) {
			view.destroy(_data);
			_data.onDestroy(_data);
		}
	};

	// If a `root` option is given, create the component on the root, or else
	// just return the component.
	if (typeof data.root === "string") {
		data.root = document.querySelector(data.root);
	}

	if (data.root === undefined) {
		components[data.name] = component;

		return component;
	} else {
		component.create({}, (element) => {
			root.appendChild(element);
		});

		return component;
	}
}

Moon.lex = lex;
Moon.parse = parse;
Moon.generate = generate;
Moon.compile = compile;
Moon.components = components;
