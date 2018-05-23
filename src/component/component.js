import { m } from "../util/m";

const create = function(root) {
  this.view[0](root);
  this.emit("created");
};

const update = function(key, value) {
  if (key !== undefined) {
    if (typeof key === "object") {
      for (let childKey in key) {
        this.data[childKey] = key[childKey];
      }
    } else {
      this.data[key] = value;
    }
  }

  if (this.queued === false) {
    this.queued = true;

    const instance = this;
    setTimeout(() => {
      instance.view[1]();
      instance.queued = false;
      instance.emit("updated");
    }, 0);
  }
};

const destroy = function() {
  this.view[2]();
  this.emit("destroyed");
};

const on = function(type, handler) {
  let data = this.data;
  let handlers = data[type];

  if (handlers === undefined) {
    data[type] = handler;
  } else if (typeof handlers === "function") {
    data[type] = [handlers, handler];
  } else {
    handlers.push(handler);
  }
};

const off = function(type, handler) {
  if (handler === undefined) {
    this.data[type] = [];
  } else {
    let data = this.data;
    let handlers = data[type];

    if (typeof handlers === "function") {
      data[type] = undefined;
    } else {
      handlers.splice(handlers.indexOf(handler), 1);
    }
  }
};

const emit = function(type, data) {
  let handlers = this.data[type];

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
    this.name = name;
    this.queued = false;

    this.view = options.view.map((view) => view.bind(this));
    this.m = m();

    let data = this.data = options.data();
    let actions = options.actions;
    for (let action in actions) {
      data[action] = actions[action].bind(this);
    }

    this.create = create;
    this.update = update;
    this.destroy = destroy;
    this.on = on;
    this.off = off;
    this.emit = emit;
  };
};
