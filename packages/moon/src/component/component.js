import { compile } from "../compiler/compiler";
import { m } from "../util/m";

const create = function(root) {
	this._view[0](root);
	this.emit("create");
};

const update = function(key, value) {
	if (key !== undefined) {
		if (typeof key === "object") {
			for (let childKey in key) {
				this[childKey] = key[childKey];
			}
		} else {
			this[key] = value;
		}
	}

	if (this._queued === false) {
		this._queued = true;

		const instance = this;
		setTimeout(() => {
			instance._view[1]();
			instance._queued = false;
			instance.emit("update");
		}, 0);
	}
};

const destroy = function() {
	this._view[2]();
	this.emit("destroy");
};

const on = function(type, handler) {
	let events = this._events;
	let handlers = events[type];

	if (handlers === undefined) {
		events[type] = [handler.bind(this)];
	} else {
		handlers.push(handler.bind(this));
	}
};

const off = function(type, handler) {
	if (type === undefined) {
		this._events = {};
	} else if (handler === undefined) {
		this._events[type] = [];
	} else {
		let handlers = this._events[type];
		handlers.splice(handlers.indexOf(handler), 1);
	}
};

const emit = function(type, data) {
	let handlers = this._events[type];

	if (handlers !== undefined) {
		for (let i = 0; i < handlers.length; i++) {
			handlers[i](data);
		}
	}
};

export const component = (name, data) => {
	// View
	let view = data.view;
	if (typeof view === "string") {
		view = new Function("m", "instance", "locals", compile(view));
	}

	delete data.view;

	// Events
	let onCreate = data.onCreate;
	let onUpdate = data.onUpdate;
	let onDestroy = data.onDestroy;

	delete data.onCreate;
	delete data.onUpdate;
	delete data.onDestroy;

	// Constructor
	function MoonComponent() {
		this._view = view(m, this, {});

		this._events = {};

		if (onCreate !== undefined) {
			this.on("create", onCreate);
		}

		if (onUpdate !== undefined) {
			this.on("update", onUpdate);
		}

		if (onDestroy !== undefined) {
			this.on("destroy", onDestroy);
		}
	}

	// Initialize
	MoonComponent.prototype = data;

	// Properties
	data._name = name;
	data._queued = false;

	// Methods
	data.create = create;
	data.update = update;
	data.destroy = destroy;
	data.on = on;
	data.off = off;
	data.emit = emit;

	return MoonComponent;
};
