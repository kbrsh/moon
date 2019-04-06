import { lex } from "./compiler/lexer/lexer";
import { parse } from "./compiler/parser/parser";
import { generate } from "./compiler/generator/generator";
import { compile } from "./compiler/compiler";
import { components } from "./components/components";
import { error } from "./util/util";

/**
 * Creates a view mounted on the given root element.
 *
 * @param {Node} root
 */
function create(root) {
	this.view.create(root);
	this.emit("create");
}

/**
 * Updates data and the view.
 *
 * @param {Object} data
 */
function update(data) {
	for (let key in data) {
		this[key] = data[key];
	}

	this.view.update();
	this.emit("update");
}

/**
 * Destroys the view.
 */
function destroy() {
	this.view.destroy();
	this.emit("destroy");
}

/**
 * Add an event handler to listen to a given event type.
 *
 * @param {string} type
 * @param {Function} handler
 */
function on(type, handler) {
	const handlers = this.events[type];

	if (handlers === undefined) {
		this.events[type] = [handler.bind(this)];
	} else {
		handlers.push(handler.bind(this));
	}
}

/**
 * Remove an event handler from a given event type. If no type or handler are
 * given, all event handlers are removed. If only a type is given, all event
 * handlers for that type are removed. If both a type and handler are given,
 * the handler stops listening to that event type.
 *
 * @param {string} [type]
 * @param {Function} [handler]
 */
function off(type, handler) {
	if (type === undefined) {
		this.events = {};
	} else if (handler === undefined) {
		this.events[type] = [];
	} else {
		const handlers = this.events[type];
		handlers.splice(handlers.indexOf(handler), 1);
	}
}

/**
 * Emits an event and calls any handlers listening to it with the given data.
 *
 * @param {string} type
 * @param data
 */
function emit(type, data) {
	const handlers = this.events[type];

	for (let i = 0; i < handlers.length; i++) {
		handlers[i](data);
	}
}

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
 * Optional `onCreate`, `onUpdate`, and `onDestroy` hooks can be
 * in the data and are called when their corresponding event occurs.
 *
 * The rest of the data is custom starting state that will be modified as the
 * component is passed different values. It can contain properties and methods
 * of any type, and will have access to various utilities for creating a new
 * state.
 *
 * @param {Object} data
 * @param {string} [data.name="Root"]
 * @param {Node|string} [data.root]
 * @param {Object|string} data.view
 * @param {Function} [data.onCreate]
 * @param {Function} [data.onUpdate]
 * @param {Function} [data.onDestroy]
 * @returns {MoonComponent} Moon constructor or instance
 */
export default function Moon(data) {
	// Handle the optional `name` parameter.
	data.name = data.name === undefined ? "Root" : data.name;

	// Ensure the view is defined, and compile it if needed.
	let view = data.view;
	delete data.view;

	if (process.env.MOON_ENV === "development" && view === undefined) {
		error(`The ${data.name} component requires a "view" property.`);
	}

	if (typeof view === "string") {
		view = compile(view);
	}

	// Create default events at the beginning so that checks before calling them
	// aren't required.
	const onCreate = data.onCreate;
	const onUpdate = data.onUpdate;
	const onDestroy = data.onDestroy;

	delete data.onCreate;
	delete data.onUpdate;
	delete data.onDestroy;

	data.events = {
		create: [],
		update: [],
		destroy: []
	};

	if (onCreate !== undefined) {
		data.events.create.push(onCreate);
	}

	if (onUpdate !== undefined) {
		data.events.update.push(onUpdate);
	}

	if (onDestroy !== undefined) {
		data.events.destroy.push(onDestroy);
	}

	// Initialize the component constructor with the given data, given view, and
	// default methods.
	function MoonComponent() {
		this.view = view();
	}

	MoonComponent.prototype = data;
	MoonComponent.prototype.create = create;
	MoonComponent.prototype.update = update;
	MoonComponent.prototype.destroy = destroy;
	MoonComponent.prototype.on = on;
	MoonComponent.prototype.off = off;
	MoonComponent.prototype.emit = emit;

	// If a `root` option is given, create a new instance and mount it, or else
	// just return the constructor.
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
