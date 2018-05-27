import { m } from "../util/m";

const create = function(root) {
  this.view[0](root);
  this.emit("create");
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
      instance.emit("update");
    }, 0);
  }
};

const destroy = function() {
  this.view[2]();
  this.emit("destroy");
};

const on = function(type, handler) {
  let events = this.events;
  let handlers = events[type];

  if (handlers === undefined) {
    events[type] = handler;
  } else if (typeof handlers === "function") {
    events[type] = [handlers, handler];
  } else {
    handlers.push(handler);
  }
};

const off = function(type, handler) {
  if (type === undefined) {
    this.events = {};
  } else if (handler === undefined) {
    this.events[type] = [];
  } else {
    let events = this.events;
    let handlers = events[type];

    if (typeof handlers === "function") {
      events[type] = undefined;
    } else {
      handlers.splice(handlers.indexOf(handler), 1);
    }
  }
};

const emit = function(type, data) {
  let handlers = this.events[type];

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

    const data = this.data = options.data();
    for (let key in data) {
      const value = data[key];
      if (typeof value === "function") {
        data[key] = value.bind(this);
      }
    }

    const events = this.events = options.events;
    for (let type in events) {
      const handlers = events[type];
      if (typeof handlers === "function") {
        events[type] = handlers.bind(this);
      } else {
        for (let i = 0; i < handlers.length; i++) {
          handlers[i] = handlers[i].bind(this);
        }
      }
    }

    this.create = create;
    this.update = update;
    this.destroy = destroy;
    this.on = on;
    this.off = off;
    this.emit = emit;
  };
};
