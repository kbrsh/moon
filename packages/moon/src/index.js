import { lex } from "./compiler/lexer/lexer";
import { parse } from "./compiler/parser/parser";
import { generate } from "./compiler/generator/generator";
import { compile } from "./compiler/compiler";
import { execute } from "./executor/executor";
import { components, data, setData, setViewCurrent, setViewOld } from "./util/globals";
import { defaultObject, defaultValue, error, merge, types } from "./util/util";

/**
 * Updates the global data and view.
 * @param {Object} dataNew
 */
function set(dataNew) {
	merge(data, dataNew);
	execute();
}

/**
 * Moon
 *
 * Creates a new Moon component or root based on given options. Each Moon
 * component is independent and has no knowledge of the parent. A component is
 * a function mapping data to a view. The component can update global data to
 * recreate the view. In Moon, the view is defined as a function over data, and
 * components are just helper functions.
 *
 * The data can have a `root` property with an element. Moon will automatically
 * create the component and append it to the root element provided. This makes
 * the data the source of true state that is accessible for updates by every
 * component.
 *
 * The data must have a `view` property with a string template or precompiled
 * functions.
 *
 * The rest of the data is custom and can be thought of as a default. This data
 * is immutable, and the component updates global data instead of having local
 * state.
 *
 * @param {Object} options
 * @param {string} [options.name]
 * @param {Node|string} [options.root]
 * @param {Object|string} options.view
 */
export default function Moon(options) {
	// Handle the optional `name` parameter.
	const name = defaultValue(options.name, "Root");
	delete options.name;

	// Ensure the view is defined, and compile it if needed.
	let view = options.view;
	delete options.view;

	if (process.env.MOON_ENV === "development" && view === undefined) {
		error(`The ${name} component requires a "view" property.`);
	}

	if (typeof view === "string") {
		view = compile(view);
	}

	// If a `root` option is given, start the root renderer, or else just return
	// the component.
	const root =
		typeof options.root === "string" ?
		document.querySelector(options.root) :
		options.root;

	delete options.root;

	if (root === undefined) {
		components[name] = (data) => view(defaultObject(data, options));
	} else {
		setViewOld({
			type: types.element,
			name: root.tagName,
			data: {
				children: []
			},
			node: root
		});
		setViewCurrent(view);
		setData(options);
		execute();
	}
}

Moon.lex = lex;
Moon.parse = parse;
Moon.generate = generate;
Moon.compile = compile;
Moon.components = components;
Moon.set = set;
