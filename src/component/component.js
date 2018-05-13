import { m } from "../util/m";

const build = function() {
  if (this.queued === false) {
    this.queued = true;

    const instance = this;
    setTimeout(() => {
      instance.view[2]();
      instance.queued = false;
    }, 0);
  }
};

const set = function(key, value) {
  if (typeof key === "object") {
    for (let childKey in key) {
      this.set(childKey, key[childKey]);
    }
  } else {
    this.data[key] = value;
    this.build();
  }
};

export const component = (name, options) => {
  return function MoonComponent() {
    this.name = name;

    this.view = options.view.map((view) => view.bind(this));
    this.m = m();

    let data = this.data = options.data();
    let actions = options.actions;
    for (let action in actions) {
      data[action] = actions[action].bind(this);
    }

    this.queued = false;
    this.build = build;
    this.set = set;
  };
};
