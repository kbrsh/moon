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
		events[type] = [handler];
	} else {
		handlers.push(handler);
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
		if (typeof handlers === "function") {
			handlers(data);
		} else {
			for (let i = 0; i < handlers.length; i++) {
				handlers[i](data);
			}
		}
	}
};

export const component = (name, options) => {
	return function MoonComponent() {
		// Properties
		this._name = name;
		this._queued = false;

		// Options
		let data;
		if (options === undefined) {
			data = {};
		} else if (typeof options === "function") {
			data = options();
		} else {
			data = options;
		}

		// View
		if (typeof data.view === "string") {
			this._view = new Function("m", "instance", "locals", compile(data.view))(m, this, {});
		} else {
			this._view = data.view(m, this, {});
		}

		delete data.view;

		// Events
		let events = {};

		if (data.onCreate !== undefined) {
			events.create = data.onCreate.bind(this);
			delete data.onCreate;
		}

		if (data.onUpdate !== undefined) {
			events.update = data.onUpdate.bind(this);
			delete data.onUpdate;
		}

		if (data.onDestroy !== undefined) {
			events.destroy = data.onDestroy.bind(this);
			delete data.onDestroy;
		}

		this._events = events;

		// Data
		for (let key in data) {
			const value = data[key];
			if (typeof value === "function") {
				this[key] = value.bind(this);
			} else {
				this[key] = value;
			}
		}

		// Methods
		this.create = create;
		this.update = update;
		this.destroy = destroy;
		this.on = on;
		this.off = off;
		this.emit = emit;
	};
};
