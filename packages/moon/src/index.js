import { lex } from "./compiler/lexer/lexer";
import { parse } from "./compiler/parser/parser";
import { generate } from "./compiler/generator/generator";
import { compile } from "./compiler/compiler";
import { execute } from "./executor/executor";
import { components, data, m, setViewCurrent, setViewOld } from "./util/globals";
import { defaultValue, error, types } from "./util/util";

/**
 * Moon
 *
 * Creates a new Moon component or root based on given options. Each Moon
 * component is independent and has no knowledge of the parent. A component is
 * a function mapping data to a view. The component can update global data to
 * recreate the view. In Moon, the view is defined as a function over data, and
 * components are just helper functions.
 *
 * The options can have a `root` property with an element. Moon will
 * automatically create the component and append it to the root element
 * provided if the component name is "Root". This makes the data the source of
 * true state that is accessible for updates by every component.
 *
 * The options must have a `view` property with a string template or
 * precompiled functions.
 *
 * The `data` option is custom and can be thought of as a default. This data is
 * immutable, and the component updates global data instead of having local
 * state.
 *
 * @param {Object} options
 * @param {string} [options.name]
 * @param {Object|string} [options.root]
 * @param {Object} [options.data]
 * @param {Object|string} options.view
 */
export default function Moon(options) {
	// Handle the optional `name` parameter.
	const name = defaultValue(options.name, "Root");

	// Handle the optional default `data`.
	const dataDefault = defaultValue(options.data, {});

	// Ensure the view is defined, and compile it if needed.
	let view = options.view;

	if (process.env.MOON_ENV === "development" && view === undefined) {
		error(`The ${name} component requires a "view" property.`);
	}

	if (typeof view === "string") {
		view = new Function("m", "data", compile(view));
	}

	// Create a list of static nodes for the view function.
	m[name] = [];

	// Create a wrapper view function that maps data to the compiled view
	// function. The compiled view function takes `m`, which holds static nodes.
	// The data is also processed so that `dataDefault` acts as a default.
	const viewComponent = (data) => {
		for (let key in dataDefault) {
			if (!(key in data)) {
				data[key] = dataDefault[key];
			}
		}

		return view(m[name], data);
	};

	if (name === "Root") {
		// Mount to the `root` element and begin execution when the component is
		// the "Root" component.
		let root = options.root;

		if (typeof root === "string") {
			root = document.querySelector(root);
		}

		if (process.env.MOON_ENV === "development" && root === undefined) {
			error("The \"Root\" component requires a \"root\" property.");
		}

		// Start the root renderer.
		const rootAttributes = root.attributes;
		const dataNode = {
			children: []
		};

		for (let i = 0; i < rootAttributes.length; i++) {
			const rootAttribute = rootAttributes[i];
			dataNode[rootAttribute.name] = rootAttribute.value;
		}

		setViewOld({
			node: {
				type: types.element,
				name: root.tagName.toLowerCase(),
				data: dataNode
			},
			element: root,
			children: []
		});
		setViewCurrent(viewComponent);
		execute(dataDefault);
	} else {
		// Store it as a component if no `root` is given.
		components[name] = viewComponent;
	}
}

Moon.lex = lex;
Moon.parse = parse;
Moon.generate = generate;
Moon.compile = compile;
Moon.components = components;
Moon.get = data;
Moon.set = execute;
