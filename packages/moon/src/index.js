import { lex } from "./compiler/lexer/lexer";
import { parse } from "./compiler/parser/parser";
import { generate } from "./compiler/generator/generator";
import { compile } from "./compiler/compiler";
import { execute } from "./executor/executor";
import { components, md, ms, setViewOld } from "./util/globals";
import { defaultValue, error, NodeNew, NodeOld, types } from "./util/util";

/**
 * Moon
 *
 * Creates a new Moon component or root based on given options. Each Moon
 * component is independent and has no knowledge of the parent. A component is
 * a function mapping data and children to a view. The component can update
 * global data to recreate the view. In Moon, the view is defined as a function
 * over data and children, and components are just helper functions.
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

	// Store the default data.
	const dataDefault = options.data;

	// Ensure the view is defined, and compile it if needed.
	let view = options.view;

	if (process.env.MOON_ENV === "development" && view === undefined) {
		error(`The ${name} component requires a "view" property.`);
	}

	if (typeof view === "string") {
		view = new Function("m", "md", "mc", "ms", compile(view));
	}

	// Create a list of static nodes for the view function.
	ms[name] = [];


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

		// Create the root component view.
		components.Root = view;

		// Start the root renderer.
		const rootAttributes = root.attributes;
		const dataNode = {};

		for (let i = 0; i < rootAttributes.length; i++) {
			const rootAttribute = rootAttributes[i];
			dataNode[rootAttribute.name] = rootAttribute.value;
		}

		setViewOld(new NodeOld(
			new NodeNew(
				types.element,
				root.tagName.toLowerCase(),
				dataNode,
				[]
			),
			root,
			[]
		));
		execute(defaultValue(dataDefault, {}));
	} else {
		// Create a wrapper view function that processes default data if needed.
		components[name] =
			dataDefault === undefined ?
			view :
			(m, md, mc, ms) => {
				for (const key in dataDefault) {
					if (!(key in md)) {
						md[key] = dataDefault[key];
					}
				}

				return view(m, md, mc, ms);
			};
	}
}

Moon.lex = lex;
Moon.parse = parse;
Moon.generate = generate;
Moon.compile = compile;
Moon.components = components;
Moon.get = md;
Moon.set = execute;
